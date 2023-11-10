import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthUserDto } from '../auth';
import { IAccessRepository } from '../repositories';

export enum Permission {
  ACTIVITY_CREATE = 'activity.create',
  ACTIVITY_DELETE = 'activity.delete',

  // ASSET_CREATE = 'asset.create',
  ASSET_READ = 'asset.read',
  ASSET_UPDATE = 'asset.update',
  ASSET_DELETE = 'asset.delete',
  ASSET_RESTORE = 'asset.restore',
  ASSET_SHARE = 'asset.share',
  ASSET_VIEW = 'asset.view',
  ASSET_DOWNLOAD = 'asset.download',
  ASSET_UPLOAD = 'asset.upload',

  // ALBUM_CREATE = 'album.create',
  ALBUM_READ = 'album.read',
  ALBUM_UPDATE = 'album.update',
  ALBUM_DELETE = 'album.delete',
  ALBUM_REMOVE_ASSET = 'album.removeAsset',
  ALBUM_SHARE = 'album.share',
  ALBUM_DOWNLOAD = 'album.download',

  AUTH_DEVICE_DELETE = 'authDevice.delete',

  ARCHIVE_READ = 'archive.read',

  TIMELINE_READ = 'timeline.read',
  TIMELINE_DOWNLOAD = 'timeline.download',

  LIBRARY_CREATE = 'library.create',
  LIBRARY_READ = 'library.read',
  LIBRARY_UPDATE = 'library.update',
  LIBRARY_DELETE = 'library.delete',
  LIBRARY_DOWNLOAD = 'library.download',

  PERSON_READ = 'person.read',
  PERSON_WRITE = 'person.write',
  PERSON_MERGE = 'person.merge',
}

let instance: AccessCore | null;

export class AccessCore {
  private constructor(private repository: IAccessRepository) {}

  static create(repository: IAccessRepository) {
    if (!instance) {
      instance = new AccessCore(repository);
    }

    return instance;
  }

  static reset() {
    instance = null;
  }

  requireUploadAccess(authUser: AuthUserDto | null): AuthUserDto {
    if (!authUser || (authUser.isPublicUser && !authUser.isAllowUpload)) {
      throw new UnauthorizedException();
    }
    return authUser;
  }

  async requirePermission(authUser: AuthUserDto, permission: Permission, ids: string[] | string) {
    const hasAccess = await this.hasPermission(authUser, permission, ids);
    if (!hasAccess) {
      throw new BadRequestException(`Not found or no ${permission} access`);
    }
  }

  async hasAny(authUser: AuthUserDto, permissions: Array<{ permission: Permission; id: string }>) {
    for (const { permission, id } of permissions) {
      const hasAccess = await this.hasPermission(authUser, permission, id);
      if (hasAccess) {
        return true;
      }
    }
    return false;
  }

  async hasPermission(authUser: AuthUserDto, permission: Permission, ids: string[] | string) {
    ids = Array.isArray(ids) ? ids : [ids];

    const isSharedLink = authUser.isPublicUser ?? false;

    for (const id of ids) {
      const hasAccess = isSharedLink
        ? await this.hasSharedLinkAccess(authUser, permission, id)
        : await this.hasOtherAccess(authUser, permission, id);
      if (!hasAccess) {
        return false;
      }
    }

    return true;
  }

  private async hasSharedLinkAccess(authUser: AuthUserDto, permission: Permission, id: string) {
    const sharedLinkId = authUser.sharedLinkId;
    if (!sharedLinkId) {
      return false;
    }

    switch (permission) {
      case Permission.ASSET_READ:
        return this.repository.asset.hasSharedLinkAccess(sharedLinkId, id);

      case Permission.ASSET_VIEW:
        return await this.repository.asset.hasSharedLinkAccess(sharedLinkId, id);

      case Permission.ASSET_DOWNLOAD:
        return !!authUser.isAllowDownload && (await this.repository.asset.hasSharedLinkAccess(sharedLinkId, id));

      case Permission.ASSET_UPLOAD:
        return authUser.isAllowUpload;

      case Permission.ASSET_SHARE:
        // TODO: fix this to not use authUser.id for shared link access control
        return this.repository.asset.hasOwnerAccess(authUser.id, id);

      case Permission.ALBUM_READ:
        return this.repository.album.hasSharedLinkAccess(sharedLinkId, id);

      case Permission.ALBUM_DOWNLOAD:
        return !!authUser.isAllowDownload && (await this.repository.album.hasSharedLinkAccess(sharedLinkId, id));

      default:
        return false;
    }
  }

