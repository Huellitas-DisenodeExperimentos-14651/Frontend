import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

// Servicios y modelos
import { AuthenticationService } from '../../services/authentication.service';
import { SignInRequest } from '../../model/sign-in.request';

// Componente base
import { BaseFormComponent } from '../../../shared/components/base-form.component';

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import {TranslatePipe} from '@ngx-translate/core';
import { Router } from '@angular/router';

// RxJS
import { of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';


// Componentes internos

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDividerModule,
    TranslatePipe
  ],
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css']
})
export class SignInComponent extends BaseFormComponent implements OnInit {

  form!: FormGroup;
  submitted = false;
  // Mensaje de error visible en la UI
  errorMessage: string | null = null;

  constructor(
    private builder: FormBuilder,
    private authenticationService: AuthenticationService,
    private router: Router
  ) {
    super();
  }

  ngOnInit(): void {
    this.form = this.builder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    // resetear mensaje visible
    this.errorMessage = null;

    if (this.form.invalid) {
      // Mostrar un mensaje general si el formulario no es válido
      this.errorMessage = 'Por favor completa los campos requeridos.';
      return;
    }

    const {username, password} = this.form.value;

    // Primero comprobamos si el username existe para dar un mensaje claro
    this.authenticationService.usernameExists(username)
      .pipe(
        switchMap(exists => {
          if (!exists) {
            // Usuario no existe -> mostramos mensaje y cortamos el flujo
            this.errorMessage = 'El nombre de usuario no existe.';
            return of(null);
          }
          // Si existe, intentamos iniciar sesión (comprobación de contraseña)
          const signInRequest = new SignInRequest(username, password);
          return this.authenticationService.signIn(signInRequest);
        }),
        catchError(err => {
          console.error('Error durante comprobación de inicio de sesión:', err);
          this.errorMessage = 'Error al iniciar sesión. Inténtalo nuevamente.';
          return of(null);
        })
      )
      .subscribe(response => {
        if (response === null) {
          // ya se mostró mensaje previamente o hubo error; no continuar
          return;
        }

        if (!response || response.length === 0) {
          // Usuario existe pero las credenciales no coinciden => contraseña incorrecta
          this.errorMessage = 'Contraseña incorrecta.';
          return;
        }

        const user = response[0];
        // Guardar localStorage
        localStorage.setItem('token', 'fake-token'); // Puedes generar un token falso si lo necesitas
        localStorage.setItem('role', user.role);
        localStorage.setItem('username', user.username);
        localStorage.setItem('profileId', user.id.toString());

        // ✅ Actualiza estado global
        this.authenticationService.setSignedInState(true, user.id, user.username);

        // ✅ Redirige por rol
        if (user.role === 'SHELTER') {
          this.router.navigate(['/pets']);
        } else if (user.role === 'ADOPTER') {
          this.router.navigate(['/adoptions']);
        } else {
          this.router.navigate(['/']);
        }
      });
  }
}
