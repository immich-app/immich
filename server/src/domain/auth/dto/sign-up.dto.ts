import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SignUpDto {
  @IsEmail({ require_tld: false })
  @Transform(({ value }) => value?.toLowerCase())
  @IsNotEmpty()
  @ApiProperty({ example: 'testuser@email.com' })
  email!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'password' })
  password!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Admin' })
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Doe' })
  lastName!: string;
}
