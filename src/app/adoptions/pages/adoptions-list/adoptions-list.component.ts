import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { AdoptionFilter } from '../../model/adoption-filter.model';
import { AdoptionCardComponent } from '../../components/adoption-card/adoption-card.component';
import { AdoptionFiltersComponent } from '../../components/adoption-filters/adoption-filters.component';
import { PetNameFilterPipe } from '../../pipes/pet-name-filter.pipe';

import { AdoptionsService } from '../../services/adoptions.service';
import { AdoptionRequestService } from '../../../adoption-requests/services/adoption-request.service';
import { Pet } from '../../../pets/model/pet.entity';
import { AuthenticationService } from '../../../iam/services/authentication.service';

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
  publications: Pet[] = [];
  publicationsOriginal: Pet[] = [];
  loading = true;
  search: string = '';
  sortOption: string = '';

  constructor(
    private adoptionsService: AdoptionsService,
    private adoptionRequestService: AdoptionRequestService,
    private authenticationService: AuthenticationService
  ) {}

  ngOnInit(): void {
    this.adoptionsService.getAllDirectPets().subscribe({
      next: (data) => {
        this.publicationsOriginal = data;
        this.publications = data;
        this.loading = false;
      },
      error: () => {
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
    this.publications = this.publicationsOriginal.filter(pet =>
      (!filter.age || this.getAgeCategory(pet.age) === filter.age) &&
      (!filter.size || pet.size.toLowerCase() === filter.size?.toLowerCase())
    );
    this.applySort();
  }

  applySort(): void {
    if (!this.sortOption) return;

    this.publications.sort((a, b) => {
      switch (this.sortOption) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'age-asc':
          return a.age - b.age;
        case 'age-desc':
          return b.age - a.age;
        default:
          return 0;
      }
    });
  }

  onRequestAdoption(pet: Pet): void {
    if ((pet.status || '').trim().toLowerCase() !== 'available') {
      alert('Error: Mascota no disponible para adopción.');
      return;
    }
    // Obtener datos del usuario actual
    const applicantId = localStorage.getItem('profileId');
    const applicantFullName = localStorage.getItem('username') || '';
    const request = {
      publicationId: pet.id,
      applicantId: applicantId,
      applicantFullName: applicantFullName,
      reasonMessage: 'Quiero adoptar esta mascota.',
      status: 'PENDING',
      requestDate: new Date().toISOString()
    };
    this.adoptionRequestService.create(request)
      .subscribe({
        next: () => {
          alert('Request enviado, espera la respuesta');
        },
        error: () => {
          alert('Error al enviar la solicitud.');
        }
      });
  }
}
