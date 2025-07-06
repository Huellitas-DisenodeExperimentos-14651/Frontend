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

}

