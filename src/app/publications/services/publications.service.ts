import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
  petName?: string; // propiedad opcional añadida para UI
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
  constructor(private netlifyDb: NetlifyDbService) {}

  // Helper para normalizar distintos nombres y tipos que puedan venir desde Neon/Netlify
  private normalizePublication(raw: any): Publication {
    if (!raw) return raw;
    // owner id variants
    const ownerIdRaw = raw.ownerId ?? raw.ownerid ?? raw.owner_id ?? raw.owner?.id ?? raw.owner?.profileId ?? raw.owner?.profile_id ?? raw.owner?.ownerId;

    // pet id variants
    const petIdRaw = raw.petId ?? raw.pet_id ?? raw.petid ?? raw.pet?.id ?? raw.pet?.petId;

    // isActive variants and coercion to boolean
    const isActiveRaw = raw.isActive ?? raw.is_active ?? raw.isactive ?? raw.active ?? raw.enabled;
    let isActive = true;
    if (isActiveRaw !== undefined && isActiveRaw !== null) {
      if (typeof isActiveRaw === 'boolean') {
        isActive = isActiveRaw;
      } else {
        const s = String(isActiveRaw).toLowerCase();
        isActive = ['true', 't', '1', 'yes'].includes(s);
      }
    }

    const normalized: Publication = {
      id: raw.id,
      petId: petIdRaw !== undefined && petIdRaw !== null ? String(petIdRaw) : (raw.petId ?? raw.pet_id ?? raw.petid ?? raw.pet ?? ''),
      title: raw.title,
      description: raw.description,
      contactInfo: raw.contactInfo ?? raw.contact_info ?? raw.contact ?? '',
      location: raw.location ?? raw.loc ?? '',
      publishedAt: raw.publishedAt ?? raw.published_at ?? raw.createdAt ?? raw.created_at ?? '',
      isActive,
      photo: raw.photo ?? raw.image ?? undefined,
      ownerId: ownerIdRaw !== undefined && ownerIdRaw !== null ? String(ownerIdRaw) : undefined,
      petName: raw.petName ?? raw.pet_name ?? undefined
    } as Publication;

    return normalized;
  }

  getActive(): Observable<Publication[]> {
    // Obtener publicaciones desde Neon vía Netlify Function y devolver sólo las activas (normalizadas)
    return this.netlifyDb.getCollection('publications').pipe(
      map((list: any[]) => (list || []).map(r => this.normalizePublication((r && r.data) ? r.data : r)).filter(p => p && p.isActive))
    ) as Observable<Publication[]>;
  }

  // Obtener publicaciones por ownerId (filtrado cliente sobre los resultados de Neon)
  getByOwner(ownerId: string): Observable<Publication[]> {
    return this.netlifyDb.getCollection('publications').pipe(
      map((list: any[]) => (list || [])
        .map(r => this.normalizePublication((r && r.data) ? r.data : r))
        .filter(p => p && p.ownerId !== undefined && String(p.ownerId) === String(ownerId) && (p.isActive === undefined ? true : p.isActive))
      )
    ) as Observable<Publication[]>;
  }

  create(payload: CreatePublicationPayload): Observable<Publication> {
    // Ensure id
    const id = (payload as any).id ? String((payload as any).id) : `pub_${Date.now()}`;
    const item = { ...payload, id };
    return this.netlifyDb.mutate('create', 'publications', item).pipe(map(() => item as Publication));
  }

  delete(id: string | number): Observable<void> {
    const uid = String(id);
    return this.netlifyDb.mutate('delete', 'publications', undefined, uid).pipe(map(() => undefined));
  }
}
