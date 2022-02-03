import { IsNotEmpty } from 'class-validator';

export class SignUpDto {
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;
}
