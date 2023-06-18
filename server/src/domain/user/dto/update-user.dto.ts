import { toEmail, toSanitized } from '@app/immich/utils/transform.util';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({ require_tld: false })
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
}
