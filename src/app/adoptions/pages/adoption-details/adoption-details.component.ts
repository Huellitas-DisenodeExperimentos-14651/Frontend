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
  publicationId!: number; // 🔹 nuevo
  reasonMessage: string = ''; // 🔹 nuevo

  constructor(
    private route: ActivatedRoute,
    private petsService: PetsService,
    private adoptionRequestService: AdoptionRequestService // 🔹 nuevo
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.petsService.getById(id).subscribe({
      next: (data) => {
        this.pet = data;
        this.loading = false;

        // 👇 Aquí simulamos obtener el publicationId según petId.
        // En producción, deberías tener un endpoint que retorne la publicación según el petId.
        this.publicationId = 3; // TODO: Reemplazar por valor real
      },
      error: (err) => {
        console.error('Error al obtener la mascota:', err);
        this.loading = false;
      }
    });
  }

  adopt(): void {
    if (!this.publicationId || !this.reasonMessage) {
      alert('Debes ingresar un mensaje antes de enviar.');
      return;
    }

    const payload = {
      publicationId: this.publicationId,
      reasonMessage: this.reasonMessage
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
