import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { AuthApiKey, AuthSession, AuthUser, UserAdmin } from 'src/database';
import { ImmichCookie } from 'src/enum';
import { toEmail, ValidateBoolean } from 'src/validation';

export type CookieResponse = {
  isSecure: boolean;
  values: Array<{ key: ImmichCookie; value: string | null }>;
};

export class AuthDto {
  @ApiProperty({ description: 'Authenticated user' })
  user!: AuthUser;

  @ApiPropertyOptional({ description: 'API key (if authenticated via API key)' })
  apiKey?: AuthApiKey;

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
  @ApiProperty({ description: 'Is admin user' })
  isAdmin!: boolean;
  @ApiProperty({ description: 'Should change password' })
  shouldChangePassword!: boolean;
}

export function mapLoginResponse(entity: UserAdmin, accessToken: string): LoginResponseDto {
  return {
    accessToken,
    userId: entity.id,
    userEmail: entity.email,
    name: entity.name,
    isAdmin: entity.isAdmin,
    shouldChangePassword: entity.shouldChangePassword,
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

  @ValidateBoolean({ optional: true, default: false, description: 'Invalidate all other sessions' })
  invalidateSessions?: boolean;
}

export class ValidateAccessTokenResponseDto {
  @ApiProperty({ description: 'Authentication status' })
  authStatus!: boolean;
}
