import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { User } from '../model/user.entity';
import { NetlifyDbService } from '../../shared/services/netlify-db.service';

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

  constructor(private http: HttpClient, private netlifyDb: NetlifyDbService) {}

  getProfile(profileId: string | number): Observable<User> {
    // Lectura desde Netlify/Neon
    return this.netlifyDb.getById('users', profileId) as Observable<User>;
  }

  createProfile(user: User): Observable<User> {
    return this.http.post<User>(`${this.basePath}/users`, user, this.httpOptions);
  }

  updateProfile(profileId: string | number, user: User): Observable<User> {
    return this.http.put<User>(`${this.basePath}/users/${profileId}`, user, this.httpOptions);
  }

  deleteProfile(profileId: string | number): Observable<void> {
    return this.http.delete<void>(`${this.basePath}/users/${profileId}`, this.httpOptions);
  }

  getProfiles(): Observable<User[]> {
    return this.netlifyDb.getCollection('users') as Observable<User[]>;
  }
}
