import { Injectable } from '@angular/core';

import { environment } from "../../../environments/environment";
import { Observable, map } from 'rxjs';
import { NetlifyDbService } from './netlify-db.service';

@Injectable({
  providedIn: 'root'
})
export class BaseService<T> {

  basePath: string = `${environment.serverBasePath}`;
  resourceEndpoint: string = '/resources';

  constructor(private netlifyDb: NetlifyDbService) { }

  // Helper para convertir resourceEndpoint '/pets' -> 'pets' (colección en Neon)
  private collectionName(): string {
    return this.resourceEndpoint.replace(/^\//, '');
  }

  // Create Resource via Netlify mutate
  create(item: any): Observable<T> {
    const collection = this.collectionName();
    const id = (item && (item as any).id) ? String((item as any).id) : `${collection}_${Date.now()}`;
    const payload = { ...item, id };
    return this.netlifyDb.mutate('create', collection, payload).pipe(map(() => payload as T));
  }

  // Delete Resource
  delete(id: any): Observable<void> {
    const collection = this.collectionName();
    return this.netlifyDb.mutate('delete', collection, undefined, String(id)).pipe(map(() => undefined));
  }

  // Update Resource
  update(id: any, item: any): Observable<T> {
    const collection = this.collectionName();
    const payload = { ...(item as any), id: String(id) };
    return this.netlifyDb.mutate('update', collection, payload, String(id)).pipe(map(() => payload as T));
  }

  // Get All Resources
  getAll(): Observable<T> {
    const collection = this.collectionName();
    return this.netlifyDb.getCollection(collection) as Observable<T>;
  }

}
