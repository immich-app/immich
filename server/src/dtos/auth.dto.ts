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
  SHARED_LINK_TOKEN = 'x-immich-share-key',
}

export type CookieResponse = {
  isSecure: boolean;
  values: Array<{ key: ImmichCookie; value: string }>;
};

export enum PermissionPreset {
  USER = 'user',
  ADMIN = 'admin',
  CUSTOM = 'custom',
}

export enum Permission {
  ACTIVITY_CREATE = 'activity.create',
  ACTIVITY_READ = 'activity.read',
  ACTIVITY_UPDATE = 'activity.update',
  ACTIVITY_DELETE = 'activity.delete',

  ALBUM_CREATE = 'album.create',
  ALBUM_READ = 'album.read',
  ALBUM_UPDATE = 'album.update',
  ALBUM_DELETE = 'album.delete',

  ASSET_CREATE = 'asset.create',
  ASSET_READ = 'asset.read',
  ASSET_UPDATE = 'asset.update',
  ASSET_DELETE = 'asset.delete',

  API_KEY_CREATE = 'apiKey.create',
  API_KEY_READ = 'apiKey.read',
  API_KEY_UPDATE = 'apiKey.update',
  API_KEY_DELETE = 'apiKey.delete',

  AUTH_DEVICE_CREATE = 'authDevice.create',
  AUTH_DEVICE_READ = 'authDevice.read',
  AUTH_DEVICE_UPDATE = 'authDevice.update',
  AUTH_DEVICE_DELETE = 'authDevice.delete',

  FACE_CREATE = 'face.create',
  FACE_READ = 'face.read',
  FACE_UPDATE = 'face.update',
  FACE_DELETE = 'face.delete',

  LIBRARY_CREATE = 'library.create',
  LIBRARY_READ = 'library.read',
  LIBRARY_UPDATE = 'library.update',
  LIBRARY_DELETE = 'library.delete',

  MEMORY_CREATE = 'memory.create',
  MEMORY_READ = 'memory.read',
  MEMORY_UPDATE = 'memory.update',
  MEMORY_DELETE = 'memory.delete',
  MEMORY_ADD_ASSET = 'memory.addAsset',
  MEMORY_REMOVE_ASSET = 'memory.removeAsset',

  PARTNER_CREATE = 'partner.create',
  PARTNER_READ = 'partner.read',
  PARTNER_UPDATE = 'partner.update',
  PARTNER_DELETE = 'partner.delete',

  PERSON_CREATE = 'person.create',
  PERSON_READ = 'person.read',
  PERSON_UPDATE = 'person.update',
  PERSON_DELETE = 'person.delete',

  REPORT_CREATE = 'report.create',
  REPORT_READ = 'report.read',
  REPORT_UPDATE = 'report.update',
  REPORT_DELETE = 'report.delete',

  SESSION_CREATE = 'session.create',
  SESSION_READ = 'session.read',
  SESSION_UPDATE = 'session.update',
  SESSION_DELETE = 'session.delete',

  SHARED_LINK_CREATE = 'sharedLink.create',
  SHARED_LINK_READ = 'sharedLink.read',
  SHARED_LINK_UPDATE = 'sharedLink.update',
  SHARED_LINK_DELETE = 'sharedLink.delete',

  SYSTEM_CONFIG_CREATE = 'systemConfig.create',
  SYSTEM_CONFIG_READ = 'systemConfig.read',
  SYSTEM_CONFIG_UPDATE = 'systemConfig.update',
  SYSTEM_CONFIG_DELETE = 'systemConfig.delete',

  SYSTEM_METADATA_CREATE = 'systemMetadata.create',
  SYSTEM_METADATA_READ = 'systemMetadata.read',
  SYSTEM_METADATA_UPDATE = 'systemMetadata.update',
  SYSTEM_METADATA_DELETE = 'systemMetadata.delete',

  STACK_CREATE = 'stack.create',
  STACK_READ = 'stack.read',
  STACK_UPDATE = 'stack.update',
  STACK_DELETE = 'stack.delete',

  TAG_CREATE = 'tag.create',
  TAG_READ = 'tag.read',
  TAG_UPDATE = 'tag.update',
  TAG_DELETE = 'tag.delete',

  USER_CREATE = 'user.create',
  USER_READ = 'user.read',
  USER_UPDATE = 'user.update',
  USER_DELETE = 'user.delete',

  // other
  AUTH_CHANGE_PASSWORD = 'auth.changePassword',
  AUTH_OAUTH = 'auth.oauth',

  ALBUM_ADD_ASSET = 'album.addAsset',
  ALBUM_REMOVE_ASSET = 'album.removeAsset',
  ALBUM_ADD_USER = 'album.addUser',
  ALBUM_REMOVE_USER = 'album.removeUser',

  ASSET_VIEW_THUMB = 'asset.viewThumb',
  ASSET_VIEW_PREVIEW = 'asset.viewPreview',
  ASSET_VIEW_ORIGINAL = 'asset.viewOriginal',
  ASSET_UPLOAD = 'asset.upload',
  ASSET_DOWNLOAD = 'asset.download',

  JOB_READ = 'job.read',
  JOB_RUN = 'job.run',

  MAP_READ = 'map.read',

  USER_READ_SIMPLE = 'user.readSimple',
  USER_CHANGE_PASSWORD = 'user.changePassword',

  SERVER_READ = 'server.read',
  SERVER_SETUP = 'server.setup',
}

export const presetToPermissions = ({
  permissionPreset: preset,
  permissions,
}: {
  permissionPreset?: PermissionPreset;
  permissions?: Permission[];
}) => {
  switch (preset) {
    case PermissionPreset.ADMIN: {
      return ALL_PERMISSIONS;
    }

    case PermissionPreset.USER: {
      return USER_PERMISSIONS;
    }

    case PermissionPreset.CUSTOM: {
      return permissions ?? [];
    }

    default: {
      return;
    }
  }
};

export const ALL_PERMISSIONS = Object.values(Permission);
export const USER_PERMISSIONS = ALL_PERMISSIONS.filter((permission) => {
  switch (permission) {
    case Permission.JOB_READ:
    case Permission.JOB_RUN:

    case Permission.LIBRARY_READ:
    case Permission.LIBRARY_CREATE:
    case Permission.LIBRARY_UPDATE:
    case Permission.LIBRARY_DELETE:

    // TODO this can't be an admin permission yet because non-admins still use it
    case Permission.USER_READ:
    case Permission.USER_CREATE:
    case Permission.USER_UPDATE:
    case Permission.USER_DELETE:

    case Permission.SYSTEM_CONFIG_CREATE:
    case Permission.SYSTEM_CONFIG_READ:
    case Permission.SYSTEM_CONFIG_UPDATE:
    case Permission.SYSTEM_CONFIG_DELETE:

    case Permission.SYSTEM_METADATA_CREATE:
    case Permission.SYSTEM_METADATA_READ:
    case Permission.SYSTEM_METADATA_UPDATE:
    case Permission.SYSTEM_METADATA_DELETE: {
      return false;
    }

    default: {
      return true;
    }
  }
});

export type AuthorizationPermissions = Set<Permission>;

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
