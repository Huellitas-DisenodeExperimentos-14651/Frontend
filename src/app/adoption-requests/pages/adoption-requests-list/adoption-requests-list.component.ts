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
  userId = '98cd'; // Aquí puedes obtener el id dinámicamente si tienes autenticación

  constructor(
    private adoptionRequestService: AdoptionRequestService,
    private petsService: PetsService
  ) {}

  ngOnInit(): void {
    this.adoptionRequestService.getAll().subscribe({
      next: (data) => {
        // Filtrar solo las solicitudes del usuario actual
        const userRequests = data.filter((req: any) => req.applicantId === this.userId);
        // Obtener los datos de las mascotas asociadas
        this.petsService.getAll().subscribe({
          next: (pets: any[]) => {
            this.requests = userRequests.map((req: any) => ({
              ...req,
              pet: pets.find(p => p.id == req.publicationId)
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
