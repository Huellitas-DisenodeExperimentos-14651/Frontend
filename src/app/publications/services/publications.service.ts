import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';
import { NetlifyDbService } from '../../shared/services/netlify-db.service';

export interface Publication {
  id: number | string;
  petId: string | number;
  title: string;
  description: string;
  contactInfo: string;
  location: string;
  publishedAt: string;
  isActive: boolean;
  photo?: string;
  ownerId?: string; // id del usuario/refugio que creó la publicación
}

// Payload al crear: más flexible para permitir publishedAt/isActive/ownerId desde el cliente
export interface CreatePublicationPayload {
  petId: string | number;
  title: string;
  description: string;
  contactInfo: string;
  location: string;
  photo?: string;
  ownerId?: string;
  publishedAt?: string;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PublicationsService {
  private readonly api = `${environment.serverBasePath}/publications`;

  constructor(private http: HttpClient, private netlifyDb: NetlifyDbService) {}

  getActive(): Observable<Publication[]> {
    // Ahora obtenemos las publicaciones desde Neon vía Netlify Function
    return this.netlifyDb.getCollection('publications') as Observable<Publication[]>;
  }

  // Obtener publicaciones por ownerId (filtrado cliente sobre los resultados de Neon)
  getByOwner(ownerId: string): Observable<Publication[]> {
    return this.netlifyDb.getCollection('publications').pipe(
      map((list: any[]) => (list || []).filter(p => String(p.ownerId) === String(ownerId) && (p.isActive === undefined ? true : p.isActive)))
    ) as Observable<Publication[]>;
  }

  create(payload: CreatePublicationPayload): Observable<Publication> {
    return this.http.post<Publication>(this.api, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
