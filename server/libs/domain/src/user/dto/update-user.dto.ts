import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsHexColor, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';
import { toEmail, toSanitized } from '../../../../../apps/immich/src/utils/transform.util';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  @Transform(toEmail)
  email?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @IsOptional()
  @IsString()
  @Transform(toSanitized)
  storageLabel?: string;

  @IsNotEmpty()
  @IsUUID('4')
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;

  @IsOptional()
  @IsBoolean()
  shouldChangePassword?: boolean;

  @IsOptional()
  @ValidateIf((_, value) => value !== '')
  @IsHexColor()
  accentColor?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== '')
  @IsHexColor()
  darkAccentColor?: string;
}
