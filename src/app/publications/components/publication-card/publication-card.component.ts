import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Publication } from '../../services/publications.service';
import { PetsService } from '../../../pets/services/pets.service';
import {TranslatePipe} from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-publication-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe, MatButtonModule, MatIconModule],
  templateUrl: './publication-card.component.html',
  styleUrls: ['./publication-card.component.css']
})
export class PublicationCardComponent implements OnInit {
  @Input() publication!: Publication;
  // Permite ocultar el botón de eliminar cuando el componente se usa en vistas de solo lectura
  @Input() canRemove: boolean = true;
  @Output() remove = new EventEmitter<void>();

  photoUrl = 'https://placekitten.com/600/360';
  petName: string = '';

  private pets = inject(PetsService);

  ngOnInit(): void {
    // Preferir la imagen especificada en la publicación
    if (this.publication?.photo) {
      this.photoUrl = this.publication.photo;
    }

    // Si el nombre de la mascota viene incluido (precalculado), usarlo
    if ((this.publication as any).petName) {
      this.petName = (this.publication as any).petName;
    }

    // Si falta información relevante (foto o petName), pedir los datos de la mascota como fallback
    if (!this.publication?.petId) return;

    if (!this.publication.photo || !this.petName) {
      this.pets.getById(this.publication.petId).subscribe({
        next: pet => {
          // solo rellenar lo que falte
          this.photoUrl = this.publication.photo ?? pet.photo ?? this.photoUrl;
          this.petName = this.petName || pet.name || '';
        },
        error: () => {
          // mantener valores por defecto en caso de error
        }
      });
    }
  }
}
