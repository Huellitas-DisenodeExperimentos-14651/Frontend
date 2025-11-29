import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { AdoptionFilter } from '../../model/adoption-filter.model';
import { AdoptionCardComponent } from '../../components/adoption-card/adoption-card.component';
import { AdoptionFiltersComponent } from '../../components/adoption-filters/adoption-filters.component';
import { PetNameFilterPipe } from '../../pipes/pet-name-filter.pipe';

import { AdoptionsService } from '../../services/adoptions.service';
import { AdoptionRequestService } from '../../../adoption-requests/services/adoption-request.service';
import { Pet } from '../../../pets/model/pet.entity';
import { PetsService } from '../../../pets/services/pets.service';

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
export class AdoptionsListComponent implements OnInit, OnDestroy {
  publications: Pet[] = [];
  publicationsOriginal: Pet[] = [];
  loading = true;
  private subs = new Subscription();
  search: string = '';
  sortOption: string = '';

  constructor(
    private adoptionsService: AdoptionsService,
    private adoptionRequestService: AdoptionRequestService,
    private petsService: PetsService
  ) {}

  ngOnInit(): void {
    this.adoptionsService.getAllDirectPets().subscribe({
      next: (data) => {
        // Mostrar únicamente mascotas disponibles para adoptantes
        const available = (data || []).filter((p: Pet) => String(p.status || '').toLowerCase() === 'available');
        this.publicationsOriginal = available;
        this.publications = available;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });

    // recargar si cambian las mascotas (p. ej. se marcó 'interview')
    this.subs.add(this.petsService.petsChanged.subscribe(() => {
      this.reloadAvailable();
    }));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private reloadAvailable(): void {
    this.adoptionsService.getAllDirectPets().subscribe({
      next: (data) => {
        const available = (data || []).filter((p: Pet) => String(p.status || '').toLowerCase() === 'available');
        this.publicationsOriginal = available;
        this.publications = available;
      },
      error: () => {}
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
    if (!applicantId) {
      alert('Debes iniciar sesión para solicitar la adopción.');
      return;
    }
    const applicantFullName = localStorage.getItem('username') || '';
    const ownerId = (pet as any).profileId ?? (pet as any).ownerId ?? undefined;
    const request = {
      // Usamos petId ya que las publicaciones no representan las mascotas en este proyecto
      petId: pet.id,
      applicantId: applicantId,
      applicantFullName: applicantFullName,
      reasonMessage: 'Quiero adoptar esta mascota.',
      status: 'PENDING',
      requestDate: new Date().toISOString(),
      ownerId: ownerId
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
