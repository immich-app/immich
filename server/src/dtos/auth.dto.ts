import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { AuthApiKey, AuthSession, AuthSharedLink, AuthUser, UserAdmin } from 'src/database';
import { ImmichCookie } from 'src/enum';
import { Optional, toEmail } from 'src/validation';

export type CookieResponse = {
  isSecure: boolean;
  values: Array<{ key: ImmichCookie; value: string | null }>;
};

export class AuthDto {
  user!: AuthUser;

  apiKey?: AuthApiKey;
  sharedLink?: AuthSharedLink;
  session?: AuthSession;
}

export class LoginCredentialDto {
  @IsEmail({ require_tld: false })
  @Transform(toEmail)
  @IsNotEmpty()
  @ApiProperty({ example: 'testuser@email.com' })
  email!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'password' })
  password!: string;
}

export class LoginResponseDto {
  accessToken!: string;
  userId!: string;
  userEmail!: string;
  name!: string;
  profileImagePath!: string;
  isAdmin!: boolean;
  shouldChangePassword!: boolean;
}

export function mapLoginResponse(entity: UserAdmin, accessToken: string): LoginResponseDto {
  return {
    accessToken,
    userId: entity.id,
    userEmail: entity.email,
    name: entity.name,
    isAdmin: entity.isAdmin,
    profileImagePath: entity.profileImagePath,
    shouldChangePassword: entity.shouldChangePassword,
  };
}

export class LogoutResponseDto {
  successful!: boolean;
  redirectUri!: string;
}

export class SignUpDto extends LoginCredentialDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Admin' })
  name!: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'password' })
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @ApiProperty({ example: 'password' })
  newPassword!: string;
}

export class ValidateAccessTokenResponseDto {
  authStatus!: boolean;
}

export class OAuthCallbackDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  url!: string;

  @Optional()
  @IsString()
  state?: string;

  @Optional()
  @IsString()
  codeVerifier?: string;
}

export class OAuthConfigDto {
  @IsNotEmpty()
  @IsString()
  redirectUri!: string;

  @Optional()
  @IsString()
  state?: string;

  @Optional()
  @IsString()
  codeChallenge?: string;
}

export class OAuthAuthorizeResponseDto {
  url!: string;
}
