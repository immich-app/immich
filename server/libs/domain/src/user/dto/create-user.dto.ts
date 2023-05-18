import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import sanitize from 'sanitize-filename';

export class CreateUserDto {
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase())
  email!: string;

  @IsNotEmpty()
  @IsString()
  password!: string;

  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @IsNotEmpty()
  @IsString()
  lastName!: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitize(value || ''))
  storageLabel?: string | null;
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
