import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, map, of } from 'rxjs';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ChangeDetectorRef } from '@angular/core';
import { of as rxOf, forkJoin } from 'rxjs';

import { PetsService } from '../../../pets/services/pets.service';
import { Publication, PublicationsService } from '../../services/publications.service';
import { PublicationCardComponent } from '../../components/publication-card/publication-card.component';
import { InfoDialogComponent } from '../../../shared/components/info-dialog/info-dialog.component';
import { CreatePublicationDialogComponent } from '../../components/create-publication-dialog/create-publication-dialog.component';
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
    InfoDialogComponent,
    CreatePublicationDialogComponent,
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

  activePublications$!: Observable<Publication[]>;

  ngOnInit(): void {
    this.refresh();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreatePublicationDialogComponent, {
      width: '520px',
      maxWidth: '95vw'
    });

    dialogRef.afterClosed().subscribe((created: boolean) => {
      if (created) {
        this.refresh();
        this.cdr.markForCheck();
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
      this.activePublications$ = rxOf([]);
    } else {
      forkJoin({
        publications: this.pubs.getByOwner(ownerId),
        pets: this.pets.getAll()
      }).subscribe(({ publications, pets }) => {
        this.activePublications$ = of(
            publications.map(pub => ({
              ...pub,
              photo: pets.find(p => String(p.id) === String(pub.petId))?.photo ?? pub.photo ?? ''
            }))
        );
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
