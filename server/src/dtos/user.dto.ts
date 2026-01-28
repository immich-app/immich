import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { User, UserAdmin } from 'src/database';
import { UserAvatarColor, UserMetadataKey, UserStatus } from 'src/enum';
import { UserMetadataItem } from 'src/types';
import { Optional, PinCode, ValidateBoolean, ValidateEnum, ValidateUUID, toEmail, toSanitized } from 'src/validation';

export class UserUpdateMeDto {
  @ApiPropertyOptional({ description: 'User email' })
  @Optional()
  @IsEmail({ require_tld: false })
  @Transform(toEmail)
  email?: string;

  // TODO: migrate to the other change password endpoint
  @ApiPropertyOptional({ description: 'User password (deprecated, use change password endpoint)' })
  @Optional()
  @IsNotEmpty()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ description: 'User name' })
  @Optional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ValidateEnum({ enum: UserAvatarColor, name: 'UserAvatarColor', optional: true, description: 'Avatar color' })
  avatarColor?: UserAvatarColor | null;
}

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id!: string;
  @ApiProperty({ description: 'User name' })
  name!: string;
  @ApiProperty({ description: 'User email' })
  email!: string;
  @ApiProperty({ description: 'Profile image path' })
  profileImagePath!: string;
  @ValidateEnum({ enum: UserAvatarColor, name: 'UserAvatarColor', description: 'Avatar color' })
  avatarColor!: UserAvatarColor;
  @ApiProperty({ description: 'Profile change date' })
  profileChangedAt!: Date;
}

export class UserLicense {
  @ApiProperty({ description: 'License key' })
  licenseKey!: string;
  @ApiProperty({ description: 'Activation key' })
  activationKey!: string;
  @ApiProperty({ description: 'Activation date' })
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
  @ValidateBoolean({ optional: true, description: 'Include deleted users' })
  withDeleted?: boolean;

  @ValidateUUID({ optional: true, description: 'User ID filter' })
  id?: string;
}

export class UserAdminCreateDto {
  @ApiProperty({ description: 'User email' })
  @IsEmail({ require_tld: false })
  @Transform(toEmail)
  email!: string;

  @ApiProperty({ description: 'User password' })
  @IsString()
  password!: string;

  @ApiProperty({ description: 'User name' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ValidateEnum({ enum: UserAvatarColor, name: 'UserAvatarColor', optional: true, description: 'Avatar color' })
  avatarColor?: UserAvatarColor | null;

  @ApiPropertyOptional({ description: 'Storage label' })
  @Optional({ nullable: true })
  @IsString()
  @Transform(toSanitized)
  storageLabel?: string | null;

  @ApiPropertyOptional({ type: 'integer', format: 'int64', description: 'Storage quota in bytes' })
  @Optional({ nullable: true })
  @IsInt()
  @Min(0)
  quotaSizeInBytes?: number | null;

  @ValidateBoolean({ optional: true, description: 'Require password change on next login' })
  shouldChangePassword?: boolean;

  @ValidateBoolean({ optional: true, description: 'Send notification email' })
  notify?: boolean;

  @ValidateBoolean({ optional: true, description: 'Grant admin privileges' })
  isAdmin?: boolean;
}

export class UserAdminUpdateDto {
  @ApiPropertyOptional({ description: 'User email' })
  @Optional()
  @IsEmail({ require_tld: false })
  @Transform(toEmail)
  email?: string;

  @ApiPropertyOptional({ description: 'User password' })
  @Optional()
  @IsNotEmpty()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ description: 'PIN code' })
  @PinCode({ optional: true, emptyToNull: true })
  pinCode?: string | null;

  @ApiPropertyOptional({ description: 'User name' })
  @Optional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ValidateEnum({ enum: UserAvatarColor, name: 'UserAvatarColor', optional: true, description: 'Avatar color' })
  avatarColor?: UserAvatarColor | null;

  @ApiPropertyOptional({ description: 'Storage label' })
  @Optional({ nullable: true })
  @IsString()
  @Transform(toSanitized)
  storageLabel?: string | null;

  @ValidateBoolean({ optional: true, description: 'Require password change on next login' })
  shouldChangePassword?: boolean;

  @ApiPropertyOptional({ type: 'integer', format: 'int64', description: 'Storage quota in bytes' })
  @Optional({ nullable: true })
  @IsInt()
  @Min(0)
  quotaSizeInBytes?: number | null;

  @ValidateBoolean({ optional: true, description: 'Grant admin privileges' })
  isAdmin?: boolean;
}

export class UserAdminDeleteDto {
  @ValidateBoolean({ optional: true, description: 'Force delete even if user has assets' })
  force?: boolean;
}

export class UserAdminResponseDto extends UserResponseDto {
  @ApiProperty({ description: 'Storage label' })
  storageLabel!: string | null;
  @ApiProperty({ description: 'Require password change on next login' })
  shouldChangePassword!: boolean;
  @ApiProperty({ description: 'Is admin user' })
  isAdmin!: boolean;
  @ApiProperty({ description: 'Creation date' })
  createdAt!: Date;
  @ApiProperty({ description: 'Deletion date' })
  deletedAt!: Date | null;
  @ApiProperty({ description: 'Last update date' })
  updatedAt!: Date;
  @ApiProperty({ description: 'OAuth ID' })
  oauthId!: string;
  @ApiProperty({ type: 'integer', format: 'int64', description: 'Storage quota in bytes' })
  quotaSizeInBytes!: number | null;
  @ApiProperty({ type: 'integer', format: 'int64', description: 'Storage usage in bytes' })
  quotaUsageInBytes!: number | null;
  @ValidateEnum({ enum: UserStatus, name: 'UserStatus', description: 'User status' })
  status!: string;
  @ApiProperty({ description: 'User license' })
  license!: UserLicense | null;
}

export function mapUserAdmin(entity: UserAdmin): UserAdminResponseDto {
  const metadata = entity.metadata || [];
  const license = metadata.find(
    (item): item is UserMetadataItem<UserMetadataKey.License> => item.key === UserMetadataKey.License,
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
