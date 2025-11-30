// pets.service.ts

import { Injectable } from '@angular/core';
import { Observable, Subject, map } from 'rxjs';
import { tap } from 'rxjs/operators';
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
    const item = { ...(pet as any), id: uid };
    return this.netlifyDb.mutate('update', 'pets', item, uid).pipe(
      map(() => item as Pet),
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
    return this.netlifyDb.getCollection('pets').pipe(
      map((list: any[]) =>
        (list || []).filter(p => {
          if (!p) return false;
          // Normalizar y comprobar distintas posibles propiedades donde el owner/refugio podría estar guardado
          const candidates = [
            p.profileId,
            p.ownerId,
            p.owner && p.owner.id,
            p.owner && p.owner.profileId,
            p.rescued_by,
            p.rescuedBy,
            p.rescueOwner,
            p.ownerIdString
          ];
          return candidates.some(c => c !== undefined && c !== null && String(c) === pid);
        })
      )
    ) as Observable<Pet[]>;
  }

  /** Obtener mascotas activas (públicas para adopción) */
  getActivePublications(): Observable<any[]> {
    // Retorna las publicaciones (desde Neon). Los consumidores pueden mapear a Pet si lo desean.
    return this.netlifyDb.getCollection('publications');
  }
}

export { Pet } from '../model/pet.entity';
