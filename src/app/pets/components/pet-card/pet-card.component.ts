import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pet } from '../../model/pet.entity';
import { PetsService } from '../../services/pets.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-pet-card',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    RouterLink,
  ],
  templateUrl: './pet-card.component.html',
  styleUrls: ['./pet-card.component.css']
})
export class PetCardComponent {
  @Input() pet!: Pet;
  @Output() adoptionConfirmed = new EventEmitter<number>();
  @Output() petDeleted = new EventEmitter<number>();


  showModal = false;
  modalAnimation = '';
  isProcessing = false;

  constructor(private petsService: PetsService, private translate: TranslateService) {}

  // Métodos de modal (sin cambios)
  openDetails(): void {
    console.log('Detalles abiertos para:', this.pet.name);
    console.log('showModal antes de abrir:', this.showModal); // Log antes de cambiar
    this.showModal = true;
    console.log('showModal después de abrir:', this.showModal); // Log después de cambiar
    this.modalAnimation = 'modal-enter';
  }

  closeDetails(): void {
    console.log("Cerrando modal");  // Verifica que se ejecuta
    this.modalAnimation = 'modal-exit';
    setTimeout(() => {
      this.showModal = false;
    }, 300);  // El modal se cierra después de la animación
  }

  getStatusBadgeClass(): string {
    return `status-badge ${this.pet.status}`;
  }

  // Helpers de traducción con fallback
  getSizeLabel(): string {
    try {
      let raw = String(this.pet.size || '');
      // si viene como 'PET_SIZE.small' o similar, extraer la última parte
      if (raw.includes('.')) raw = raw.split('.').pop() || raw;
      if (raw.includes('_')) raw = raw.split('_').pop() || raw;
      const key = `PET_SIZE.${raw.toUpperCase()}`;
      const translated = this.translate.instant(key);
      return translated && translated !== key ? translated : raw;
    } catch {
      return String(this.pet.size || '');
    }
  }

  getVaccinationLabel(): string {
    try {
      return this.translate.instant('DETAILS.VACCINATION') || 'Vacunas';
    } catch {
      return 'Vacunas';
    }
  }

  onDeletePet(): void {
    if (confirm('¿Eliminar esta mascota?')) {
      this.isProcessing = true;
      this.petsService.delete(this.pet.id).subscribe({
        next: () => {
          this.isProcessing = false;
          alert('Mascota eliminada exitosamente');
          this.closeDetails();
          this.petDeleted.emit(this.pet.id); // ✅ avisamos al padre
        },
        error: (err) => {
          this.isProcessing = false;
          console.error('Error al eliminar mascota:', err);
          alert('Ocurrió un error al eliminar la mascota.');
        }
      });
    }
  }
}
