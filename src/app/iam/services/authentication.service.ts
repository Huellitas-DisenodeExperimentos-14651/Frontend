import { Injectable } from '@angular/core';
import { environment } from "../../../environments/environment";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { BehaviorSubject } from "rxjs";
import { Router } from "@angular/router";
import { SignInRequest } from "../model/sign-in.request";
import { SignInResponse } from "../model/sign-in.response";
import { SignUpRequest } from "../model/sign-up.request";
import { SignUpResponse } from "../model/sign-up.response";
import { of } from "rxjs";
import { delay } from "rxjs/operators";


@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  basePath: string = `${environment.serverBasePath}`;
  httpOptions = { headers: new HttpHeaders({'Content-type': 'application/json'}) };

  private signedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private signedInUserId: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  private signedInUsername: BehaviorSubject<string> = new BehaviorSubject<string>('');

  constructor(private router: Router, private http: HttpClient) { }

  get isSignedIn() {
    return this.signedIn.asObservable();
  }

  get currentUserId() {
    return this.signedInUserId.asObservable();
  }

  get currentUsername() {
    return this.signedInUsername.asObservable();
  }

  /**
   * Sign up a new user.
   */
  signUp(signUpRequest: SignUpRequest) {
    return this.http.post<SignUpResponse>(
      `${this.basePath}/authentication/sign-up`,
      signUpRequest,
      this.httpOptions
    );
  }

  /**
   * Sign in a user.
   * If environment.mockAuth = true, simulate login without backend.
   */
  signIn(signInRequest: SignInRequest) {
    if (environment['mockAuth']) {
      const fakeResponse: SignInResponse = {
        token: 'fake-jwt-token',
        id: 1,
        username: signInRequest.username,
        role: 'USER',
        profileId: 1
      };

      // Guardamos token simulado
      localStorage.setItem('token', fakeResponse.token);

      // Simulamos que hay un usuario logueado
      this.setSignedInState(true, fakeResponse.id, fakeResponse.username);

      // devolvemos observable con delay
      return of(fakeResponse).pipe(delay(300));
    }

    // 🔗 llamada real al backend
    return this.http.post<SignInResponse>(
      `${this.basePath}/authentication/sign-in`,
      signInRequest,
      this.httpOptions
    );
  }


  /**
   * Sign out a user.
   */
  signOut() {
    this.signedIn.next(false);
    this.signedInUserId.next(0);
    this.signedInUsername.next('');
    localStorage.removeItem('token');
    this.router.navigate(['/sign-in']).catch((error) => console.error('Navigation error:', error));
  }

  /**
   * Get the current authenticated user info from JWT token.
   */
  getCurrentUser(): { username: string; role: string; profileId: number } | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        username: payload.sub,
        role: payload.role,
        profileId: payload.profileId
      };
    } catch (error) {
      console.error('Error decoding token payload:', error);
      return null;
    }
  }

  /**
   * Establece el estado de sesión manualmente.
   */
  setSignedInState(isSignedIn: boolean, userId: number, username: string): void {
    this.signedIn.next(isSignedIn);
    this.signedInUserId.next(userId);
    this.signedInUsername.next(username);
  }

  getCurrentUserId(): number | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
}
