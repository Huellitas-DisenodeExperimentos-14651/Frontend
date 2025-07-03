import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { User } from '../model/user.entity';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private basePath = `${environment.serverBasePath}`; // Asegúrate que no tenga /api/v1 duplicado
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    })
  };

  constructor(private http: HttpClient) {}

  getProfile(profileId: number): Observable<User> {
    return this.http.get<User>(`${this.basePath}/profiles/${profileId}`, this.httpOptions);
  }

  createProfile(user: User): Observable<User> {
    return this.http.post<User>(this.basePath, user, this.httpOptions);
  }

  updateProfile(profileId: number, user: User): Observable<User> {
    return this.http.put<User>(`${this.basePath}/profiles/${profileId}`, user, this.httpOptions);
  }

  deleteProfile(profileId: number): Observable<void> {
    return this.http.delete<void>(`${this.basePath}/profiles/${profileId}`); // Usa /profiles/
  }

  getProfiles(): Observable<User[]> {
    return this.http.get<User[]>(this.basePath, this.httpOptions);
  }
}
