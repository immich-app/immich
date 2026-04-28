import { createZodDto } from 'nestjs-zod';
import { User, UserAdmin } from 'src/database';
import { pinCodeRegex } from 'src/dtos/auth.dto';
import { UserAvatarColor, UserAvatarColorSchema, UserMetadataKey, UserStatusSchema } from 'src/enum';
import { MaybeDehydrated, UserMetadataItem } from 'src/types';
import { asDateString } from 'src/utils/date';
import { emptyStringToNull, isoDatetimeToDate, sanitizeFilename, stringToBool, toEmail } from 'src/validation';
import z from 'zod';

export const UserUpdateMeSchema = z
  .object({
    email: toEmail.optional().describe('User email'),
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
    email: toEmail.describe('User email'),
    profileImagePath: z.string().describe('Profile image path'),
    avatarColor: UserAvatarColorSchema,
    // TODO: use `isoDatetimeToDate` when using `ZodSerializerDto` on the controllers.
    profileChangedAt: z.string().meta({ format: 'date-time' }).describe('Profile change date'),
  })
  .meta({ id: 'UserResponseDto' });

export class UserResponseDto extends createZodDto(UserResponseSchema) {}

const licenseKeyRegex = /^IM(SV|CL)(-[\dA-Za-z]{4}){8}$/;

export const UserLicenseSchema = z
  .object({
    licenseKey: z.string().regex(licenseKeyRegex).describe(`License key (format: ${licenseKeyRegex.toString()})`),
    activationKey: z.string().describe('Activation key'),
    activatedAt: isoDatetimeToDate.describe('Activation date'),
  })
  .meta({ id: 'UserLicense' });

const emailToAvatarColor = (email: string): UserAvatarColor => {
  const values = Object.values(UserAvatarColor);
  const randomIndex = Math.floor(
    [...email].map((letter) => letter.codePointAt(0) ?? 0).reduce((a, b) => a + b, 0) % values.length,
  );
  return values[randomIndex];
};

export const mapUser = (entity: MaybeDehydrated<User | UserAdmin>): UserResponseDto => {
  return {
    id: entity.id,
    email: entity.email,
    name: entity.name,
    profileImagePath: entity.profileImagePath,
    avatarColor: entity.avatarColor ?? emailToAvatarColor(entity.email),
    profileChangedAt: asDateString(entity.profileChangedAt),
  };
};

const UserAdminSearchSchema = z
  .object({
    withDeleted: stringToBool.optional().describe('Include deleted users'),
    id: z.uuidv4().optional().describe('User ID filter'),
  })
  .meta({ id: 'UserAdminSearchDto' });

export class UserAdminSearchDto extends createZodDto(UserAdminSearchSchema) {}

export const UserAdminCreateSchema = z
  .object({
    email: toEmail.describe('User email'),
    password: z.string().describe('User password'),
    name: z.string().describe('User name'),
    avatarColor: UserAvatarColorSchema.nullish(),
    pinCode: emptyStringToNull(z.string().regex(pinCodeRegex).nullable())
      .optional()
      .describe('PIN code')
      .meta({ example: '123456' }),
    storageLabel: z.string().pipe(sanitizeFilename).nullish().describe('Storage label'),
    quotaSizeInBytes: z.int().min(0).nullish().describe('Storage quota in bytes'),
    shouldChangePassword: z.boolean().optional().describe('Require password change on next login'),
    notify: z.boolean().optional().describe('Send notification email'),
    isAdmin: z.boolean().optional().describe('Grant admin privileges'),
  })
  .meta({ id: 'UserAdminCreateDto' });

export class UserAdminCreateDto extends createZodDto(UserAdminCreateSchema) {}

const UserAdminUpdateSchema = z
  .object({
    email: toEmail.optional().describe('User email'),
    password: z.string().optional().describe('User password'),
    pinCode: emptyStringToNull(z.string().regex(pinCodeRegex).nullable())
      .optional()
      .describe('PIN code')
      .meta({ example: '123456' }),
    name: z.string().optional().describe('User name'),
    avatarColor: UserAvatarColorSchema.nullish(),
    storageLabel: z.string().pipe(sanitizeFilename).nullish().describe('Storage label'),
    shouldChangePassword: z.boolean().optional().describe('Require password change on next login'),
    quotaSizeInBytes: z.int().min(0).nullish().describe('Storage quota in bytes'),
    isAdmin: z.boolean().optional().describe('Grant admin privileges'),
  })
  .meta({ id: 'UserAdminUpdateDto' });

export class UserAdminUpdateDto extends createZodDto(UserAdminUpdateSchema) {}

const UserAdminDeleteSchema = z
  .object({
    force: z.boolean().optional().describe('Force delete even if user has assets'),
  })
  .meta({ id: 'UserAdminDeleteDto' });

export class UserAdminDeleteDto extends createZodDto(UserAdminDeleteSchema) {}

const UserAdminResponseSchema = UserResponseSchema.extend({
  storageLabel: z.string().nullable().describe('Storage label'),
  shouldChangePassword: z.boolean().describe('Require password change on next login'),
  isAdmin: z.boolean().describe('Is admin user'),
  createdAt: isoDatetimeToDate.describe('Creation date'),
  deletedAt: isoDatetimeToDate.nullable().describe('Deletion date'),
  updatedAt: isoDatetimeToDate.describe('Last update date'),
  oauthId: z.string().describe('OAuth ID'),
  quotaSizeInBytes: z.int().min(0).nullable().describe('Storage quota in bytes'),
  quotaUsageInBytes: z.int().min(0).nullable().describe('Storage usage in bytes'),
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
    createdAt: entity.createdAt,
    deletedAt: entity.deletedAt,
    updatedAt: entity.updatedAt,
    oauthId: entity.oauthId,
    quotaSizeInBytes: entity.quotaSizeInBytes,
    quotaUsageInBytes: entity.quotaUsageInBytes,
    status: entity.status,
    license: license ? { ...license, activatedAt: new Date(license.activatedAt) } : null,
  };
}
