import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdoptionRequest } from '../model/adoption-request.model';

@Injectable({ providedIn: 'root' })
export class AdoptionRequestService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.serverBasePath}/adoption-requests`;

  getAll(): Observable<AdoptionRequest[]> {
    return this.http.get<AdoptionRequest[]>(this.baseUrl);
  }

  // Actualiza parcialmente un request (status, interviewDate, etc.)
  patch(id: number, patch: Partial<AdoptionRequest>): Observable<AdoptionRequest> {
    return this.http.patch<AdoptionRequest>(`${this.baseUrl}/${id}`, patch);
  }

  approve(id: number): Observable<AdoptionRequest> {
    // Mantener para compatibilidad: marca como APPROVED
    return this.patch(id, { status: 'APPROVED' });
  }

  reject(id: number): Observable<AdoptionRequest> {
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
    return this.http.post<AdoptionRequest>(this.baseUrl, request);
  }
}
