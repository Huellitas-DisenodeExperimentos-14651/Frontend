import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // ✅ AÑADIDO: para redireccionar

import { AuthenticationService } from '../../services/authentication.service';
import { SignUpRequest } from '../../model/sign-up.request';
import { BaseFormComponent } from '../../../shared/components/base-form.component';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDividerModule,
    MatSelectModule,
    MatStepperModule,
    MatIconModule,
    RouterLink,
    TranslatePipe,
    MatSnackBarModule
  ],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent extends BaseFormComponent implements OnInit {
  accountFormGroup!: FormGroup;
  personalFormGroup!: FormGroup;
  preferencesFormGroup!: FormGroup;
  homeFormGroup!: FormGroup;

  submitted = false;

  constructor(
    private builder: FormBuilder,
    private authenticationService: AuthenticationService,
    private router: Router, // ✅ CORRECTO: servicio Router
    private snackBar: MatSnackBar
  ) {
    super();
  }

  ngOnInit(): void {
    this.accountFormGroup = this.builder.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });

    this.personalFormGroup = this.builder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address: ['', Validators.required],
      role: ['ADOPTER', Validators.required]
    });

    this.preferencesFormGroup = this.builder.group({
      paymentMethods: [''],
      preferences: ['']
    });

    this.homeFormGroup = this.builder.group({
      profilePic: [''],
      bio: [''],
      capacity: [1, [Validators.required, Validators.min(1)]],
      animalsAvailable: [0],
      homeType: [''],
      previousExperience: ['']
    });
  }

  onSubmit(): void {
    if (
      this.accountFormGroup.invalid ||
      this.personalFormGroup.invalid ||
      this.homeFormGroup.invalid
    ) return;

    const request: SignUpRequest = {
      ...this.accountFormGroup.value,
      ...this.personalFormGroup.value,
      ...this.preferencesFormGroup.value,
      ...this.homeFormGroup.value,
      paymentMethods: this.preferencesFormGroup.value.paymentMethods
        ? this.preferencesFormGroup.value.paymentMethods.split(',').map((m: string) => m.trim())
        : [],
      preferences: this.preferencesFormGroup.value.preferences
        ? this.preferencesFormGroup.value.preferences.split(',').map((p: string) => p.trim())
        : [],
      capacity: Number(this.homeFormGroup.value.capacity),
      animalsAvailable: Number(this.homeFormGroup.value.animalsAvailable)
    };

    this.authenticationService.signUp(request).subscribe({
      next: () => {
        this.snackBar.open('¡Registro exitoso! Bienvenido a Patita Solidaria 🐾', 'Cerrar', {
          duration: 4000,
          panelClass: ['snackbar-success']
        });
        this.router.navigate(['/sign-in']); // ✅ REDIRECCIÓN CORRECTA
      },
      error: (err) => {
        console.error('Error en registro:', err);
        this.snackBar.open('Hubo un error durante el registro. Intenta nuevamente.', 'Cerrar', {
          duration: 4000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }
}