  private async hasOtherAccess(authUser: AuthUserDto, permission: Permission, id: string) {
    switch (permission) {
      // uses album id
      case Permission.ACTIVITY_CREATE:
        return await this.repository.activity.hasCreateAccess(authUser.id, id);

      // uses activity id
      case Permission.ACTIVITY_DELETE:
        return (
          (await this.repository.activity.hasOwnerAccess(authUser.id, id)) ||
          (await this.repository.activity.hasAlbumOwnerAccess(authUser.id, id))
        );

      case Permission.ASSET_READ:
        return (
          (await this.repository.asset.hasOwnerAccess(authUser.id, id)) ||
          (await this.repository.asset.hasAlbumAccess(authUser.id, id)) ||
          (await this.repository.asset.hasPartnerAccess(authUser.id, id))
        );
      case Permission.ASSET_UPDATE:
        return this.repository.asset.hasOwnerAccess(authUser.id, id);

      case Permission.ASSET_DELETE:
        return this.repository.asset.hasOwnerAccess(authUser.id, id);

      case Permission.ASSET_RESTORE:
        return this.repository.asset.hasOwnerAccess(authUser.id, id);

      case Permission.ASSET_SHARE:
        return (
          (await this.repository.asset.hasOwnerAccess(authUser.id, id)) ||
          (await this.repository.asset.hasPartnerAccess(authUser.id, id))
        );

      case Permission.ASSET_VIEW:
        return (
          (await this.repository.asset.hasOwnerAccess(authUser.id, id)) ||
          (await this.repository.asset.hasAlbumAccess(authUser.id, id)) ||
          (await this.repository.asset.hasPartnerAccess(authUser.id, id))
        );

      case Permission.ASSET_DOWNLOAD:
        return (
          (await this.repository.asset.hasOwnerAccess(authUser.id, id)) ||
          (await this.repository.asset.hasAlbumAccess(authUser.id, id)) ||
          (await this.repository.asset.hasPartnerAccess(authUser.id, id))
        );

      case Permission.ALBUM_READ:
        return (
          (await this.repository.album.hasOwnerAccess(authUser.id, id)) ||
          (await this.repository.album.hasSharedAlbumAccess(authUser.id, id))
        );

      case Permission.ALBUM_UPDATE:
        return this.repository.album.hasOwnerAccess(authUser.id, id);

      case Permission.ALBUM_DELETE:
        return this.repository.album.hasOwnerAccess(authUser.id, id);

      case Permission.ALBUM_SHARE:
        return this.repository.album.hasOwnerAccess(authUser.id, id);

      case Permission.ALBUM_DOWNLOAD:
        return (
          (await this.repository.album.hasOwnerAccess(authUser.id, id)) ||
          (await this.repository.album.hasSharedAlbumAccess(authUser.id, id))
        );

      case Permission.ASSET_UPLOAD:
        return this.repository.library.hasOwnerAccess(authUser.id, id);

      case Permission.ALBUM_REMOVE_ASSET:
        return this.repository.album.hasOwnerAccess(authUser.id, id);

      case Permission.ARCHIVE_READ:
        return authUser.id === id;

      case Permission.AUTH_DEVICE_DELETE:
        return this.repository.authDevice.hasOwnerAccess(authUser.id, id);

      case Permission.TIMELINE_READ:
        return authUser.id === id || (await this.repository.timeline.hasPartnerAccess(authUser.id, id));

      case Permission.TIMELINE_DOWNLOAD:
        return authUser.id === id;

      case Permission.LIBRARY_READ:
        return (
          (await this.repository.library.hasOwnerAccess(authUser.id, id)) ||
          (await this.repository.library.hasPartnerAccess(authUser.id, id))
        );

      case Permission.LIBRARY_UPDATE:
        return this.repository.library.hasOwnerAccess(authUser.id, id);

      case Permission.LIBRARY_DELETE:
        return this.repository.library.hasOwnerAccess(authUser.id, id);

      case Permission.PERSON_READ:
        return this.repository.person.hasOwnerAccess(authUser.id, id);

      case Permission.PERSON_WRITE:
        return this.repository.person.hasOwnerAccess(authUser.id, id);

      case Permission.PERSON_MERGE:
        return this.repository.person.hasOwnerAccess(authUser.id, id);

      default:
        return false;
    }
  }
}
