export interface CreatePetRequest {
  id?: string | number; // opcional: permitir que el cliente proponga un id
  name: string;
  age: number;
  photo: string; // Puede ser URL o base64, según tu backend
  breed: string;
  size: 'small' | 'medium' | 'large';
  description: string;
  healthStatus: string;
  vaccinationStatus: string;
  specialNeeds: string;
  profileId?: string | number; // id del refugio/owner
  status?: 'available' | 'adopted' | 'fostered' | 'interview';
}
