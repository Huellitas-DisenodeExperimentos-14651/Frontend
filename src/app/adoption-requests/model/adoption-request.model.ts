import { Pet } from '../../pets/model/pet.entity';
import { User } from '../../profile/model/user.entity';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'INTERVIEW' | 'COMPLETED';

export interface AdoptionRequest {
  id: string | number;
  // Compatibilidad: algunos registros antiguos usan `publicationId`.
  publicationId?: number | string;
  // Nuevo: referenciar explícitamente a la mascota con `petId`.
  petId?: number | string;
  applicantId: string | number;
  applicantFullName: string;
  reasonMessage: string;
  status: RequestStatus;
  requestDate: string;
  pet?: Pet; // Propiedad opcional para mostrar datos de la mascota
  interviewDate?: string; // fecha agendada para entrevista (ISO string)
  // optionally cache the applicant profile when needed
  applicantProfile?: User;
  ownerId?: string | number; // id del usuario/refugio que creó la mascota/publicación
}
