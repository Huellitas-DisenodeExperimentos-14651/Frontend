export class User {
  constructor(
    public id: number,
    public name: string,
    public email: string,
    public address: string,
    public role: 'ADOPTER' | 'SHELTER' | 'RESCUER',
    public paymentMethods: string[] = [],
    public preferences: string[] = [],
    public profilePic?: string,
    public bio?: string,
    public capacity?: number,
    public animalsAvailable?: number,
    public homeType?: string,
    public previousExperience?: string,
    public preferencesString?: string,
    public paymentMethodsString?: string
  ) {}
}
