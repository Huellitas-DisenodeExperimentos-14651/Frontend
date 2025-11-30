import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdoptionRequest } from '../model/adoption-request.model';
import { tap } from 'rxjs/operators';
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
    const sid = encodeURIComponent(String(id));
    return this.http.patch<AdoptionRequest>(`${this.baseUrl}/${sid}`, patch).pipe(
      tap(() => this.requestsChanged.next())
    );
  }

  approve(id: string | number): Observable<AdoptionRequest> {
    // Mantener para compatibilidad: marca como APPROVED
    return this.patch(id, { status: 'APPROVED' });
  }

  reject(id: string | number): Observable<AdoptionRequest> {
    return this.patch(id, { status: 'REJECTED' });
  }

  create(payload: any): Observable<AdoptionRequest> {
    // Agregar fecha y estado automáticamente
    const now = new Date().toISOString();
    const request = {
      ...payload,
      requestDate: now,
      status: payload.status || 'PENDING'
    };
    return this.http.post<AdoptionRequest>(this.baseUrl, request).pipe(
      tap(() => this.requestsChanged.next())
    );
  }
}
