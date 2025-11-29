// pets.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Pet } from '../model/pet.entity';
import { CreatePetRequest } from '../model/create-pet.request';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PetsService {
  private apiUrl = `${environment.serverBasePath}/pets`;

  // subject para notificar cambios en las mascotas (creación/actualización/eliminación)
  readonly petsChanged = new Subject<void>();

  constructor(private http: HttpClient) {}

  /** Obtener todas las mascotas */
  getAll(): Observable<Pet[]> {
    return this.http.get<Pet[]>(this.apiUrl);
  }

  /** Obtener detalles por ID */
  getById(id: string | number): Observable<Pet> {
    const sid = encodeURIComponent(String(id));
    return this.http.get<Pet>(`${this.apiUrl}/${sid}`);
  }

  /** Crear nueva mascota */
  create(pet: CreatePetRequest): Observable<Pet> {
    // asegurar estado por defecto
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
  // Aceptar id tanto numérico como alfanumérico (json-server usa strings en db.json)
  update(id: string | number, pet: Partial<Pet>): Observable<Pet> {
    // usar PATCH para actualizar parcialmente (no reemplazar todo el recurso)
    const sid = encodeURIComponent(String(id));
    return this.http.patch<Pet>(`${this.apiUrl}/${sid}`, pet).pipe(
      tap(() => this.notifyChange())
    );
  }

  /** Eliminar mascota */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /** Mostrar solo las mascotas del refugio autenticado */
  getByProfileId(profileId: string | number): Observable<Pet[]> {
    // Usar query param para compatibilidad con json-server: /pets?profileId=...
    return this.http.get<Pet[]>(`${this.apiUrl}?profileId=${encodeURIComponent(String(profileId))}`);
  }

  /** Obtener mascotas activas (públicas para adopción) */
  getActivePublications(): Observable<Pet[]> {
    return this.http.get<Pet[]>(`${environment.serverBasePath}/publications/active`);
  }
}

export { Pet } from '../model/pet.entity';
