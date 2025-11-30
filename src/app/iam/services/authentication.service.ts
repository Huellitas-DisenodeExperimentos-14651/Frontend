import { Injectable } from '@angular/core';
import { environment } from "../../../environments/environment";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { BehaviorSubject } from "rxjs";
import { Router } from "@angular/router";
import { SignInRequest } from "../model/sign-in.request";
import { SignUpRequest } from "../model/sign-up.request";
import { SignUpResponse } from "../model/sign-up.response";
import { of } from "rxjs";
import { map, catchError } from 'rxjs/operators';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  basePath: string = `${environment.serverBasePath}`;
  httpOptions = { headers: new HttpHeaders({'Content-type': 'application/json'}) };

  private signedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private signedInUserId: BehaviorSubject<string | number | null> = new BehaviorSubject<string | number | null>(null);
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
   * Sign up a new user en la colección 'users' de db.json
   */
  signUp(signUpRequest: SignUpRequest) {
    // Se asume que signUpRequest tiene username, email y password
    return this.http.post<SignUpResponse>(
      `${this.basePath}/users`,
      signUpRequest,
      this.httpOptions
    );
  }

  /**
   * Sign in buscando usuario en la colección 'users' de db.json
   */
  signIn(signInRequest: SignInRequest) {
    // Buscar por username y password (o email y password)
    const query = `?username=${encodeURIComponent(signInRequest.username)}&password=${encodeURIComponent(signInRequest.password)}`;
    return this.http.get<any[]>(`${this.basePath}/users${query}`, this.httpOptions);
  }

  /**
   * Comprueba si un username ya existe en la colección 'users'.
   * Devuelve Observable<boolean> (true si existe).
   */
  public usernameExists(username: string): Observable<boolean> {
    if (!username) return of(false);
    const query = `?username=${encodeURIComponent(username)}`;
    return this.http.get<any[]>(`${this.basePath}/users${query}`, this.httpOptions)
      .pipe(
        map(users => Array.isArray(users) && users.length > 0),
        catchError(err => {
          console.error('usernameExists error:', err);
          // En caso de error, asumimos que no existe para no bloquear al usuario
          return of(false);
        })
      );
  }

  /**
   * Comprueba si un email ya existe en la colección 'users'.
   * Devuelve Observable<boolean> (true si existe).
   */
  public emailExists(email: string): Observable<boolean> {
    if (!email) return of(false);
    const query = `?email=${encodeURIComponent(email)}`;
    return this.http.get<any[]>(`${this.basePath}/users${query}`, this.httpOptions)
      .pipe(
        map(users => Array.isArray(users) && users.length > 0),
        catchError(err => {
          console.error('emailExists error:', err);
          // En caso de error, asumimos que no existe para no bloquear al usuario
          return of(false);
        })
      );
  }

  /**
   * Sign out a user.
   */
  signOut() {
    this.signedIn.next(false);
    this.signedInUserId.next(null);
    this.signedInUsername.next('');
    localStorage.removeItem('token');
    this.router.navigate(['/sign-in']).catch((error) => console.error('Navigation error:', error));
  }

  /**
   * Get the current authenticated user info from JWT token.
   */
  getCurrentUser(): { username: string; role: string; profileId: string | number } | null {
    const token = localStorage.getItem('token');
    // Si el token es falso, leer los datos directamente de localStorage
    if (token === 'fake-token') {
      const role = localStorage.getItem('role');
      const username = localStorage.getItem('username');
      const profileId = localStorage.getItem('profileId');
      if (role && username && profileId) {
        return {
          username,
          role,
          profileId: isNaN(Number(profileId)) ? profileId : Number(profileId)
        };
      }
      return null;
    }
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
  setSignedInState(isSignedIn: boolean, userId: string | number | null, username: string): void {
    this.signedIn.next(isSignedIn);
    this.signedInUserId.next(userId);
    this.signedInUsername.next(username);
  }

  getCurrentUserId(): string | number | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return isNaN(Number(payload.userId)) ? payload.userId : Number(payload.userId);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
}
