import { createZodDto } from 'nestjs-zod';
import { AuthApiKey, AuthSession, AuthSharedLink, AuthUser, UserAdmin } from 'src/database';
import { ImmichCookie, UserMetadataKey } from 'src/enum';
import { UserMetadataItem } from 'src/types';
import { toEmail } from 'src/validation';
import z from 'zod';

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

const LoginCredentialSchema = z
  .object({
    email: toEmail.describe('User email').meta({ example: 'testuser@email.com' }),
    password: z.string().describe('User password').meta({ example: 'password' }),
  })
  .meta({ id: 'LoginCredentialDto' });

const LoginResponseSchema = z
  .object({
    accessToken: z.string().describe('Access token'),
    userId: z.string().describe('User ID'),
    userEmail: toEmail.describe('User email'),
    name: z.string().describe('User name'),
    profileImagePath: z.string().describe('Profile image path'),
    isAdmin: z.boolean().describe('Is admin user'),
    shouldChangePassword: z.boolean().describe('Should change password'),
    isOnboarded: z.boolean().describe('Is onboarded'),
  })
  .meta({ id: 'LoginResponseDto' });

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

const LogoutResponseSchema = z
  .object({
    successful: z.boolean().describe('Logout successful'),
    redirectUri: z.string().describe('Redirect URI'),
  })
  .meta({ id: 'LogoutResponseDto' });

const SignUpSchema = LoginCredentialSchema.extend({
  name: z.string().describe('User name').meta({ example: 'Admin' }),
}).meta({ id: 'SignUpDto' });

const ChangePasswordSchema = z
  .object({
    password: z.string().describe('Current password').meta({ example: 'password' }),
    newPassword: z.string().min(8).describe('New password (min 8 characters)').meta({ example: 'password' }),
    invalidateSessions: z.boolean().default(false).optional().describe('Invalidate all other sessions'),
  })
  .meta({ id: 'ChangePasswordDto' });

const PinCodeSetupSchema = z
  .object({
    pinCode: z.string().regex(pinCodeRegex).describe('PIN code (4-6 digits)').meta({ example: '123456' }),
  })
  .meta({ id: 'PinCodeSetupDto' });

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

const ValidateAccessTokenResponseSchema = z
  .object({
    authStatus: z.boolean().describe('Authentication status'),
  })
  .meta({ id: 'ValidateAccessTokenResponseDto' });

const OAuthCallbackSchema = z
  .object({
    url: z.string().min(1).describe('OAuth callback URL'),
    state: z.string().optional().describe('OAuth state parameter'),
    codeVerifier: z.string().optional().describe('OAuth code verifier (PKCE)'),
  })
  .meta({ id: 'OAuthCallbackDto' });

const OAuthConfigSchema = z
  .object({
    redirectUri: z.string().describe('OAuth redirect URI'),
    state: z.string().optional().describe('OAuth state parameter'),
    codeChallenge: z.string().optional().describe('OAuth code challenge (PKCE)'),
  })
  .meta({ id: 'OAuthConfigDto' });

const OAuthAuthorizeResponseSchema = z
  .object({
    url: z.string().describe('OAuth authorization URL'),
  })
  .meta({ id: 'OAuthAuthorizeResponseDto' });

const AuthStatusResponseSchema = z
  .object({
    pinCode: z.boolean().describe('Has PIN code set'),
    password: z.boolean().describe('Has password set'),
    isElevated: z.boolean().describe('Is elevated session'),
    expiresAt: z.string().optional().describe('Session expiration date'),
    pinExpiresAt: z.string().optional().describe('PIN expiration date'),
  })
  .meta({ id: 'AuthStatusResponseDto' });

export class LoginCredentialDto extends createZodDto(LoginCredentialSchema) {}
export class LoginResponseDto extends createZodDto(LoginResponseSchema) {}
export class LogoutResponseDto extends createZodDto(LogoutResponseSchema) {}
export class SignUpDto extends createZodDto(SignUpSchema) {}
export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}
export class PinCodeSetupDto extends createZodDto(PinCodeSetupSchema) {}
export class PinCodeResetDto extends createZodDto(PinCodeResetSchema) {}
export class SessionUnlockDto extends createZodDto(SessionUnlockSchema) {}
export class PinCodeChangeDto extends createZodDto(PinCodeChangeSchema) {}
export class ValidateAccessTokenResponseDto extends createZodDto(ValidateAccessTokenResponseSchema) {}
export class OAuthCallbackDto extends createZodDto(OAuthCallbackSchema) {}
export class OAuthConfigDto extends createZodDto(OAuthConfigSchema) {}
export class OAuthAuthorizeResponseDto extends createZodDto(OAuthAuthorizeResponseSchema) {}
export class AuthStatusResponseDto extends createZodDto(AuthStatusResponseSchema) {}
