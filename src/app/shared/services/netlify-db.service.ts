import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NetlifyDbService {
  private fnBase = '/.netlify/functions/query-neon';
  private mutateBase = '/.netlify/functions/mutate-neon';
  private jsonHeaders = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };

  constructor(private http: HttpClient) {}

  /** Devuelve la colección completa desde la función Netlify. Normaliza 'data' si la fila viene con esa propiedad. */
  getCollection(collection: string): Observable<any[]> {
    const url = `${this.fnBase}?collection=${encodeURIComponent(collection)}`;
    return this.http.get<any[]>(url).pipe(
      map((rows: any[]) => (rows || []).map(r => (r && r.data) ? r.data : r))
    );
  }

  /** Obtener un solo registro por id (filtrado cliente). Retorna null si no existe. */
  getById(collection: string, id: string | number): Observable<any | null> {
    return this.getCollection(collection).pipe(
      map(list => {
        const sid = String(id);
        return (list || []).find((item: any) => String(item.id) === sid) ?? null;
      })
    );
  }

  /** Mutar una colección en Neon mediante la función mutate-neon */
  mutate(action: 'create' | 'update' | 'delete', collection: string, payload?: any, id?: string | number): Observable<any> {
    const body: any = { action, collection };
    if (payload !== undefined) body.item = payload;
    if (id !== undefined) body.id = id;
    // construir headers dinámicos (incluye Authorization si existe)
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    const headersObj: any = { 'Content-Type': 'application/json' };
    if (token) headersObj['Authorization'] = `Bearer ${token}`;
    const options = { headers: new HttpHeaders(headersObj) };
    return this.http.post<any>(this.mutateBase, body, options);
  }
}
