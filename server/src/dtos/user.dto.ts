import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { UserMetadataEntity } from 'src/entities/user-metadata.entity';
import { UserEntity } from 'src/entities/user.entity';
import { UserAvatarColor, UserMetadataKey, UserStatus } from 'src/enum';
import { getPreferences } from 'src/utils/preferences';
import { Optional, ValidateBoolean, toEmail, toSanitized } from 'src/validation';

export class UserUpdateMeDto {
  @Optional()
  @IsEmail({ require_tld: false })
  @Transform(toEmail)
  email?: string;

  // TODO: migrate to the other change password endpoint
  @Optional()
  @IsNotEmpty()
  @IsString()
  password?: string;

  @Optional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}

export class UserResponseDto {
  id!: string;
  name!: string;
  email!: string;
  profileImagePath!: string;
  @ApiProperty({ enumName: 'UserAvatarColor', enum: UserAvatarColor })
  avatarColor!: UserAvatarColor;
  profileChangedAt!: Date;
}

export class UserLicense {
  licenseKey!: string;
  activationKey!: string;
  activatedAt!: Date;
}

export const mapUser = (entity: UserEntity): UserResponseDto => {
  return {
    id: entity.id,
    email: entity.email,
    name: entity.name,
    profileImagePath: entity.profileImagePath,
    avatarColor: getPreferences(entity).avatar.color,
    profileChangedAt: entity.profileChangedAt,
  };
};

export class UserAdminSearchDto {
  @ValidateBoolean({ optional: true })
  withDeleted?: boolean;
}

export class UserAdminCreateDto {
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

export class UserAdminUpdateDto {
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

  @Optional({ nullable: true })
  @IsString()
  @Transform(toSanitized)
  storageLabel?: string | null;

  @ValidateBoolean({ optional: true })
  shouldChangePassword?: boolean;

  @Optional({ nullable: true })
  @IsNumber()
  @IsPositive()
  @ApiProperty({ type: 'integer', format: 'int64' })
  quotaSizeInBytes?: number | null;
}

export class UserAdminDeleteDto {
  @ValidateBoolean({ optional: true })
  force?: boolean;
}

export class UserAdminResponseDto extends UserResponseDto {
  storageLabel!: string | null;
  shouldChangePassword!: boolean;
  isAdmin!: boolean;
  createdAt!: Date;
  deletedAt!: Date | null;
  updatedAt!: Date;
  oauthId!: string;
  @ApiProperty({ type: 'integer', format: 'int64' })
  quotaSizeInBytes!: number | null;
  @ApiProperty({ type: 'integer', format: 'int64' })
  quotaUsageInBytes!: number | null;
  @ApiProperty({ enumName: 'UserStatus', enum: UserStatus })
  status!: string;
  license!: UserLicense | null;
}

export function mapUserAdmin(entity: UserEntity): UserAdminResponseDto {
  const license = entity.metadata?.find(
    (item): item is UserMetadataEntity<UserMetadataKey.LICENSE> => item.key === UserMetadataKey.LICENSE,
  )?.value;
  return {
    ...mapUser(entity),
    storageLabel: entity.storageLabel,
    shouldChangePassword: entity.shouldChangePassword,
    isAdmin: entity.isAdmin,
    createdAt: entity.createdAt,
    deletedAt: entity.deletedAt,
    updatedAt: entity.updatedAt,
    oauthId: entity.oauthId,
    quotaSizeInBytes: entity.quotaSizeInBytes,
    quotaUsageInBytes: entity.quotaUsageInBytes,
    status: entity.status,
    license: license ?? null,
  };
}
