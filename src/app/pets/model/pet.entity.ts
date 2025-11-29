// pets/model/pet.entity.ts

export type PetStatus = 'available' | 'adopted' | 'fostered' | 'interview';
export type PetSize = 'small' | 'medium' | 'large';

export class Pet {
  id: number;
  name: string;
  age: number;
  photo: string;
  breed: string;
  size: PetSize;
  status: PetStatus;
  description: string;
  healthStatus: string;
  vaccinationStatus: string;
  specialNeeds: string;
  profileId?: string | number; // id del refugio/owner

  constructor(data: any) {
    this.id = data.id;
    this.name = data.name;
    this.age = data.age;
    this.photo = data.photo;
    this.breed = data.breed;
    this.size = data.size;
    this.status = data.status;
    this.description = data.description;
    this.healthStatus = data.healthStatus;
    this.vaccinationStatus = data.vaccinationStatus;
    this.specialNeeds = data.specialNeeds;
    this.profileId = data.profileId ?? data.ownerId ?? undefined;
  }
}
