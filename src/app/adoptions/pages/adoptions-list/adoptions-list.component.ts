import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { AdoptionFilter } from '../../model/adoption-filter.model';
import { AdoptionCardComponent } from '../../components/adoption-card/adoption-card.component';
import { AdoptionFiltersComponent } from '../../components/adoption-filters/adoption-filters.component';
import { PetNameFilterPipe } from '../../pipes/pet-name-filter.pipe';
import { PublicationWithPet } from '../../model/publication-with-pet.model';
import { AdoptionsService } from '../../services/adoptions.service';

@Component({
  standalone: true,
  selector: 'app-adoptions-list',
  templateUrl: './adoptions-list.component.html',
  styleUrls: ['./adoptions-list.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    AdoptionCardComponent,
    AdoptionFiltersComponent,
    PetNameFilterPipe
  ]
})
export class AdoptionsListComponent implements OnInit {
  publications: PublicationWithPet[] = [];
  publicationsOriginal: PublicationWithPet[] = [];
  loading = true;
  search: string = '';
  sortOption: string = '';

  constructor(private adoptionsService: AdoptionsService) {}

  ngOnInit(): void {
    this.adoptionsService.getAllPets().subscribe({
      next: (data: PublicationWithPet[]) => {
        this.publicationsOriginal = data;
        this.publications = data;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error al cargar publicaciones:', err);
        this.loading = false;
      }
    });
  }

  getAgeCategory(age: number): string {
    if (age < 1) return 'Cachorro';
    if (age < 7) return 'Adulto';
    return 'Mayor';
  }

  applyFilters(filter: AdoptionFilter): void {
    this.publications = this.publicationsOriginal.filter(pub =>
      (!filter.age || this.getAgeCategory(pub.pet.age) === filter.age) &&
      (!filter.size || pub.pet.size.toString() === filter.size)
    );
    this.applySort();
  }

  applySort(): void {
    if (!this.sortOption) return;

    this.publications.sort((a, b) => {
      switch (this.sortOption) {
        case 'name-asc':
          return a.pet.name.localeCompare(b.pet.name);
        case 'name-desc':
          return b.pet.name.localeCompare(a.pet.name);
        case 'age-asc':
          return a.pet.age - b.pet.age;
        case 'age-desc':
          return b.pet.age - a.pet.age;
        default:
          return 0;
      }
    });
  }
}
