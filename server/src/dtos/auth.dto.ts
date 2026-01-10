import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { AuthApiKey, AuthSession, AuthSharedLink, AuthUser, UserAdmin } from 'src/database';
import { ImmichCookie, UserMetadataKey } from 'src/enum';
import { UserMetadataItem } from 'src/types';
import { Optional, PinCode, toEmail, ValidateBoolean } from 'src/validation';

export type CookieResponse = {
  isSecure: boolean;
  values: Array<{ key: ImmichCookie; value: string | null }>;
};

export class AuthDto {
  @ApiProperty({ description: 'Authenticated user' })
  user!: AuthUser;

  @ApiPropertyOptional({ description: 'API key (if authenticated via API key)' })
  apiKey?: AuthApiKey;
  @ApiPropertyOptional({ description: 'Shared link (if authenticated via shared link)' })
  sharedLink?: AuthSharedLink;
  @ApiPropertyOptional({ description: 'Session (if authenticated via session)' })
  session?: AuthSession;
}

export class LoginCredentialDto {
  @ApiProperty({ example: 'testuser@email.com', description: 'User email' })
  @IsEmail({ require_tld: false })
  @Transform(toEmail)
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'password', description: 'User password' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'Access token' })
  accessToken!: string;
  @ApiProperty({ description: 'User ID' })
  userId!: string;
  @ApiProperty({ description: 'User email' })
  userEmail!: string;
  @ApiProperty({ description: 'User name' })
  name!: string;
  @ApiProperty({ description: 'Profile image path' })
  profileImagePath!: string;
  @ApiProperty({ description: 'Is admin user' })
  isAdmin!: boolean;
  @ApiProperty({ description: 'Should change password' })
  shouldChangePassword!: boolean;
  @ApiProperty({ description: 'Is onboarded' })
  isOnboarded!: boolean;
}

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

export class LogoutResponseDto {
  @ApiProperty({ description: 'Logout successful' })
  successful!: boolean;
  @ApiProperty({ description: 'Redirect URI' })
  redirectUri!: string;
}

export class SignUpDto extends LoginCredentialDto {
  @ApiProperty({ example: 'Admin', description: 'User name' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'password', description: 'Current password' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ example: 'password', description: 'New password (min 8 characters)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword!: string;

  @ApiPropertyOptional({ description: 'Invalidate all other sessions', default: false })
  @ValidateBoolean({ optional: true, default: false })
  invalidateSessions?: boolean;
}

export class PinCodeSetupDto {
  @ApiProperty({ description: 'PIN code (4-6 digits)' })
  @PinCode()
  pinCode!: string;
}

export class PinCodeResetDto {
  @ApiPropertyOptional({ description: 'New PIN code (4-6 digits)' })
  @PinCode({ optional: true })
  pinCode?: string;

  @ApiPropertyOptional({ description: 'User password (required if PIN code is not provided)' })
  @Optional()
  @IsString()
  @IsNotEmpty()
  password?: string;
}

export class SessionUnlockDto extends PinCodeResetDto {}

export class PinCodeChangeDto extends PinCodeResetDto {
  @ApiProperty({ description: 'New PIN code (4-6 digits)' })
  @PinCode()
  newPinCode!: string;
}

export class ValidateAccessTokenResponseDto {
  @ApiProperty({ description: 'Authentication status' })
  authStatus!: boolean;
}

export class OAuthCallbackDto {
  @ApiProperty({ description: 'OAuth callback URL' })
  @IsNotEmpty()
  @IsString()
  url!: string;

  @ApiPropertyOptional({ description: 'OAuth state parameter' })
  @Optional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'OAuth code verifier (PKCE)' })
  @Optional()
  @IsString()
  codeVerifier?: string;
}

export class OAuthConfigDto {
  @ApiProperty({ description: 'OAuth redirect URI' })
  @IsNotEmpty()
  @IsString()
  redirectUri!: string;

  @ApiPropertyOptional({ description: 'OAuth state parameter' })
  @Optional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'OAuth code challenge (PKCE)' })
  @Optional()
  @IsString()
  codeChallenge?: string;
}

export class OAuthAuthorizeResponseDto {
  @ApiProperty({ description: 'OAuth authorization URL' })
  url!: string;
}

export class AuthStatusResponseDto {
  @ApiProperty({ description: 'Has PIN code set' })
  pinCode!: boolean;
  @ApiProperty({ description: 'Has password set' })
  password!: boolean;
  @ApiProperty({ description: 'Is elevated session' })
  isElevated!: boolean;
  @ApiPropertyOptional({ description: 'Session expiration date' })
  expiresAt?: string;
  @ApiPropertyOptional({ description: 'PIN expiration date' })
  pinExpiresAt?: string;
}
