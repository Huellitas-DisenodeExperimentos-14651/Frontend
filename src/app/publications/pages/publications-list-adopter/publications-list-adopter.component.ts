import { ChangeDetectionStrategy, Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

import { PublicationsService, Publication } from '../../services/publications.service';
import { PetsService } from '../../../pets/services/pets.service';
import { PublicationCardComponent } from '../../components/publication-card/publication-card.component';
import { TranslatePipe } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-publications-list-adopter',
  standalone: true,
  templateUrl: './publications-list-adopter.component.html',
  styleUrls: ['./publications-list-adopter.component.css'],
  imports: [CommonModule, PublicationCardComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicationsListAdopterComponent implements OnInit {
  private pubs = inject(PublicationsService);
  private pets = inject(PetsService);
  private cdr = inject(ChangeDetectorRef);

  publications: (Publication & { petName?: string; photo?: string })[] = [];
  loading = false;
  error: string | null = null;
  // flag temporal para mostrar panel de debug en la UI
  debug = true;
  // resultado directo desde fetch (diagnóstico)
  fetchPublications: any = null;
  fetchError: string | null = null;

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.error = null;
    // Paso 1: pedir solo publicaciones para aislar problemas
    this.pubs.getActive().subscribe({
      next: (publications) => {
        console.log('Publications (raw) - getActive():', publications);
        // mapear sin datos de pets por ahora
        this.publications = publications.map(pub => ({ ...pub, photo: pub.photo ?? '', petName: '' } as Publication & { petName?: string }));
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading publications', err);
        this.error = String(err?.message || err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });

    // Adicional: petición nativa fetch para comparar (ahora pedimos todas las publicaciones)
    fetch(`${environment.serverBasePath}/publications`)
      .then(r => r.json())
      .then(data => {
        console.log('Publications (raw) - fetch():', data);
        this.fetchPublications = data;
        // Si por alguna razón la petición con HttpClient devolvió vacío,
        // hacer fallback y usar la respuesta directa de fetch para poblar
        // la vista (esto es solo una protección adicional para entornos
        // donde un proxy o configuración convierta los valores booleanos).
        if ((!this.publications || this.publications.length === 0) && Array.isArray(data) && data.length > 0) {
          this.publications = data.map((pub: any) => ({ ...pub, photo: pub.photo ?? '', petName: '' } as Publication & { petName?: string }));
          this.loading = false;
        }
        this.cdr.markForCheck();
      })
      .catch(err => {
        console.error('Fetch error:', err);
        this.fetchError = String(err?.message || err);
        this.cdr.markForCheck();
      });
  }
}
