import { Component, OnInit } from '@angular/core';
import { Pet } from '../../../model/pet.entity';
import { PetsService } from '../../../services/pets.service';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PetCardComponent } from '../../../components/pet-card/pet-card.component';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';  // <-- Importar Router y RouterModule

@Component({
  selector: 'app-pets-gallery',
  standalone: true,
  templateUrl: './pets-gallery.component.html',
  styleUrls: ['./pets-gallery.component.css'],
  imports: [
    CommonModule,
    TranslateModule,
    PetCardComponent,
    FormsModule,
    RouterModule   // <-- Añadir RouterModule aquí
  ]
})
export class PetsGalleryComponent implements OnInit {
  pets: Pet[] = [];
  isLoading = true;
  statusFilter: string = 'all';

  constructor(private service: PetsService, private router: Router) {}  // <-- Inyectar Router

  ngOnInit(): void {
    const profileId = Number(localStorage.getItem('profileId'));

    if (!profileId) {
      console.error('No se encontró el profileId en localStorage.');
      this.isLoading = false;
      return;
    }

    this.loadPets(profileId);
  }

  loadPets(profileId: number): void {
    this.isLoading = true;
    this.service.getByProfileId(profileId).subscribe({
      next: (data) => {
        this.pets = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar las mascotas:', err);
        this.isLoading = false;
      }
    });
  }

  get filteredPets(): Pet[] {
    if (this.statusFilter === 'all') {
      return this.pets;
    }
    return this.pets.filter(pet => pet.status === this.statusFilter);
  }

  // Método para navegar al crear mascota
  navigateToCreate(): void {
    this.router.navigate(['pets/create']);
  }

  removePetFromList(id: number): void {
    this.pets = this.pets.filter(p => p.id !== id);
  }
}
