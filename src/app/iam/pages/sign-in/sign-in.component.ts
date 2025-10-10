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
    if (this.form.invalid) return;

    const {username, password} = this.form.value;
    const signInRequest = new SignInRequest(username, password);

    this.authenticationService.signIn(signInRequest).subscribe({
      next: (response) => {
        if (!response || response.length === 0) {
          // Usuario o contraseña incorrectos
          console.error('Usuario o contraseña incorrectos');
          // Aquí puedes mostrar un mensaje al usuario
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
      },
      error: (error) => {
        console.error('Error al iniciar sesión:', error);
      }
    });
  }
}
