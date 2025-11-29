import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';

export interface Publication {
  id: number;
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

  constructor(private http: HttpClient) {}

  getActive(): Observable<Publication[]> {
    // Cambiado: por petición del usuario, devolvemos TODAS las publicaciones
    // sin filtrar por `isActive`. Es decir, esta función seguirá llamándose
    // `getActive()` pero ahora devuelve todas las publicaciones del servidor.
    // Si en algún momento quieres volver a filtrar, reemplaza la URL por
    // `${this.api}?isActive=true` o aplica el filtro aquí.
    return this.http.get<Publication[]>(this.api).pipe(
      map(list => (list || []))
    );
  }

  // Obtener publicaciones por ownerId (json-server permite query simple: ?ownerId=...)
  getByOwner(ownerId: string): Observable<Publication[]> {
    return this.http.get<Publication[]>(`${this.api}?ownerId=${ownerId}&isActive=true`);
  }

  create(payload: CreatePublicationPayload): Observable<Publication> {
    return this.http.post<Publication>(this.api, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
