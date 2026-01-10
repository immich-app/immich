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

  @ApiPropertyOptional({ description: 'Avatar color', enum: UserAvatarColor, nullable: true })
  @ValidateEnum({ enum: UserAvatarColor, name: 'UserAvatarColor', optional: true, nullable: true })
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
  @ApiProperty({ description: 'Avatar color', enum: UserAvatarColor })
  @ValidateEnum({ enum: UserAvatarColor, name: 'UserAvatarColor' })
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
  @ApiPropertyOptional({ description: 'Include deleted users' })
  @ValidateBoolean({ optional: true })
  withDeleted?: boolean;

  @ApiPropertyOptional({ description: 'User ID filter' })
  @ValidateUUID({ optional: true })
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

  @ApiPropertyOptional({ description: 'Avatar color', enum: UserAvatarColor, nullable: true })
  @ValidateEnum({ enum: UserAvatarColor, name: 'UserAvatarColor', optional: true, nullable: true })
  avatarColor?: UserAvatarColor | null;

  @ApiPropertyOptional({ description: 'Storage label', nullable: true })
  @Optional({ nullable: true })
  @IsString()
  @Transform(toSanitized)
  storageLabel?: string | null;

  @ApiPropertyOptional({ type: 'integer', format: 'int64', description: 'Storage quota in bytes', nullable: true })
  @Optional({ nullable: true })
  @IsInt()
  @Min(0)
  quotaSizeInBytes?: number | null;

  @ApiPropertyOptional({ description: 'Require password change on next login' })
  @ValidateBoolean({ optional: true })
  shouldChangePassword?: boolean;

  @ApiPropertyOptional({ description: 'Send notification email' })
  @ValidateBoolean({ optional: true })
  notify?: boolean;

  @ApiPropertyOptional({ description: 'Grant admin privileges' })
  @ValidateBoolean({ optional: true })
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

  @ApiPropertyOptional({ description: 'PIN code', nullable: true })
  @PinCode({ optional: true, nullable: true, emptyToNull: true })
  pinCode?: string | null;

  @ApiPropertyOptional({ description: 'User name' })
  @Optional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Avatar color', enum: UserAvatarColor, nullable: true })
  @ValidateEnum({ enum: UserAvatarColor, name: 'UserAvatarColor', optional: true, nullable: true })
  avatarColor?: UserAvatarColor | null;

  @ApiPropertyOptional({ description: 'Storage label', nullable: true })
  @Optional({ nullable: true })
  @IsString()
  @Transform(toSanitized)
  storageLabel?: string | null;

  @ApiPropertyOptional({ description: 'Require password change on next login' })
  @ValidateBoolean({ optional: true })
  shouldChangePassword?: boolean;

  @ApiPropertyOptional({ type: 'integer', format: 'int64', description: 'Storage quota in bytes', nullable: true })
  @Optional({ nullable: true })
  @IsInt()
  @Min(0)
  quotaSizeInBytes?: number | null;

  @ApiPropertyOptional({ description: 'Grant admin privileges' })
  @ValidateBoolean({ optional: true })
  isAdmin?: boolean;
}

export class UserAdminDeleteDto {
  @ApiPropertyOptional({ description: 'Force delete even if user has assets' })
  @ValidateBoolean({ optional: true })
  force?: boolean;
}

export class UserAdminResponseDto extends UserResponseDto {
  @ApiProperty({ description: 'Storage label', nullable: true })
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
  @ApiProperty({ type: 'integer', format: 'int64', description: 'Storage quota in bytes', nullable: true })
  quotaSizeInBytes!: number | null;
  @ApiProperty({ type: 'integer', format: 'int64', description: 'Storage usage in bytes', nullable: true })
  quotaUsageInBytes!: number | null;
  @ApiProperty({ description: 'User status', enum: UserStatus })
  @ValidateEnum({ enum: UserStatus, name: 'UserStatus' })
  status!: string;
  @ApiProperty({ description: 'User license', type: UserLicense, nullable: true })
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
