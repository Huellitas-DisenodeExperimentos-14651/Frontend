import { Component, OnInit, AfterViewInit, ElementRef, Renderer2 } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AsyncValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // ✅ AÑADIDO: para redireccionar

import { AuthenticationService } from '../../services/authentication.service';
import { SignUpRequest } from '../../model/sign-up.request';
import { BaseFormComponent } from '../../../shared/components/base-form.component';

// RxJS
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, debounceTime, distinctUntilChanged, catchError } from 'rxjs/operators';

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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';

import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PaymentMethodsDialogComponent } from './payment-methods-dialog.component';

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
    MatSnackBarModule,
    MatDialogModule,
    MatListModule,
    PaymentMethodsDialogComponent
  ],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent extends BaseFormComponent implements OnInit, AfterViewInit {
  accountFormGroup!: FormGroup;
  personalFormGroup!: FormGroup;
  preferencesFormGroup!: FormGroup;
  homeFormGroup!: FormGroup;

  submitted = false;

  paymentMethodsArray: Array<{ type: string; label?: string; data: any }> = [];

  constructor(
    private builder: FormBuilder,
    private authenticationService: AuthenticationService,
    private router: Router, // ✅ CORRECTO: servicio Router
    private snackBar: MatSnackBar,
    private el: ElementRef,
    private renderer: Renderer2,
    private dialog: MatDialog
  ) {
    super();
  }

  ngOnInit(): void {
    this.accountFormGroup = this.builder.group({
      username: ['', [Validators.required], [this.usernameExistsValidator()]],
      password: ['', [Validators.required, Validators.minLength(8), this.passwordStrengthValidator]]
    });

    this.personalFormGroup = this.builder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email], [this.emailExistsValidator()]],
      address: ['', Validators.required],
      role: ['ADOPTER', Validators.required]
    });

    this.preferencesFormGroup = this.builder.group({
      paymentMethods: [''],
      preferences: [''],
      paymentConfigured: [false, Validators.requiredTrue]
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

  ngAfterViewInit(): void {
    // Aplicar estilos inline para asegurar prioridad sobre otras reglas CSS
    this.applyInlineStylesToErrorsAndHints();
  }

  /**
   * Validador asíncrono que consulta el servicio para saber si el username ya existe.
   */
  private usernameExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const value = (control.value || '').trim();
      if (!value) return of(null);
      // Pequeño debounce para no bombardear el backend
      return timer(400).pipe(
        switchMap(() => this.authenticationService.usernameExists(value)),
        map(exists => (exists ? { usernameTaken: true } : null)),
        catchError(() => of(null))
      );
    };
  }

  /**
   * Validador asíncrono que consulta el servicio para saber si el email ya existe.
   */
  private emailExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const value = (control.value || '').trim();
      if (!value) return of(null);
      // Pequeño debounce para no bombardear el backend
      return timer(400).pipe(
        switchMap(() => this.authenticationService.emailExists(value)),
        map(exists => (exists ? { emailTaken: true } : null)),
        catchError(() => of(null))
      );
    };
  }

  /**
   * Validador síncrono de fortaleza de contraseña.
   * Requisitos: mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial.
   */
  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value: string = control.value || '';
    if (!value) return null;
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?"':{}|<>]/.test(value);
    const valid = value.length >= minLength && hasUpper && hasLower && hasNumber && hasSpecial;
    return valid ? null : { weakPassword: true };
  }

  private applyInlineStylesToErrorsAndHints(): void {
    try {
      const host: HTMLElement = this.el.nativeElement;
      const errorEls: NodeListOf<HTMLElement> = host.querySelectorAll('.custom-error, .mat-error');
      errorEls.forEach((el) => {
        this.renderer.setStyle(el, 'color', '#d32f2f', 2);
        this.renderer.setStyle(el, 'font-size', '0.78rem', 2);
        this.renderer.setStyle(el, 'line-height', '1.1', 2);
        this.renderer.setStyle(el, 'margin-top', '2px', 2);
      });

      const hintEls: NodeListOf<HTMLElement> = host.querySelectorAll('.custom-hint, .mat-hint');
      hintEls.forEach((el) => {
        // Si tiene la clase available-hint, usar verde
        if (el.classList.contains('available-hint')) {
          this.renderer.setStyle(el, 'color', '#2e7d32', 2);
          this.renderer.setStyle(el, 'font-size', '0.78rem', 2);
          this.renderer.setStyle(el, 'margin-top', '2px', 2);
        } else {
          this.renderer.setStyle(el, 'color', '#666', 2);
          this.renderer.setStyle(el, 'font-size', '0.75rem', 2);
          this.renderer.setStyle(el, 'margin-top', '2px', 2);
        }
      });
    } catch (err) {
      // no bloquear si Renderer falla por alguna razón
      // eslint-disable-next-line no-console
      console.warn('No se pudieron aplicar estilos inline a los errores/hints:', err);
    }
  }

  openPaymentDialog(): void {
    const ref = this.dialog.open(PaymentMethodsDialogComponent, {
      width: '420px',
      data: { methods: this.paymentMethodsArray }
    });

    ref.afterClosed().subscribe(result => {
      if (result === null) {
        // cancelado, no marcar como configurado
        return;
      }
      if (result === 'later') {
        // usuario eligió "Agregar más tarde" -> marcar como configurado para poder continuar
        this.preferencesFormGroup.get('paymentConfigured')?.setValue(true);
        this.paymentMethodsArray = [];
        this.preferencesFormGroup.get('paymentMethods')?.setValue('');
      } else if (Array.isArray(result)) {
        // result es un array de objetos {type,label,data}
        this.paymentMethodsArray = result as Array<{ type: string; label?: string; data: any }>;
        // guardar las etiquetas (labels) en el form para persistencia simple
        const labels = this.paymentMethodsArray.map(m => m.label || m.type || '');
        this.preferencesFormGroup.get('paymentMethods')?.setValue(labels.join(','));
        this.preferencesFormGroup.get('paymentConfigured')?.setValue(true);
      }
      // marcar touched para que el estado se actualice
      this.preferencesFormGroup.get('paymentConfigured')?.markAsTouched();
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
      // Enviamos los métodos completos (objetos con type/label/data) para que el backend tenga los detalles
      paymentMethods: this.paymentMethodsArray && this.paymentMethodsArray.length ? this.paymentMethodsArray : [],
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
