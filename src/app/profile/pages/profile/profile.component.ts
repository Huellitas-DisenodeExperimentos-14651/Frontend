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
    MatProgressSpinnerModule
  ]
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  isEditMode = false;
  originalUser: User | null = null;
  isLoading = true;
  errorLoading = false;

  constructor(
    private router: Router,
    private userProfileService: UserProfileService,
    private authService: AuthenticationService,
    private snackBar: MatSnackBar
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
    if (!this.isEditMode && this.originalUser) {
      this.user = { ...this.originalUser };
    }
  }

  saveProfile(): void {
    if (this.user && this.user.id) {
      this.isLoading = true;
      const updatedUser = {
        ...this.user,
        preferences: this.user.preferencesString
          ? this.user.preferencesString.split(',').map(item => item.trim())
          : [],
        paymentMethods: this.user.paymentMethodsString
          ? this.user.paymentMethodsString.split(',').map(item => item.trim())
          : []
      };

      this.userProfileService.updateProfile(this.user.id, updatedUser).subscribe({
        next: (updatedUser) => {
          this.user = {
            ...updatedUser,
            preferencesString: updatedUser.preferences?.join(', ') || '',
            paymentMethodsString: updatedUser.paymentMethods?.join(', ') || ''
          };
          this.originalUser = { ...this.user };
          this.isEditMode = false;
          this.isLoading = false;
          this.showSuccess('Perfil actualizado correctamente');

          const currentUsername = this.user.name;
          this.authService.setSignedInState(true, this.user.id, currentUsername);
        },
        error: (err) => {
          console.error('Error updating profile:', err);
          this.isLoading = false;
          this.showError('Error al actualizar el perfil');
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
