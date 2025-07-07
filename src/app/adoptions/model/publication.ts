// publication.entity.ts
export interface Publication {
  id: number;
  title: string;
  description: string;
  contactInfo: string;
  location: string;
  publishedAt: string;
  petId: number;
  isActive: boolean;
}
