import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdoptionRequest } from '../model/adoption-request.model';
import { tap, map } from 'rxjs/operators';
import { NetlifyDbService } from '../../shared/services/netlify-db.service';

@Injectable({ providedIn: 'root' })
export class AdoptionRequestService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.serverBasePath}/adoption-requests`;

  // Subject para notificar cambios en las solicitudes
  readonly requestsChanged = new Subject<void>();

  constructor(private netlifyDb: NetlifyDbService) {}

  getAll(): Observable<AdoptionRequest[]> {
    return this.netlifyDb.getCollection('adoption_requests') as Observable<AdoptionRequest[]>;
  }

  // Actualiza parcialmente un request (status, interviewDate, etc.)
  patch(id: string | number, patch: Partial<AdoptionRequest>): Observable<AdoptionRequest> {
    const uid = String(id);
    const item = { ...(patch as any), id: uid };
    return this.netlifyDb.mutate('update', 'adoption_requests', item, uid).pipe(
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
    return this.netlifyDb.mutate('create', 'adoption_requests', request).pipe(
      map(() => request as AdoptionRequest),
      tap(() => this.requestsChanged.next())
    );
  }
}
