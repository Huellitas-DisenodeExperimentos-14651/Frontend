import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Publication } from '../../services/publications.service';
import { PetsService } from '../../../pets/services/pets.service';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-publication-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './publication-card.component.html',
  styleUrls: ['./publication-card.component.css']
})
export class PublicationCardComponent implements OnInit {
  @Input() publication!: Publication;
  @Output() remove = new EventEmitter<void>();

  photoUrl = 'https://placekitten.com/600/360';

  private pets = inject(PetsService);

  ngOnInit(): void {
    if (!this.publication?.petId) return;

    this.pets.getById(this.publication.petId).subscribe({
      next: pet => {
        this.photoUrl = pet.photo ?? this.photoUrl;
      },
      error: () => {
      }
    });
  }
}
