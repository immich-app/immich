export class JwtPayloadDto {
  constructor(userId: string, email: string) {
    this.userId = userId;
    this.email = email;
  }

  userId: string;
  email: string;
}
