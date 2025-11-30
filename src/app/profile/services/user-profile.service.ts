import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { User } from '../model/user.entity';
import { NetlifyDbService } from '../../shared/services/netlify-db.service';
import { map } from 'rxjs/operators';

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
    const id = user.id ? String((user as any).id) : `user_${Date.now()}`;
    const item = { ...user, id };
    return this.netlifyDb.mutate('create', 'users', item).pipe(map(() => item as User));
  }

  updateProfile(profileId: string | number, user: User): Observable<User> {
    const uid = String(profileId);
    const item = { ...user, id: uid };
    return this.netlifyDb.mutate('update', 'users', item, uid).pipe(map(() => item as User));
  }

  deleteProfile(profileId: string | number): Observable<void> {
    const uid = String(profileId);
    return this.netlifyDb.mutate('delete', 'users', undefined, uid).pipe(map(() => undefined));
  }

  getProfiles(): Observable<User[]> {
    return this.netlifyDb.getCollection('users') as Observable<User[]>;
  }
}
