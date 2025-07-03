export interface CreatePetRequest {
  name: string;
  age: number;
  photo: string; // Puede ser URL o base64, según tu backend
  breed: string;
  size: 'small' | 'medium' | 'large';
  description: string;
  healthStatus: string;
  vaccinationStatus: string;
  specialNeeds: string;
}
