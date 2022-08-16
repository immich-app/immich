import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsEmail } from 'class-validator';

export class SignUpDto {
  @IsEmail()
  @ApiProperty({ example: 'testuser@email.com' })
  @Transform(({ value }) => value?.toLowerCase())
  email!: string;

  @IsNotEmpty()
  @ApiProperty({ example: 'password' })
  password!: string;

  @IsNotEmpty()
  @ApiProperty({ example: 'Admin' })
  firstName!: string;

  @IsNotEmpty()
  @ApiProperty({ example: 'Doe' })
  lastName!: string;
}
