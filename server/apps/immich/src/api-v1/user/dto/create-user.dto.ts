import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsEmail } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase())
  @ApiProperty({ example: 'testuser@email.com' })
  email!: string;

  @IsNotEmpty()
  @ApiProperty({ example: 'password' })
  password!: string;

  @IsNotEmpty()
  @ApiProperty({ example: 'John' })
  firstName!: string;

  @IsNotEmpty()
  @ApiProperty({ example: 'Doe' })
  lastName!: string;
}

export class CreateAdminDto {
  @IsNotEmpty()
  isAdmin!: true;

  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase())
  email!: string;

  @IsNotEmpty()
  password!: string;

  @IsNotEmpty()
  firstName!: string;

  @IsNotEmpty()
  lastName!: string;
}

export class CreateUserOAuthDto {
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase())
  email!: string;

  @IsNotEmpty()
  oauthId!: string;

  firstName?: string;

  lastName?: string;
}
