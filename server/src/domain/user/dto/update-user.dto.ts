import { UserAvatarColor } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { Optional, toEmail, toSanitized } from '../../domain.util';

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

  @Optional()
  @IsString()
  externalPath?: string;

  @IsNotEmpty()
  @IsUUID('4')
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @Optional()
  @IsBoolean()
  isAdmin?: boolean;

  @Optional()
  @IsBoolean()
  shouldChangePassword?: boolean;

  @Optional()
  @IsBoolean()
  memoriesEnabled?: boolean;

  @Optional()
  @IsEnum(UserAvatarColor)
  @ApiProperty({ enumName: 'UserAvatarColor', enum: UserAvatarColor })
  avatarColor?: UserAvatarColor;
}
