import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdoptionRequestService } from '../../services/adoption-request.service';
import { PetsService } from '../../../pets/services/pets.service';

@Component({
  selector: 'app-adoption-requests-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './adoption-requests-list.component.html',
  styleUrls: ['./adoption-requests-list.component.css']
})
export class AdoptionRequestsListComponent implements OnInit {
  requests: any[] = [];
  loading = true;
  // Obtener userId desde localStorage si existe, fallback a valor hardcodeado para pruebas
  userId = localStorage.getItem('profileId') || '98cd';

  constructor(
    private adoptionRequestService: AdoptionRequestService,
    private petsService: PetsService
  ) {}

  ngOnInit(): void {
    this.adoptionRequestService.getAll().subscribe({
      next: (data) => {
        // Filtrar solo las solicitudes del usuario actual
        const userRequests = data.filter((req: any) => {
          // Normalizar y comparar como strings para evitar false negatives por tipo
          const applicantId = req?.applicantId ?? req?.applicant_id ?? req?.applicant ?? req?.requesterId;
          return String(applicantId ?? '') === String(this.userId ?? '');
        });
        // Obtener los datos de las mascotas asociadas
        this.petsService.getAll().subscribe({
          next: (pets: any[]) => {
            this.requests = userRequests.map((req: any) => ({
              ...req,
              // buscar por petId primero (normalizado por el servicio), luego por publicationId
              pet: pets.find(p => String(p.id) === String(req.petId ?? req.publicationId ?? ''))
            }));
            this.loading = false;
          },
          error: () => {
            this.requests = userRequests;
            this.loading = false;
          }
        });
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString();
  }
}
