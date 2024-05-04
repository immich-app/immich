import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString, IsUUID } from 'class-validator';
import { getRandomAvatarColor } from 'src/dtos/user-profile.dto';
import { UserAvatarColor, UserEntity, UserStatus } from 'src/entities/user.entity';
import { Optional, ValidateBoolean, toEmail, toSanitized } from 'src/validation';

export class CreateUserDto {
  @IsEmail({ require_tld: false })
  @Transform(toEmail)
  email!: string;

  @IsNotEmpty()
  @IsString()
  password!: string;

  @IsNotEmpty()
  @IsString()
  name!: string;

  @Optional({ nullable: true })
  @IsString()
  @Transform(toSanitized)
  storageLabel?: string | null;

  @ValidateBoolean({ optional: true })
  memoriesEnabled?: boolean;

  @Optional({ nullable: true })
  @IsNumber()
  @IsPositive()
  @ApiProperty({ type: 'integer', format: 'int64' })
  quotaSizeInBytes?: number | null;

  @ValidateBoolean({ optional: true })
  shouldChangePassword?: boolean;

  @Optional()
  @IsBoolean()
  notify?: boolean;
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
  name!: string;
}

export class CreateUserOAuthDto {
  @IsEmail({ require_tld: false })
  @Transform(({ value }) => value?.toLowerCase())
  email!: string;

  @IsNotEmpty()
  oauthId!: string;

  name?: string;
}

export class DeleteUserDto {
  @ValidateBoolean({ optional: true })
  force?: boolean;
}

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

export class UserDto {
  id!: string;
  name!: string;
  email!: string;
  profileImagePath!: string;
  @IsEnum(UserAvatarColor)
  @ApiProperty({ enumName: 'UserAvatarColor', enum: UserAvatarColor })
  avatarColor!: UserAvatarColor;
}

export class UserResponseDto extends UserDto {
  storageLabel!: string | null;
  shouldChangePassword!: boolean;
  isAdmin!: boolean;
  createdAt!: Date;
  deletedAt!: Date | null;
  updatedAt!: Date;
  oauthId!: string;
  memoriesEnabled?: boolean;
  @ApiProperty({ type: 'integer', format: 'int64' })
  quotaSizeInBytes!: number | null;
  @ApiProperty({ type: 'integer', format: 'int64' })
  quotaUsageInBytes!: number | null;
  @ApiProperty({ enumName: 'UserStatus', enum: UserStatus })
  status!: string;
}

export const mapSimpleUser = (entity: UserEntity): UserDto => {
  return {
    id: entity.id,
    email: entity.email,
    name: entity.name,
    profileImagePath: entity.profileImagePath,
    avatarColor: entity.avatarColor ?? getRandomAvatarColor(entity),
  };
};

export function mapUser(entity: UserEntity): UserResponseDto {
  return {
    ...mapSimpleUser(entity),
    storageLabel: entity.storageLabel,
    shouldChangePassword: entity.shouldChangePassword,
    isAdmin: entity.isAdmin,
    createdAt: entity.createdAt,
    deletedAt: entity.deletedAt,
    updatedAt: entity.updatedAt,
    oauthId: entity.oauthId,
    memoriesEnabled: entity.memoriesEnabled,
    quotaSizeInBytes: entity.quotaSizeInBytes,
    quotaUsageInBytes: entity.quotaUsageInBytes,
    status: entity.status,
  };
}
