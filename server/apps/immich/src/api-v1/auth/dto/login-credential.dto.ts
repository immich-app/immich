import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class LoginCredentialDto {
  @IsNotEmpty()
  @ApiProperty({ default: 'testuser@email.com' })
  email!: string;

  @IsNotEmpty()
  @ApiProperty({ default: 'password' })
  password!: string;
}
