// pets.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pet } from '../model/pet.entity';
import { CreatePetRequest } from '../model/create-pet.request';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PetsService {
  private apiUrl = `${environment.serverBasePath}/pets`;

  constructor(private http: HttpClient) {}

  /** Obtener todas las mascotas */
  getAll(): Observable<Pet[]> {
    return this.http.get<Pet[]>(this.apiUrl);
  }

  /** Obtener detalles por ID */
  getById(id: number): Observable<Pet> {
    return this.http.get<Pet>(`${this.apiUrl}/${id}`);
  }

  /** Crear nueva mascota */
  create(pet: CreatePetRequest): Observable<Pet> {
    return this.http.post<Pet>(this.apiUrl, pet);
  }

  /** Actualizar una mascota existente */
  update(id: number, pet: Partial<Pet>): Observable<Pet> {
    return this.http.put<Pet>(`${this.apiUrl}/${id}`, pet);
  }

  /** Eliminar mascota */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /** Mostrar solo las mascotas del refugio autenticado */
  getByProfileId(profileId: number): Observable<Pet[]> {
    return this.http.get<Pet[]>(`${this.apiUrl}/profile/${profileId}`);
  }

  /** Obtener mascotas activas (públicas para adopción) */
  getActivePublications(): Observable<Pet[]> {
    return this.http.get<Pet[]>(`${environment.serverBasePath}/publications/active`);
  }
}

export { Pet } from '../model/pet.entity';
