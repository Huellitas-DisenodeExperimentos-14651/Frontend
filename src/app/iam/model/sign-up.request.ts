export interface SignUpRequest {
  username: string;
  password: string;
  name: string;
  email: string;
  address: string;
  role: 'ADOPTER' | 'SHELTER';
  // paymentMethods: string[];
  paymentMethods: Array<{ type: string; label?: string; data: any }>;
  preferences: string[];
  profilePic: string;
  bio: string;
  capacity: number;
  animalsAvailable: number;
  homeType: string;
  previousExperience: string;
}
