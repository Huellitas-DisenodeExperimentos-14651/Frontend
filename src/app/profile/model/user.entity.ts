export class User {
  id: string | number;
  username?: string;
  name?: string;
  email?: string;
  address?: string;
  role?: 'ADOPTER' | 'SHELTER' | 'RESCUER';
  paymentMethods: any[] = [];
  preferences: any[] = [];
  profilePic?: string;
  bio?: string;
  capacity?: number;
  animalsAvailable?: number;
  homeType?: string;
  previousExperience?: string;
  preferencesString?: string;
  paymentMethodsString?: string;
  password?: string;
  paymentConfigured?: boolean;

  constructor(data: any = {}) {
    this.id = data.id;
    this.username = data.username;
    this.name = data.name;
    this.email = data.email;
    this.address = data.address;
    this.role = data.role;
    this.paymentMethods = data.paymentMethods ?? [];
    this.preferences = data.preferences ?? [];
    this.profilePic = data.profilePic;
    this.bio = data.bio;
    this.capacity = data.capacity;
    this.animalsAvailable = data.animalsAvailable;
    this.homeType = data.homeType;
    this.previousExperience = data.previousExperience;
    this.preferencesString = data.preferencesString;
    this.paymentMethodsString = data.paymentMethodsString;
    this.password = data.password;
    this.paymentConfigured = data.paymentConfigured;
  }
}
