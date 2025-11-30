// pets.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, map } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Pet } from '../model/pet.entity';
import { CreatePetRequest } from '../model/create-pet.request';
import { environment } from '../../../environments/environment';
import { NetlifyDbService } from '../../shared/services/netlify-db.service';

@Injectable({
  providedIn: 'root'
})
export class PetsService {
  private apiUrl = `${environment.serverBasePath}/pets`;

  // subject para notificar cambios en las mascotas (creación/actualización/eliminación)
  readonly petsChanged = new Subject<void>();

  constructor(private http: HttpClient, private netlifyDb: NetlifyDbService) {}

  /** Obtener todas las mascotas (desde Netlify/Neon) */
  getAll(): Observable<Pet[]> {
    return this.netlifyDb.getCollection('pets') as Observable<Pet[]>;
  }

  /** Obtener detalles por ID (desde Netlify/Neon) */
  getById(id: string | number): Observable<Pet> {
    return this.netlifyDb.getById('pets', id) as Observable<Pet>;
  }

  /** Crear nueva mascota */
  create(pet: CreatePetRequest): Observable<Pet> {
    // Crear sigue apuntando al backend original (escritura).
    const payload = { ...pet, status: pet.status ?? 'available' };
    return this.http.post<Pet>(this.apiUrl, payload).pipe(
      tap(() => this.notifyChange())
    );
  }

  /** Notificar a los subscriptores que hubo cambios (crear/editar/eliminar) */
  notifyChange() {
    this.petsChanged.next();
  }

  /** Actualizar una mascota existente */
  update(id: string | number, pet: Partial<Pet>): Observable<Pet> {
    const sid = encodeURIComponent(String(id));
    return this.http.patch<Pet>(`${this.apiUrl}/${sid}`, pet).pipe(
      tap(() => this.notifyChange())
    );
  }

  /** Eliminar mascota */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /** Mostrar solo las mascotas del refugio autenticado (filtrado cliente) */
  getByProfileId(profileId: string | number): Observable<Pet[]> {
    return this.netlifyDb.getCollection('pets').pipe(
      map((list: any[]) => (list || []).filter(p => String(p.profileId) === String(profileId)))
    ) as Observable<Pet[]>;
  }

  /** Obtener mascotas activas (públicas para adopción) */
  getActivePublications(): Observable<any[]> {
    // Retorna las publicaciones (desde Neon). Los consumidores pueden mapear a Pet si lo desean.
    return this.netlifyDb.getCollection('publications');
  }
}

export { Pet } from '../model/pet.entity';
