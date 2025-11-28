import { DonationRecord } from './donation-record.entity';

export interface Donation {
  id: string;
  type: 'monetaria' | 'especie';
  title: string;
  description: string;
  contactInfo: string;
  location?: string;
  imageUrl?: string;
  address?: string;
  records?: DonationRecord[];

  // campos opcionales para mostrar progreso y clasificación
  goal?: number;       // meta financiera (S/.)
  collected?: number;  // recaudado hasta ahora (S/.)
  category?: string;   // categoría para filtrado
  createdAt?: string;  // fecha de creación

  // campo interno temporal para presets (montos rápidos)
  __presetAmount?: number;
}
