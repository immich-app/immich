import { createZodDto } from '@immich/nestjs-standard-schema/zod';
import sanitize from 'sanitize-filename';
import z from 'zod';
import { AuthApiKey, AuthSession, AuthSharedLink, AuthUser, UserAdmin } from 'src/database.js';
import { ImmichCookie, UserMetadataKey } from 'src/enum.js';
import type { UserMetadataItem } from 'src/types.js';
import { HumanReadableSize } from 'src/utils/bytes.js';
import { toEmail } from 'src/validation.js';

export type CookieResponse = {
  isSecure: boolean;
  values: Array<{ key: ImmichCookie; value: string | null }>;
};

export const pinCodeRegex = /^\d{6}$/;

export type AuthDto = {
  user: AuthUser;
  apiKey?: AuthApiKey;
  sharedLink?: AuthSharedLink;
  session?: AuthSession;
};

export const isMetadataHidden = (auth?: AuthDto) => !!auth?.sharedLink && !auth.sharedLink.showExif;

export const isEditedOnly = (auth: AuthDto, edited = false) => !!auth.sharedLink || edited;

const storageLabelClaimSchema = z
  .string()
  .optional()
  .transform((label) => {
    if (label === undefined) {
      return;
    }

    return label ? sanitize(label) : null;
  })
  .catch(undefined);
const quotaSizeInBytesSchema = z.coerce
  .number()
  .int()
  .min(-1)
  .nullable()
  .optional()
  .transform((quota) => {
    if (quota === undefined) {
      return;
    }

    return quota === null || quota === -1 ? null : quota * HumanReadableSize.GiB;
  })
  .catch(undefined);

export const OAuthProfileSchema = z.object({
  defaults: z.object({
    immich_quota_bytes: quotaSizeInBytesSchema,
  }),
  sub: z.string(),
  email: z.string().trim().toLowerCase().optional().catch(undefined),
  email_verified: z.coerce.boolean().optional().catch(undefined),
  name: z.string().trim().optional().catch(undefined),
  given_name: z.string().trim().optional().catch(undefined),
  family_name: z.string().trim().optional().catch(undefined),
  preferred_username: z.string().trim().optional().catch(undefined),
  picture: z.string().optional().catch(undefined),
  immich_storage_label: storageLabelClaimSchema,
  immich_quota_bytes: quotaSizeInBytesSchema,
  immich_role: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((value) => {
      if (!value) {
        return;
      }

      const roles = Array.isArray(value) ? value : [value];
      if (roles.includes('admin')) {
        return 'admin';
      }

      return 'user';
    })
    .catch(undefined),
});
export type OAuthProfile = z.infer<typeof OAuthProfileSchema>;

const LoginCredentialSchema = z
  .object({
    email: toEmail.describe('User email').meta({ example: 'testuser@email.com' }),
    password: z.string().describe('User password').meta({ example: 'password' }),
  })
  .meta({ id: 'LoginCredentialDto' });

export function mapLoginResponse(entity: UserAdmin, accessToken: string): LoginResponseDto {
  const onboardingMetadata = entity.metadata.find(
    (item): item is UserMetadataItem<UserMetadataKey.Onboarding> => item.key === UserMetadataKey.Onboarding,
  )?.value;

  return {
    accessToken,
    userId: entity.id,
    userEmail: entity.email,
    name: entity.name,
    isAdmin: entity.isAdmin,
    profileImagePath: entity.profileImagePath,
    shouldChangePassword: entity.shouldChangePassword,
    isOnboarded: onboardingMetadata?.isOnboarded ?? false,
  };
}

const SignUpSchema = LoginCredentialSchema.extend({
  name: z.string().describe('User name').meta({ example: 'Admin' }),
}).meta({ id: 'SignUpDto' });

const PinCodeResetSchema = z.object({
  pinCode: z.string().regex(pinCodeRegex).optional().describe('New PIN code (4-6 digits)').meta({ example: '123456' }),
  password: z
    .string()
    .optional()
    .describe('User password (required if PIN code is not provided)')
    .meta({ example: 'password' }),
});

const SessionUnlockSchema = PinCodeResetSchema.meta({ id: 'SessionUnlockDto' });

const PinCodeChangeSchema = PinCodeResetSchema.extend({
  newPinCode: z.string().regex(pinCodeRegex).describe('New PIN code (4-6 digits)'),
}).meta({ id: 'PinCodeChangeDto' });

export class LoginCredentialDto extends createZodDto(LoginCredentialSchema) {}

export class LoginResponseDto extends createZodDto({
  accessToken: z.string().describe('Access token'),
  userId: z.uuidv4().describe('User ID'),
  userEmail: toEmail.describe('User email'),
  name: z.string().describe('User name'),
  profileImagePath: z.string().describe('Profile image path'),
  isAdmin: z.boolean().describe('Is admin user'),
  shouldChangePassword: z.boolean().describe('Should change password'),
  isOnboarded: z.boolean().describe('Is onboarded'),
}) {}

export class LogoutResponseDto extends createZodDto({
  successful: z.boolean().describe('Logout successful'),
  redirectUri: z.string().describe('Redirect URI'),
}) {}

export class SignUpDto extends createZodDto(SignUpSchema) {}

export class ChangePasswordDto extends createZodDto({
  password: z.string().describe('Current password').meta({ example: 'password' }),
  newPassword: z.string().min(8).describe('New password (min 8 characters)').meta({ example: 'password' }),
  invalidateSessions: z.boolean().default(false).optional().describe('Invalidate all other sessions'),
}) {}

export class PinCodeSetupDto extends createZodDto({
  pinCode: z.string().regex(pinCodeRegex).describe('PIN code (4-6 digits)').meta({ example: '123456' }),
}) {}

export class PinCodeResetDto extends createZodDto(PinCodeResetSchema) {}

export class SessionUnlockDto extends createZodDto(SessionUnlockSchema) {}

export class PinCodeChangeDto extends createZodDto(PinCodeChangeSchema) {}

export class ValidateAccessTokenResponseDto extends createZodDto({
  authStatus: z.boolean().describe('Authentication status'),
}) {}

export class OAuthCallbackDto extends createZodDto({
  url: z.string().min(1).describe('OAuth callback URL'),
  state: z.string().optional().describe('OAuth state parameter'),
  codeVerifier: z.string().optional().describe('OAuth code verifier (PKCE)'),
}) {}

export class OAuthConfigDto extends createZodDto({
  redirectUri: z.string().describe('OAuth redirect URI'),
  state: z.string().optional().describe('OAuth state parameter'),
  codeChallenge: z.string().optional().describe('OAuth code challenge (PKCE)'),
}) {}

export class OAuthAuthorizeResponseDto extends createZodDto({
  url: z.string().describe('OAuth authorization URL'),
}) {}

export class OAuthBackchannelLogoutDto extends createZodDto({
  logout_token: z.string().describe('OAuth logout token'),
}) {}

export class AuthStatusResponseDto extends createZodDto({
  pinCode: z.boolean().describe('Has PIN code set'),
  password: z.boolean().describe('Has password set'),
  isElevated: z.boolean().describe('Is elevated session'),
  expiresAt: z.string().optional().describe('Session expiration date'),
  pinExpiresAt: z.string().optional().describe('PIN expiration date'),
}) {}
