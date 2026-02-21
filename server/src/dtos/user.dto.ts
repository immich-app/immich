import { createZodDto } from 'nestjs-zod';
import { User, UserAdmin } from 'src/database';
import { UserAvatarColor, UserAvatarColorSchema, UserMetadataKey, UserStatusSchema } from 'src/enum';
import { UserMetadataItem } from 'src/types';
import { z } from 'zod';

export const UserUpdateMeSchema = z
  .object({
    email: z.email({ pattern: z.regexes.html5Email }).optional().describe('User email'),
    password: z
      .string()
      .optional()
      .describe('User password (deprecated, use change password endpoint)')
      .meta({ deprecated: true }),
    name: z.string().optional().describe('User name'),
    avatarColor: UserAvatarColorSchema.nullish(),
  })
  .meta({ id: 'UserUpdateMeDto' });

export class UserUpdateMeDto extends createZodDto(UserUpdateMeSchema) {}

export const UserResponseSchema = z
  .object({
    id: z.uuidv4().describe('User ID'),
    name: z.string().describe('User name'),
    email: z.string().describe('User email'),
    profileImagePath: z.string().describe('Profile image path'),
    avatarColor: UserAvatarColorSchema,
    profileChangedAt: z.iso.datetime().describe('Profile change date'),
  })
  .meta({ id: 'UserResponseDto' });

export class UserResponseDto extends createZodDto(UserResponseSchema) {}

const licenseKeyRegex = /^IM(SV|CL)(-[\dA-Za-z]{4}){8}$/;

export const UserLicenseSchema = z
  .object({
    licenseKey: z.string().regex(licenseKeyRegex).describe(`License key (format: ${licenseKeyRegex.toString()})`),
    activationKey: z.string().describe('Activation key'),
    activatedAt: z.iso.datetime().describe('Activation date'),
  })
  .meta({ id: 'UserLicense' });

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
    profileChangedAt: new Date(entity.profileChangedAt).toISOString(),
  };
};

export const UserAdminSearchSchema = z
  .object({
    withDeleted: z.boolean().optional().describe('Include deleted users'),
    id: z.uuidv4().optional().describe('User ID filter'),
  })
  .meta({ id: 'UserAdminSearchDto' });

export class UserAdminSearchDto extends createZodDto(UserAdminSearchSchema) {}

const pinCodeRegex = /^\d{6}$/;

export const UserAdminCreateSchema = z
  .object({
    email: z.email({ pattern: z.regexes.html5Email }).describe('User email'),
    password: z.string().describe('User password'),
    name: z.string().describe('User name'),
    avatarColor: UserAvatarColorSchema.nullish(),
    pinCode: z.string().regex(pinCodeRegex).describe('PIN code').nullish(),
    storageLabel: z.string().describe('Storage label').nullish(),
    quotaSizeInBytes: z.int().min(0).describe('Storage quota in bytes').nullish(),
    shouldChangePassword: z.boolean().optional().describe('Require password change on next login'),
    notify: z.boolean().optional().describe('Send notification email'),
    isAdmin: z.boolean().optional().describe('Grant admin privileges'),
  })
  .meta({ id: 'UserAdminCreateDto' });

export class UserAdminCreateDto extends createZodDto(UserAdminCreateSchema) {}

export const UserAdminUpdateSchema = z
  .object({
    email: z.email({ pattern: z.regexes.html5Email }).optional().describe('User email'),
    password: z.string().optional().describe('User password'),
    pinCode: z.string().regex(pinCodeRegex).describe('PIN code').nullish(),
    name: z.string().optional().describe('User name'),
    avatarColor: UserAvatarColorSchema.nullish(),
    storageLabel: z.string().describe('Storage label').nullish(),
    shouldChangePassword: z.boolean().optional().describe('Require password change on next login'),
    quotaSizeInBytes: z.int().min(0).describe('Storage quota in bytes').nullish(),
    isAdmin: z.boolean().optional().describe('Grant admin privileges'),
  })
  .meta({ id: 'UserAdminUpdateDto' });

export class UserAdminUpdateDto extends createZodDto(UserAdminUpdateSchema) {}

export const UserAdminDeleteSchema = z
  .object({
    force: z.boolean().optional().describe('Force delete even if user has assets'),
  })
  .meta({ id: 'UserAdminDeleteDto' });

export class UserAdminDeleteDto extends createZodDto(UserAdminDeleteSchema) {}

export const UserAdminResponseSchema = UserResponseSchema.extend({
  storageLabel: z.string().describe('Storage label').nullable(),
  shouldChangePassword: z.boolean().describe('Require password change on next login'),
  isAdmin: z.boolean().describe('Is admin user'),
  createdAt: z.iso.datetime().describe('Creation date'),
  deletedAt: z.iso.datetime().describe('Deletion date').nullable(),
  updatedAt: z.iso.datetime().describe('Last update date'),
  oauthId: z.string().describe('OAuth ID'),
  quotaSizeInBytes: z.number().describe('Storage quota in bytes').nullable(),
  quotaUsageInBytes: z.number().describe('Storage usage in bytes').nullable(),
  status: UserStatusSchema,
  license: UserLicenseSchema.nullable(),
}).meta({ id: 'UserAdminResponseDto' });

export class UserAdminResponseDto extends createZodDto(UserAdminResponseSchema) {}

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
    createdAt: new Date(entity.createdAt).toISOString(),
    deletedAt: entity.deletedAt != null ? new Date(entity.deletedAt).toISOString() : null,
    updatedAt: new Date(entity.updatedAt).toISOString(),
    oauthId: entity.oauthId,
    quotaSizeInBytes: entity.quotaSizeInBytes,
    quotaUsageInBytes: entity.quotaUsageInBytes,
    status: entity.status,
    license: license ? { ...license, activatedAt: new Date(license?.activatedAt).toISOString() } : null,
  } as UserAdminResponseDto;
}
