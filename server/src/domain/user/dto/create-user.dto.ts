import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { toEmail, toSanitized } from '../../domain.util';

export class CreateUserDto {
  @IsEmail({ require_tld: false })
  @Transform(toEmail)
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
  @Transform(toSanitized)
  storageLabel?: string | null;

  @IsOptional()
  @IsString()
  externalPath?: string | null;
}

export class CreateAdminDto {
  @IsNotEmpty()
  isAdmin!: true;

  @IsEmail({ require_tld: false })
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
  @IsEmail({ require_tld: false })
  @Transform(({ value }) => value?.toLowerCase())
  email!: string;

  @IsNotEmpty()
  oauthId!: string;

  firstName?: string;

  lastName?: string;
}
