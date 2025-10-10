import { Pet } from '../../pets/model/pet.entity';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AdoptionRequest {
  id: number;
  publicationId: number;
  applicantId: string | number;
  applicantFullName: string;
  reasonMessage: string;
  status: RequestStatus;
  requestDate: string;
  pet?: Pet; // Propiedad opcional para mostrar datos de la mascota
}
