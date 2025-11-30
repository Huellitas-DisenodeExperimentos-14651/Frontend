import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of, throwError, retryWhen, delay, take } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NetlifyDbService {
  private fnBase = '/.netlify/functions/query-neon';
  private mutateBase = '/.netlify/functions/mutate-neon';
  private jsonHeaders = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };

  constructor(private http: HttpClient) {}

  /** Devuelve la colección completa desde la función Netlify. Normaliza 'data' si la fila viene con esa propiedad. */
  getCollection(collection: string): Observable<any[]> {
    const url = `${this.fnBase}?collection=${encodeURIComponent(collection)}`;
    // intentar llamar a la función Netlify; si devuelve 404 hacemos fallback al serverBasePath (json-server local o API)
    return this.http.get<any[]>(url).pipe(
      retryWhen(errors => errors.pipe(delay(300), take(2))),
      map((rows: any[]) => (rows || []).map(r => (r && r.data) ? r.data : r)),
      catchError(err => {
        console.warn(`Netlify function ${url} failed:`, err?.status || err);
        if (err && err.status === 404) {
          // fallback: intentar la API original
          const fallbackUrl = `${environment.serverBasePath}/${collection.replace(/_/g, '-')}`;
          console.info(`Falling back to ${fallbackUrl}`);
          return this.http.get<any[]>(fallbackUrl).pipe(
            map((rows: any[]) => rows || []),
            catchError(fallbackErr => {
              console.error('Fallback API also failed:', fallbackErr);
              return throwError(() => fallbackErr || err);
            })
          );
        }
        return throwError(() => err);
      })
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

    return this.http.post<any>(this.mutateBase, body, options).pipe(
      retryWhen(errors => errors.pipe(delay(300), take(2))),
      catchError(err => {
        console.warn(`Mutate function ${this.mutateBase} failed:`, err?.status || err);
        if (err && err.status === 404) {
          // fallback to original API if function not found
          const fallbackUrl = `${environment.serverBasePath}/${collection.replace(/_/g, '-')}`;
          console.info(`Falling back to POST ${fallbackUrl}`);
          if (action === 'delete') {
            const uid = String(id);
            return this.http.delete<any>(`${fallbackUrl}/${uid}`, options).pipe(catchError(e => throwError(() => e)));
          }
          // create/update -> POST or PUT depending on presence of id
          if (action === 'create') return this.http.post<any>(fallbackUrl, payload, options).pipe(catchError(e => throwError(() => e)));
          return this.http.put<any>(`${fallbackUrl}/${id}`, payload, options).pipe(catchError(e => throwError(() => e)));
        }
        return throwError(() => err);
      })
    );
  }
}
