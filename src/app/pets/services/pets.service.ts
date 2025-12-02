// pets.service.ts

import { Injectable } from '@angular/core';
import { Observable, Subject, map, forkJoin } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { Pet } from '../model/pet.entity';
import { CreatePetRequest } from '../model/create-pet.request';
import { NetlifyDbService } from '../../shared/services/netlify-db.service';

@Injectable({
  providedIn: 'root'
})
export class PetsService {
  // subject para notificar cambios en las mascotas (creación/actualización/eliminación)
  readonly petsChanged = new Subject<void>();

  constructor(private netlifyDb: NetlifyDbService) {}

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
    // Crear en Neon vía mutate; asegurar id
    const id = pet.id ? String(pet.id) : `pet_${Date.now()}`;
    const item = { ...pet, id };
    return this.netlifyDb.mutate('create', 'pets', item).pipe(
      map(() => item as Pet),
      tap(() => this.notifyChange())
    );
  }

  /** Notificar a los subscriptores que hubo cambios (crear/editar/eliminar) */
  notifyChange() {
    this.petsChanged.next();
  }

  /** Actualizar una mascota existente */
  update(id: string | number, pet: Partial<Pet>): Observable<Pet> {
    const uid = String(id);
    // Obtener el registro existente y fusionarlo con el parche para no borrar campos
    return (this.netlifyDb.getById('pets', uid) as Observable<any>).pipe(
      map(existing => ({ ...(existing || {}), ...(pet as any), id: uid })),
      switchMap((merged: any) => this.netlifyDb.mutate('update', 'pets', merged, uid).pipe(
        map(() => merged as Pet)
      )),
      tap(() => this.notifyChange())
    );
  }

  /** Eliminar mascota */
  delete(id: string | number): Observable<void> {
    const uid = String(id);
    return this.netlifyDb.mutate('delete', 'pets', undefined, uid).pipe(
      map(() => undefined)
    );
  }

  /** Mostrar solo las mascotas del refugio autenticado (filtrado cliente) */
  getByProfileId(profileId: string | number): Observable<Pet[]> {
    const pid = String(profileId);
    // Obtener tanto pets como publicaciones para poder incluir mascotas que no tienen profileId
    // pero sí tienen una publication cuyo ownerId coincide con el refugio.
    return forkJoin({
      pets: this.netlifyDb.getCollection('pets'),
      publications: this.netlifyDb.getCollection('publications')
    }).pipe(
      map(({ pets, publications }) => {
        const petList: any[] = pets || [];
        const pubs: any[] = publications || [];

        // petIds de publicaciones cuyo ownerId coincide con el profileId
        const ownedPetIds = new Set<string>(
          pubs
            .filter(pub => pub && (pub.ownerId !== undefined && pub.ownerId !== null) && String(pub.ownerId) === pid)
            .map(pub => String(pub.petId))
        );

        return petList.filter(p => {
          if (!p) return false;
          // Coincidencia directa en pet.profileId / ownerId
          if ((p.profileId !== undefined && p.profileId !== null && String(p.profileId) === pid) ||
              (p.ownerId !== undefined && p.ownerId !== null && String(p.ownerId) === pid)) {
            return true;
          }

          // Coincide porque existe una publicación del refugio que referencia a esta mascota
          if (ownedPetIds.has(String(p.id))) return true;

          // Fallback: comprobar varias propiedades y anidados
          const candidates = [
            p.profileId, p.profileid, p.profile_id,
            p.ownerId, p.ownerid, p.owner_id,
            p.owner && (p.owner.id ?? p.owner.profileId), p.rescued_by, p.rescuedBy, p.rescueOwner
          ];
          return candidates.some(c => c !== undefined && c !== null && String(c) === pid);
        });
      })
    ) as Observable<Pet[]>;
  }

  /** Obtener mascotas activas (públicas para adopción) */
  getActivePublications(): Observable<any[]> {
    // Retorna las publicaciones (desde Neon). Los consumidores pueden mapear a Pet si lo desean.
    return this.netlifyDb.getCollection('publications');
  }
}

export { Pet } from '../model/pet.entity';
