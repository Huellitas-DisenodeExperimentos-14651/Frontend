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

  approve(id: number): Observable<AdoptionRequest> {
    // ⬇ cambio de post → put
    return this.http.put<AdoptionRequest>(`${this.baseUrl}/${id}/approve`, null);
  }

  reject(id: number): Observable<AdoptionRequest> {
    return this.http.put<AdoptionRequest>(`${this.baseUrl}/${id}/reject`, null);
  }
}
