import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ChangeDetectorRef } from '@angular/core';

import { PetsService } from '../../../pets/services/pets.service';
import { Publication, PublicationsService } from '../../services/publications.service';
import { PublicationCardComponent } from '../../components/publication-card/publication-card.component';
import { CreatePublicationDialogComponent } from '../../components/create-publication-dialog/create-publication-dialog.component';
import { InfoDialogComponent } from '../../../shared/components/info-dialog/info-dialog.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-publications-dashboard',
  standalone: true,
  templateUrl: './publications-dashboard.component.html',
  styleUrls: ['./publications-dashboard.component.css'],
  imports: [
    CommonModule,
    PublicationCardComponent,
    MatDialogModule,
    TranslatePipe,
    MatButtonModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicationsDashboardComponent implements OnInit {
  private pets = inject(PetsService);
  private pubs = inject(PublicationsService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private translate = inject(TranslateService);

  // BehaviorSubject para permitir actualizar (preponer) la lista localmente
  private activePublicationsSubject = new BehaviorSubject<Publication[]>([]);
  activePublications$ = this.activePublicationsSubject.asObservable();

  ngOnInit(): void {
    this.refresh();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreatePublicationDialogComponent, {
      width: '520px',
      maxWidth: '95vw'
    });

    // Si el diálogo devuelve la publicación creada (obj), anteponerla a la lista
    dialogRef.afterClosed().subscribe((createdPub: Publication | null | false) => {
      if (createdPub && typeof createdPub === 'object') {
        // obtener foto de la mascota y luego insertar en la lista
        this.pets.getById(createdPub.petId).subscribe({
          next: pet => {
            const withPhoto = { ...createdPub, photo: createdPub.photo ?? pet?.photo ?? '', petName: pet?.name ?? '' } as Publication & { petName?: string };
            const current = this.activePublicationsSubject.getValue() ?? [];
            this.activePublicationsSubject.next([withPhoto, ...current]);
            this.cdr.markForCheck();
          },
          error: () => {
            const current = this.activePublicationsSubject.getValue() ?? [];
            const withPhoto = { ...createdPub, photo: createdPub.photo ?? '', petName: '' } as Publication & { petName?: string };
            this.activePublicationsSubject.next([withPhoto, ...current]);
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  delete(pub: Publication): void {
    this.pubs.delete(pub.id).subscribe({
      next: () => {
        const ref = this.showDialog(this.translate.instant('publications.deleteSuccess'));
        ref.afterClosed().subscribe(() => {
          this.refresh();
          this.cdr.markForCheck(); // <-- fuerza la detección de cambios
        });
      },
      error: () => {
        this.showDialog(this.translate.instant('publications.deleteError'));
      }
    });
  }
  private refresh(): void {
    const ownerId = localStorage.getItem('profileId');

    if (!ownerId) {
      // Si no hay ownerId, no mostramos publicaciones propias
      this.activePublicationsSubject.next([]);
    } else {
      forkJoin({
        publications: this.pubs.getByOwner(ownerId),
        pets: this.pets.getAll()
      }).subscribe(({ publications, pets }) => {
        const mapped = publications.map(pub => {
          const pet = pets.find(p => String(p.id) === String(pub.petId));
          return {
            ...pub,
            // priorizar la imagen ingresada en la publicación; si no existe, usar la de la mascota
            photo: pub.photo ?? pet?.photo ?? '',
            petName: pet?.name ?? ''
          } as Publication & { petName?: string };
        });
        this.activePublicationsSubject.next(mapped);
      });
    }
  }

  private showDialog(message: string): MatDialogRef<InfoDialogComponent> {
    return this.dialog.open(InfoDialogComponent, {
      data: { message },
      disableClose: true,
      width: '320px',
      maxWidth: '90vw',
      panelClass: 'dialog-compact'
    });
  }
}
