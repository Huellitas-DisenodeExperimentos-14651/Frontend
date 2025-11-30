import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { AdoptionRequest } from '../model/adoption-request.model';
import { tap, map } from 'rxjs/operators';
import { NetlifyDbService } from '../../shared/services/netlify-db.service';

@Injectable({ providedIn: 'root' })
export class AdoptionRequestService {
  // Subject para notificar cambios en las solicitudes
  readonly requestsChanged = new Subject<void>();

  constructor(private netlifyDb: NetlifyDbService) {}

  // Normalize helper: unifica variantes de nombres y formatos encontrados en db.json
  private normalizeRequest = (raw: any): AdoptionRequest => {
    if (!raw) return raw as AdoptionRequest;

    const pickId = (v: any) => (v === undefined || v === null ? undefined : String(v));

    const ownerId = pickId(raw.ownerId ?? raw.owner_id ?? raw.ownerid ?? raw.owner?.id ?? raw.owner?.profileId ?? raw.shelterId);
    const applicantId = pickId(raw.applicantId ?? raw.applicant_id ?? raw.applicantid ?? raw.requesterId ?? raw.userId ?? raw.applicant ?? raw.requester);

    // Pet/publication references: support petId, publicationId and various snake/camel cases
    const petIdRaw = raw.petId ?? raw.pet_id ?? raw.publicationId ?? raw.publication_id ?? raw.pet?.id ?? raw.petId ?? raw.petIdRaw;
    const petId = petIdRaw === undefined || petIdRaw === null ? undefined : String(petIdRaw);

    // status normalization: uppercase known statuses, fallback to provided
    const statusRaw = raw.status ?? raw.state ?? raw.status_code;
    const status = typeof statusRaw === 'string' ? statusRaw.toUpperCase() : statusRaw;

    const requestDate = raw.requestDate ?? raw.request_date ?? raw.createdAt ?? raw.created_at ?? raw.created;

    const normalized: AdoptionRequest = {
      id: raw.id !== undefined && raw.id !== null ? String(raw.id) : (raw._id ?? raw.uid ?? `${Date.now()}`),
      publicationId: petId ?? (raw.publicationId ?? raw.publication_id),
      petId: petId,
      applicantId: applicantId ?? undefined,
      applicantFullName: raw.applicantFullName ?? raw.applicant_full_name ?? raw.name ?? raw.fullName ?? raw.requesterName ?? undefined,
      reasonMessage: raw.reasonMessage ?? raw.reason_message ?? raw.message ?? raw.reason ?? '',
      status: (status as any) ?? 'PENDING',
      requestDate: requestDate ?? new Date().toISOString(),
      pet: raw.pet ?? undefined,
      interviewDate: raw.interviewDate ?? raw.interview_date ?? undefined,
      applicantProfile: raw.applicantProfile ?? raw.applicant_profile ?? undefined,
      ownerId: ownerId
    } as AdoptionRequest;

    return normalized;
  };

  getAll(): Observable<AdoptionRequest[]> {
    // Usar el nombre con guion para alinear con db.json y rutas fallback
    return (this.netlifyDb.getCollection('adoption-requests') as Observable<any[]>).pipe(
      map((arr: any[]) => (arr || []).map(this.normalizeRequest))
    );
  }

  // Actualiza parcialmente un request (status, interviewDate, etc.)
  patch(id: string | number, patch: Partial<AdoptionRequest>): Observable<AdoptionRequest> {
    const uid = String(id);
    const item = { ...(patch as any), id: uid };
    return this.netlifyDb.mutate('update', 'adoption-requests', item, uid).pipe(
      map(() => item as AdoptionRequest),
      tap(() => this.requestsChanged.next())
    );
  }

  approve(id: string | number): Observable<AdoptionRequest> {
    return this.patch(id, { status: 'APPROVED' } as Partial<AdoptionRequest>);
  }

  reject(id: string | number): Observable<AdoptionRequest> {
    return this.patch(id, { status: 'REJECTED' } as Partial<AdoptionRequest>);
  }

  create(payload: any): Observable<AdoptionRequest> {
    // Agregar fecha y estado automáticamente
    const now = new Date().toISOString();
    const id = payload.id ? String(payload.id) : `req_${Date.now()}`;
    const request = {
      ...payload,
      id,
      requestDate: now,
      status: payload.status || 'PENDING'
    };
    return this.netlifyDb.mutate('create', 'adoption-requests', request).pipe(
      map(() => request as AdoptionRequest),
      tap(() => this.requestsChanged.next())
    );
  }
}
