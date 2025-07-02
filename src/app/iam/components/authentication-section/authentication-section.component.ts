import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';
import { NgIf } from '@angular/common';
import { MatButton } from '@angular/material/button';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-authentication-section',
  standalone: true,
  imports: [
    NgIf,
    MatButton,
    TranslatePipe
  ],
  templateUrl: './authentication-section.component.html',
  styleUrls: ['./authentication-section.component.css']
})
export class AuthenticationSectionComponent {

  currentUserName: string = '';
  isSignedIn: boolean = false;

  constructor(private router: Router, private authenticationService: AuthenticationService) {
    // Subscrición a los servicios de autenticación
    this.authenticationService.currentUsername.subscribe(
      (username) => this.currentUserName = username
    );
    this.authenticationService.isSignedIn.subscribe(
      (isSignedIn) => this.isSignedIn = isSignedIn
    );
  }

  // Método para navegar a la página de Sign In
  onSignIn() {
    this.router.navigate(['/sign-in']);
  }

  // Método para navegar a la página de Sign Up
  onSignUp() {
    this.router.navigate(['/sign-up']);
  }

  // Método para cerrar sesión (Sign Out)
  onSignOut() {
    this.authenticationService.signOut();
    this.router.navigate(['/sign-in']); // Redirige a la página de inicio de sesión después de cerrar sesión
  }
}
