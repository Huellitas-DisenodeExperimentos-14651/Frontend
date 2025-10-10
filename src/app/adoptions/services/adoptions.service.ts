import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, switchMap } from 'rxjs';

import { Pet } from '../../pets/model/pet.entity';
import { Publication } from '../model/publication';
import { PublicationWithPet } from '../model/publication-with-pet.model';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdoptionsService {
  private apiUrl = environment.serverBasePath;

  constructor(private http: HttpClient) {}

  /** 🔁 Obtener publicaciones activas con los datos completos de la mascota */
  getAllPets(): Observable<PublicationWithPet[]> {
    return this.http.get<Publication[]>(`${this.apiUrl}/publications/active`).pipe(
      switchMap((publications) =>
        forkJoin(
          publications.map(pub =>
            this.http.get<Pet>(`${this.apiUrl}/pets/${pub.petId}`).pipe(
              map(pet => ({
                ...pub,  // Aquí se "funde" pub con pet
                pet      // Este es el único campo adicional
              }))
            )
          )
        )
      )
    );
  }

  /** Obtener detalles de mascota por ID */
  getPetById(id: number): Observable<Pet> {
    return this.http.get<Pet>(`${this.apiUrl}/pets/${id}`);
  }

  /** Obtener todas las mascotas directamente */
  getAllDirectPets(): Observable<Pet[]> {
    return this.http.get<Pet[]>(`${this.apiUrl}/pets`);
  }
}
