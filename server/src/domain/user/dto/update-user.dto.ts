import { UserAvatarColor } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString, IsUUID } from 'class-validator';
import { Optional, ValidateBoolean, toEmail, toSanitized } from '../../domain.util';

export class UpdateUserDto {
  @Optional()
  @IsEmail({ require_tld: false })
  @Transform(toEmail)
  email?: string;

  @Optional()
  @IsNotEmpty()
  @IsString()
  password?: string;

  @Optional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @Optional()
  @IsString()
  @Transform(toSanitized)
  storageLabel?: string;

  @IsNotEmpty()
  @IsUUID('4')
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ValidateBoolean({ optional: true })
  isAdmin?: boolean;

  @ValidateBoolean({ optional: true })
  shouldChangePassword?: boolean;

  @ValidateBoolean({ optional: true })
  memoriesEnabled?: boolean;

  @Optional()
  @IsEnum(UserAvatarColor)
  @ApiProperty({ enumName: 'UserAvatarColor', enum: UserAvatarColor })
  avatarColor?: UserAvatarColor;

  @Optional({ nullable: true })
  @IsNumber()
  @IsPositive()
  @ApiProperty({ type: 'integer', format: 'int64' })
  quotaSizeInBytes?: number | null;
}
