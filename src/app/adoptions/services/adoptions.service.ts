import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, switchMap } from 'rxjs';

import { Pet } from '../../pets/model/pet.entity';
import { Publication } from '../model/publication';
import { PublicationWithPet } from '../model/publication-with-pet.model';

import { NetlifyDbService } from '../../shared/services/netlify-db.service';

@Injectable({
  providedIn: 'root'
})
export class AdoptionsService {
  constructor(private netlifyDb: NetlifyDbService) {}

  /** 🔁 Obtener publicaciones activas con los datos completos de la mascota */
  getAllPets(): Observable<PublicationWithPet[]> {
    // Obtener todas las publicaciones desde Netlify/Neon y filtrar las activas.
    return this.netlifyDb.getCollection('publications').pipe(
      map((publications: Publication[]) => (publications || []).filter(p => (p as any).isActive)),
      switchMap((publications: Publication[]) =>
        forkJoin(
          (publications || []).map(pub =>
            // obtener la mascota asociada por id desde la colección 'pets'
            this.netlifyDb.getById('pets', pub.petId).pipe(
              map((pet: Pet | null) => ({
                ...pub,
                pet: pet as Pet
              }))
            )
          )
        )
      )
    );
  }

  /** Obtener detalles de mascota por ID */
  getPetById(id: number): Observable<Pet> {
    return this.netlifyDb.getById('pets', id) as Observable<Pet>;
  }

  /** Obtener todas las mascotas directamente */
  getAllDirectPets(): Observable<Pet[]> {
    return this.netlifyDb.getCollection('pets') as Observable<Pet[]>;
  }
}
