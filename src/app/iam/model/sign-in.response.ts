export class SignInResponse {
  public id: number;
  public username: string;
  public token: string;
  public role: string;
  public profileId: number;

  constructor(id: number, username: string, token: string, role: string, profileId: number) {
    this.id = id;
    this.username = username;
    this.token = token;
    this.role = role;
    this.profileId = profileId;
  }
}
