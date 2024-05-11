import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { APIKeyEntity } from 'src/entities/api-key.entity';
import { SessionEntity } from 'src/entities/session.entity';
import { SharedLinkEntity } from 'src/entities/shared-link.entity';
import { UserEntity } from 'src/entities/user.entity';

export enum ImmichCookie {
  ACCESS_TOKEN = 'immich_access_token',
  AUTH_TYPE = 'immich_auth_type',
  IS_AUTHENTICATED = 'immich_is_authenticated',
  SHARED_LINK_TOKEN = 'immich_shared_link_token',
}

export enum ImmichHeader {
  API_KEY = 'x-api-key',
  USER_TOKEN = 'x-immich-user-token',
  SESSION_TOKEN = 'x-immich-session-token',
  SHARED_LINK_KEY = 'x-immich-share-key',
  CHECKSUM = 'x-immich-checksum',
}

export enum ImmichQuery {
  SHARED_LINK_KEY = 'key',
}

export type CookieResponse = {
  isSecure: boolean;
  values: Array<{ key: ImmichCookie; value: string }>;
};

export class AuthDto {
  user!: UserEntity;

  apiKey?: APIKeyEntity;
  sharedLink?: SharedLinkEntity;
  session?: SessionEntity;
}

export class LoginCredentialDto {
  @IsEmail({ require_tld: false })
  @Transform(({ value }) => value?.toLowerCase())
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

export function mapLoginResponse(entity: UserEntity, accessToken: string): LoginResponseDto {
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
}

export class OAuthConfigDto {
  @IsNotEmpty()
  @IsString()
  redirectUri!: string;
}

export class OAuthAuthorizeResponseDto {
  url!: string;
}
