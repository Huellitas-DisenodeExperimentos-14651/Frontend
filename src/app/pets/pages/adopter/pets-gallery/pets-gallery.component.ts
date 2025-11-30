import { Component, OnInit, OnDestroy } from '@angular/core';
import { Pet } from '../../../model/pet.entity';
import { PetsService } from '../../../services/pets.service';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PetCardComponent } from '../../../components/pet-card/pet-card.component';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';  // <-- Importar Router y RouterModule
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

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
    RouterModule
  ]
})
export class PetsGalleryComponent implements OnInit, OnDestroy {
  pets: Pet[] = [];
  isLoading = true;
  // Mostrar por defecto solo mascotas disponibles en la vista de adoptante
  statusFilter: string = 'available';

  // Nuevo: indicar si el usuario es refugio
  isShelter: boolean = false;

  private profileId: string | null = null;
  private subs = new Subscription();

  constructor(private service: PetsService, private router: Router) {
    // Si la ruta se reutiliza, recargar al volver
    this.subs.add(
      this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
        const pid = localStorage.getItem('profileId');
        if (pid && pid !== this.profileId) {
          this.profileId = pid;
          this.loadPets(pid);
        } else if (pid) {
          // recarga aunque sea el mismo id (por si se agregó una mascota)
          this.loadPets(pid);
        }
      })
    );

    // Suscribirse a cambios globales de mascotas
    this.subs.add(
      this.service.petsChanged.subscribe(() => {
        const pid = localStorage.getItem('profileId');
        if (pid) this.loadPets(pid);
      })
    );
  }

  ngOnInit(): void {
    this.profileId = localStorage.getItem('profileId');

    // Determinar rol del usuario para cambiar comportamiento de la vista
    const role = localStorage.getItem('role');
    this.isShelter = role === 'SHELTER';

    if (!this.profileId) {
      console.error('No se encontró el profileId en localStorage.');
      this.isLoading = false;
      return;
    }

    this.loadPets(this.profileId);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadPets(profileId: string): void {
    this.isLoading = true;
    console.log('[PetsGallery] loadPets -> profileId:', profileId);
    this.service.getByProfileId(profileId).subscribe({
      next: (data) => {
        console.log('[PetsGallery] getByProfileId returned count:', Array.isArray(data) ? data.length : 'not-array', data && data.length > 0 ? data[0] : null);
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
    // Si el usuario es un refugio, mostrar todas las mascotas relacionadas a su perfil
    if (this.isShelter) return this.pets;

    // En la vista de adoptante queremos mostrar solamente mascotas disponibles
    return this.pets.filter(pet => pet.status === 'available');
  }

  // Método para navegar al crear mascota
  navigateToCreate(): void {
    this.router.navigate(['pets/create']);
  }

  removePetFromList(id: string | number): void {
    this.pets = this.pets.filter(p => String(p.id) !== String(id));
  }
}
