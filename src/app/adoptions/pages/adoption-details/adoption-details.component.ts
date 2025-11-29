import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { Pet } from '../../../pets/model/pet.entity';
import { PetsService } from '../../../pets/services/pets.service';
import {AdoptionRequestService} from '../../../adoption-requests/services/adoption-request.service';
import {FormsModule} from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-adoption-details',
  templateUrl: './adoption-details.component.html',
  styleUrls: ['./adoption-details.component.css'],
  imports: [CommonModule, RouterModule, TranslateModule, FormsModule]
})
export class AdoptionDetailsComponent implements OnInit {
  pet!: Pet | undefined;
  loading = true;
  reasonMessage: string = ''; // mensaje del solicitante

  constructor(
    private route: ActivatedRoute,
    private petsService: PetsService,
    private adoptionRequestService: AdoptionRequestService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.petsService.getById(id).subscribe({
      next: (data) => {
        this.pet = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al obtener la mascota:', err);
        this.loading = false;
      }
    });
  }

  adopt(): void {
    if (!this.pet) {
      alert('Mascota no encontrada.');
      return;
    }
    if (!this.reasonMessage) {
      alert('Debes ingresar un mensaje antes de enviar.');
      return;
    }

    // Obtener datos del usuario actual
    const applicantId = localStorage.getItem('profileId');
    if (!applicantId) {
      alert('Debes iniciar sesión para solicitar la adopción.');
      return;
    }
    const applicantFullName = localStorage.getItem('username') || '';
    const ownerId = (this.pet as any)?.profileId ?? (this.pet as any)?.ownerId ?? undefined;

    const payload = {
      petId: this.pet.id,
      reasonMessage: this.reasonMessage,
      applicantId: applicantId,
      applicantFullName: applicantFullName,
      ownerId: ownerId,
      status: 'PENDING'
    };

    this.adoptionRequestService.create(payload).subscribe({
      next: () => {
        alert('¡Solicitud enviada con éxito!');
        this.reasonMessage = '';
      },
      error: (err) => {
        console.error('Error al enviar solicitud:', err);
        alert('Ocurrió un error al enviar la solicitud.');
      }
    });
  }
}
