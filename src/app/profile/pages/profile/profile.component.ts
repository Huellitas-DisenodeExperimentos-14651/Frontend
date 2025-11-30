import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserProfileService } from '../../services/user-profile.service';
import { User } from '../../model/user.entity';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthenticationService } from '../../../iam/services/authentication.service';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { PaymentMethodsDialogComponent } from '../../../iam/pages/sign-up/payment-methods-dialog.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatCardModule,
    MatSnackBarModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatListModule,
    PaymentMethodsDialogComponent
  ]
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  isEditMode = false;
  originalUser: User | null = null;
  isLoading = true;
  errorLoading = false;

  // Nueva propiedad: contraseña de confirmación introducida por el usuario
  confirmPassword: string = '';
  passwordError: string | null = null;

  constructor(
    private router: Router,
    private userProfileService: UserProfileService,
    private authService: AuthenticationService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCurrentUserProfile();
  }

  loadCurrentUserProfile(): void {
    this.isLoading = true;
    this.errorLoading = false;

    const token = localStorage.getItem('token');
    let profileId: string | null = null;
    if (token === 'fake-token') {
      profileId = localStorage.getItem('profileId');
    } else if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        profileId = payload.profileId;
      } catch (error) {
        console.error('Error decoding token:', error);
        this.handleAuthError('Error de autenticación');
        return;
      }
    }

    // Usa el profileId como string, no lo conviertas a número
    if (!profileId) {
      this.handleAuthError('ID de perfil no encontrado');
      return;
    }

    this.userProfileService.getProfile(profileId).subscribe({
      next: (user) => {
        this.user = {
          ...user,
          preferencesString: user.preferences?.join(', ') || '',
          paymentMethodsString: user.paymentMethods?.join(', ') || ''
        };
        this.originalUser = { ...this.user };
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.isLoading = false;
        this.errorLoading = true;

        if (err.status === 401) {
          this.handleAuthError('Sesión expirada. Por favor inicia sesión nuevamente.');
        } else {
          this.showError('Error al cargar el perfil. Intenta nuevamente.');
        }
      }
    });
  }

  private handleAuthError(message: string): void {
    this.isLoading = false;
    this.errorLoading = true;
    this.showError(message);

    setTimeout(() => {
      this.authService.signOut();
      this.router.navigate(['/sign-in']);
    }, 3000);
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    this.passwordError = null;
    this.confirmPassword = '';
    if (!this.isEditMode && this.originalUser) {
      this.user = { ...this.originalUser };
    }
  }

  saveProfile(): void {
    if (this.user && this.user.id) {
      this.isLoading = true;

      // Primero verificamos en el servidor la contraseña actual para mayor seguridad
      this.userProfileService.getProfile(this.user.id).subscribe({
        next: (serverUser) => {
          const serverPassword = (serverUser as any).password; // password no está en la clase User del dominio, usar any

          if (!this.confirmPassword) {
            this.isLoading = false;
            this.passwordError = 'Debes ingresar tu contraseña actual para confirmar los cambios.';
            this.showError(this.passwordError);
            return;
          }

          if (serverPassword !== this.confirmPassword) {
            this.isLoading = false;
            this.passwordError = 'Contraseña incorrecta.';
            this.showError(this.passwordError);
            return;
          }

          // Contraseña verificada: procedemos a preparar el objeto a actualizar
          const updatedUser = {
            ...this.user,
            // Mantener métodos de pago tal como están en el servidor (no se editan aquí)
            paymentMethods: serverUser.paymentMethods || [],
            // Mantener contraseña original (no cambiamos contraseña desde aquí)
            password: (serverUser as any).password,
            preferences: this.user?.preferencesString
              ? this.user.preferencesString.split(',').map((item: string) => item.trim())
              : (serverUser.preferences || [])
          } as any;

          // Llamada de actualización
          this.userProfileService.updateProfile(this.user!.id, updatedUser).subscribe({
            next: (updatedUserResp) => {
              this.user = {
                ...updatedUserResp,
                preferencesString: updatedUserResp.preferences?.join(', ') || '',
                paymentMethodsString: updatedUserResp.paymentMethods?.join(', ') || ''
              } as any;
              this.originalUser = { ...(this.user as User) } as User; // evitar incompatibilidades de undefined
              this.isEditMode = false;
              this.isLoading = false;
              this.showSuccess('Perfil actualizado correctamente');

              const currentUsername = this.user!.name ?? '';
              this.authService.setSignedInState(true, this.user!.id, currentUsername);
            },
            error: (err) => {
              console.error('Error updating profile:', err);
              this.isLoading = false;
              this.showError('Error al actualizar el perfil');
            }
          });
        },
        error: (err) => {
          console.error('Error fetching profile for password check:', err);
          this.isLoading = false;
          this.showError('No fue posible confirmar la contraseña. Intenta nuevamente.');
        }
      });
    }
  }

  deleteProfile(): void {
    if (!localStorage.getItem('token')) {
      this.handleAuthError('Sesión expirada. Inicia sesión nuevamente.');
      return;
    }

    if (this.user?.id && confirm('¿Estás seguro de eliminar tu perfil?')) {
      this.isLoading = true;
      this.userProfileService.deleteProfile(this.user.id).subscribe({
        next: () => {
          this.isLoading = false;
          this.showSuccess('Perfil eliminado correctamente');
          this.authService.signOut();
          this.router.navigate(['/sign-in']);
        },
        error: (err) => {
          console.error('Error deleting profile:', err);
          this.isLoading = false;

          if (err.status === 401) {
            this.handleAuthError('No autorizado. ¿Tu sesión expiró?');
          } else {
            this.showError('Error al eliminar el perfil');
          }
        }
      });
    }
  }

  retryLoadProfile(): void {
    this.loadCurrentUserProfile();
  }

  // Navegar a la configuración de métodos de pago (ruta asumida)
  goToPaymentSettings(): void {
    // Supongo una ruta; si no existe, puedes indicarme la ruta real y la actualizo.
    this.router.navigate(['/profile/payment-methods']).catch(err => console.error(err));
  }

  // Nuevo: abrir diálogo para editar métodos de pago
  openPaymentMethodsDialog(): void {
    if (!this.user) return;

    // construir data para el diálogo a partir de las etiquetas existentes
    const existing = (this.user.paymentMethods || []).map(m => {
      // si la etiqueta contiene '•' puede ser 'Tipo • id' — no intentamos parse complejo, usamos label directo
      return { type: (typeof m === 'string' ? m.split(' ')[0] : 'OTHER'), label: String(m), data: { identifier: String(m) } };
    });

    const ref = this.dialog.open(PaymentMethodsDialogComponent, {
      width: '520px',
      data: { methods: existing }
    });

    ref.afterClosed().subscribe(result => {
      if (result === null) return; // cancelado

      if (result === 'later') {
        // marcar configurado pero sin métodos
        const updated = { ...this.user, paymentMethods: [], paymentConfigured: true } as any;
        this.userProfileService.updateProfile(this.user!.id, updated).subscribe({
          next: (u) => {
            this.user = { ...u, preferencesString: u.preferences?.join(', ') || '' } as any;
            this.originalUser = { ...(this.user as User) } as User;
            this.showSuccess('Preferencias de pago marcadas para agregar más tarde');
          },
          error: (err) => {
            console.error('Error guardando paymentConfigured:', err);
            this.showError('No se pudo guardar la configuración de métodos de pago');
          }
        });
        return;
      }

      if (Array.isArray(result)) {
        // convertir a etiquetas simples para guardar en el perfil (compatibilidad con db.json)
        const labels = (result as Array<{ type: string; label?: string; data: any }>).map(m => m.label || m.type || '');
        const updatedUser = { ...this.user, paymentMethods: labels, paymentConfigured: true } as any;

        this.userProfileService.updateProfile(this.user!.id, updatedUser).subscribe({
          next: (u) => {
            this.user = { ...u, preferencesString: u.preferences?.join(', ') || '' } as any;
            this.originalUser = { ...(this.user as User) } as User;
            this.showSuccess('Métodos de pago actualizados correctamente');
          },
          error: (err) => {
            console.error('Error guardando métodos de pago:', err);
            this.showError('No fue posible actualizar los métodos de pago');
          }
        });
      }
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }
}
