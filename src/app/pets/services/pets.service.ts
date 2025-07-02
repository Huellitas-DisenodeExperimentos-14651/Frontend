// pets.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pet } from '../model/pet.entity';

@Injectable({
  providedIn: 'root'
})
export class PetsService {
  private apiUrl = 'https://patita-solidaria-backend.onrender.com/api/v1/pets'; // <-- usa el endpoint de tu backend real

  constructor(private http: HttpClient) {}

  /** Obtener todas las mascotas */
  getAll(): Observable<Pet[]> {
    return this.http.get<Pet[]>(this.apiUrl);
  }

  /** Obtener detalles por ID */
  getById(id: number): Observable<Pet> {
    return this.http.get<Pet>(`${this.apiUrl}/${id}`);
  }

  /** Actualizar estado de una mascota */
  updateStatus(id: number, status: 'available' | 'adopted' | 'fostered'): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/status`, { status });
    // Asegúrate que tu backend acepte PUT y body con { status }
  }

  /** Crear nueva mascota */
  create(pet: Partial<Pet>): Observable<Pet> {
    return this.http.post<Pet>(this.apiUrl, pet);
  }

  /** Eliminar mascota */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
