import { IsNotEmpty } from 'class-validator';

export class LoginCredentialDto {
  @IsNotEmpty()
  email!: string;

  @IsNotEmpty()
  password!: string;
}
