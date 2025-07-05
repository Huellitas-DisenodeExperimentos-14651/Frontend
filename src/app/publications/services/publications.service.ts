import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Publication {
  id: number;
  petId: number;
  title: string;
  description: string;
  contactInfo: string;
  location: string;
  publishedAt: string;
  isActive: boolean;
  photo?: string;
}

@Injectable({ providedIn: 'root' })
export class PublicationsService {
  private readonly api = `${environment.serverBasePath}/publications`;

  constructor(private http: HttpClient) {}

  getActive(): Observable<Publication[]> {
    return this.http.get<Publication[]>(`${this.api}/active`);
  }

  create(
    payload: Omit<Publication, 'id' | 'publishedAt' | 'isActive'>
  ): Observable<Publication> {
    return this.http.post<Publication>(this.api, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
