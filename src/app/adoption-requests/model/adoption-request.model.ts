export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AdoptionRequest {
  id: number;
  publicationId: number;
  applicantId: number;
  applicantFullName: string;
  reasonMessage: string;
  status: RequestStatus;
  requestDate: string;
}
