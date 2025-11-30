import { ChangeDetectionStrategy, Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

import { PublicationsService, Publication } from '../../services/publications.service';
import { PetsService } from '../../../pets/services/pets.service';
import { PublicationCardComponent } from '../../components/publication-card/publication-card.component';
import { TranslatePipe } from '@ngx-translate/core';

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

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.error = null;
    // Pedir publicaciones desde Neon (vía Netlify function)
    this.pubs.getActive().subscribe({
      next: (publications) => {
        console.log('Publications (raw) - getActive():', publications);
        this.publications = publications.map(pub => ({ ...pub, photo: pub.photo ?? '', petName: pub.petName ?? '' } as Publication & { petName?: string }));
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
  }
}
