import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { User, UserAdmin } from 'src/database';
import { UserAvatarColor, UserMetadataKey, UserStatus } from 'src/enum';
import { UserMetadataItem } from 'src/types';
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

  @Optional({ nullable: true })
  @IsEnum(UserAvatarColor)
  @ApiProperty({ enumName: 'UserAvatarColor', enum: UserAvatarColor })
  avatarColor?: UserAvatarColor | null;
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

const emailToAvatarColor = (email: string): UserAvatarColor => {
  const values = Object.values(UserAvatarColor);
  const randomIndex = Math.floor(
    [...email].map((letter) => letter.codePointAt(0) ?? 0).reduce((a, b) => a + b, 0) % values.length,
  );
  return values[randomIndex];
};

export const mapUser = (entity: User | UserAdmin): UserResponseDto => {
  return {
    id: entity.id,
    email: entity.email,
    name: entity.name,
    profileImagePath: entity.profileImagePath,
    avatarColor: entity.avatarColor ?? emailToAvatarColor(entity.email),
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

  @IsString()
  password!: string;

  @IsNotEmpty()
  @IsString()
  name!: string;

  @Optional({ nullable: true })
  @IsEnum(UserAvatarColor)
  @ApiProperty({ enumName: 'UserAvatarColor', enum: UserAvatarColor })
  avatarColor?: UserAvatarColor | null;

  @Optional({ nullable: true })
  @IsString()
  @Transform(toSanitized)
  storageLabel?: string | null;

  @Optional({ nullable: true })
  @IsNumber()
  @Min(0)
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
  @IsEnum(UserAvatarColor)
  @ApiProperty({ enumName: 'UserAvatarColor', enum: UserAvatarColor })
  avatarColor?: UserAvatarColor | null;

  @Optional({ nullable: true })
  @IsString()
  @Transform(toSanitized)
  storageLabel?: string | null;

  @ValidateBoolean({ optional: true })
  shouldChangePassword?: boolean;

  @Optional({ nullable: true })
  @IsNumber()
  @Min(0)
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

export function mapUserAdmin(entity: UserAdmin): UserAdminResponseDto {
  const metadata = entity.metadata || [];
  const license = metadata.find(
    (item): item is UserMetadataItem<UserMetadataKey.LICENSE> => item.key === UserMetadataKey.LICENSE,
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
    license: license ? { ...license, activatedAt: new Date(license?.activatedAt) } : null,
  };
}
