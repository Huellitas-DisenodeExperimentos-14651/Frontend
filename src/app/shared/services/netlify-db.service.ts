// ...existing code...
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NetlifyDbService {
  private fnBase = '/.netlify/functions/query-neon';

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
}

