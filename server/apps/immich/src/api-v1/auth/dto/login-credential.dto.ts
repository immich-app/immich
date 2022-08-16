import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

export class LoginCredentialDto {
  @IsNotEmpty()
  @ApiProperty({ example: 'testuser@email.com' })
  @Transform(({ value }) => value?.toLowerCase())
  email!: string;

  @IsNotEmpty()
  @ApiProperty({ example: 'password' })
  password!: string;
}
