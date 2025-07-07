import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, map } from 'rxjs';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ChangeDetectorRef } from '@angular/core';
import { of, forkJoin } from 'rxjs';

import { PetsService } from '../../../pets/services/pets.service';
import { Pet } from '../../../pets/model/pet.entity';

import {
  PublicationsService,
  Publication
} from '../../services/publications.service';

import { PendingItemComponent } from '../../components/pending-item/pending-item.component';
import { PublicationCardComponent } from '../../components/publication-card/publication-card.component';
import { InfoDialogComponent } from '../../../shared/components/info-dialog/info-dialog.component';

import {TranslatePipe, TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-publications-dashboard',
  standalone: true,
  templateUrl: './publications-dashboard.component.html',
  styleUrls: ['./publications-dashboard.component.css'],
  imports: [
    CommonModule,
    PendingItemComponent,
    PublicationCardComponent,
    MatDialogModule,
    InfoDialogComponent,
    TranslatePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicationsDashboardComponent implements OnInit {
  private pets = inject(PetsService);
  private pubs = inject(PublicationsService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private translate = inject(TranslateService);

  pendingPets$!: Observable<Pet[]>;
  activePublications$!: Observable<Publication[]>;

  ngOnInit(): void {
    this.refresh();
  }

  publish(pet: Pet): void {
    this.pubs.create({
      petId: pet.id,
      title: pet.name,
      description: pet.description ?? '',
      contactInfo: 'contact@example.com',
      location: 'Chimbote',
      photo: pet.photo
    }).subscribe({
      next: () => {
        const ref = this.showDialog(this.translate.instant('publications.publishSuccess'));
        ref.afterClosed().subscribe(() => {
          this.refresh();
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.showDialog(this.translate.instant('publications.publishError'));
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
    forkJoin({
      publications: this.pubs.getActive(),
      pets: this.pets.getAll()
    }).subscribe(({ publications, pets }) => {
      this.activePublications$ = of(
          publications.map(pub => ({
            ...pub,
            photo: pets.find(p => p.id === pub.petId)?.photo ?? ''
          }))
      );
    });

    this.pendingPets$ = this.pets.getAll()
        .pipe(map(arr => arr.filter(p => String(p.status).toUpperCase() === 'AVAILABLE')));
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
