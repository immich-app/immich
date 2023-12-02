import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthUserDto } from '../auth';
import { setDifference, setIsEqual, setUnion } from '../domain.util';
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
  PERSON_CREATE = 'person.create',
  PERSON_REASSIGN = 'person.reassign',

  PARTNER_UPDATE = 'partner.update',
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

  /**
   * Check if user has access to all ids, for the given permission.
   * Throws error if user does not have access to any of the ids.
   */
  async requirePermission(authUser: AuthUserDto, permission: Permission, ids: string[] | string) {
    ids = Array.isArray(ids) ? ids : [ids];
    const allowedIds = await this.checkAccess(authUser, permission, ids);
    if (!setIsEqual(new Set(ids), allowedIds)) {
      throw new BadRequestException(`Not found or no ${permission} access`);
    }
  }

  /**
   * Return ids that user has access to, for the given permission.
   * Check is done for each id, and only allowed ids are returned.
   *
   * @returns Set<string>
   */
  async checkAccess(authUser: AuthUserDto, permission: Permission, ids: Set<string> | string[]) {
    const idSet = Array.isArray(ids) ? new Set(ids) : ids;
    if (idSet.size === 0) {
      return new Set();
    }

    const isSharedLink = authUser.isPublicUser ?? false;
    return isSharedLink
      ? await this.checkAccessSharedLink(authUser, permission, idSet)
      : await this.checkAccessOther(authUser, permission, idSet);
  }

  private async checkAccessSharedLink(authUser: AuthUserDto, permission: Permission, ids: Set<string>) {
    const sharedLinkId = authUser.sharedLinkId;
    if (!sharedLinkId) {
      return new Set();
    }

    switch (permission) {
      case Permission.ASSET_READ:
        return await this.repository.asset.checkSharedLinkAccess(sharedLinkId, ids);

      case Permission.ASSET_VIEW:
        return await this.repository.asset.checkSharedLinkAccess(sharedLinkId, ids);

      case Permission.ASSET_DOWNLOAD:
        return !!authUser.isAllowDownload
          ? await this.repository.asset.checkSharedLinkAccess(sharedLinkId, ids)
          : new Set();

      case Permission.ASSET_UPLOAD:
        return authUser.isAllowUpload ? ids : new Set();

      case Permission.ASSET_SHARE:
        // TODO: fix this to not use authUser.id for shared link access control
        return await this.repository.asset.checkOwnerAccess(authUser.id, ids);

      case Permission.ALBUM_READ:
        return await this.repository.album.checkSharedLinkAccess(sharedLinkId, ids);

      case Permission.ALBUM_DOWNLOAD:
        return !!authUser.isAllowDownload
          ? await this.repository.album.checkSharedLinkAccess(sharedLinkId, ids)
          : new Set();

      default:
        return new Set();
    }
  }

  private async checkAccessOther(authUser: AuthUserDto, permission: Permission, ids: Set<string>) {
    switch (permission) {
      case Permission.ASSET_READ: {
        const isOwner = await this.repository.asset.checkOwnerAccess(authUser.id, ids);
        const isAlbum = await this.repository.asset.checkAlbumAccess(authUser.id, setDifference(ids, isOwner));
        const isPartner = await this.repository.asset.checkPartnerAccess(
          authUser.id,
          setDifference(ids, isOwner, isAlbum),
        );
        return setUnion(isOwner, isAlbum, isPartner);
      }

      case Permission.ASSET_SHARE: {
        const isOwner = await this.repository.asset.checkOwnerAccess(authUser.id, ids);
        const isPartner = await this.repository.asset.checkPartnerAccess(authUser.id, setDifference(ids, isOwner));
        return setUnion(isOwner, isPartner);
      }

      case Permission.ASSET_VIEW: {
        const isOwner = await this.repository.asset.checkOwnerAccess(authUser.id, ids);
        const isAlbum = await this.repository.asset.checkAlbumAccess(authUser.id, setDifference(ids, isOwner));
        const isPartner = await this.repository.asset.checkPartnerAccess(
          authUser.id,
          setDifference(ids, isOwner, isAlbum),
        );
        return setUnion(isOwner, isAlbum, isPartner);
      }

      case Permission.ASSET_DOWNLOAD: {
        const isOwner = await this.repository.asset.checkOwnerAccess(authUser.id, ids);
        const isAlbum = await this.repository.asset.checkAlbumAccess(authUser.id, setDifference(ids, isOwner));
        const isPartner = await this.repository.asset.checkPartnerAccess(
          authUser.id,
          setDifference(ids, isOwner, isAlbum),
        );
        return setUnion(isOwner, isAlbum, isPartner);
      }

      case Permission.ASSET_UPDATE:
        return await this.repository.asset.checkOwnerAccess(authUser.id, ids);

      case Permission.ASSET_DELETE:
        return await this.repository.asset.checkOwnerAccess(authUser.id, ids);

      case Permission.ASSET_RESTORE:
        return await this.repository.asset.checkOwnerAccess(authUser.id, ids);

      case Permission.ALBUM_READ: {
        const isOwner = await this.repository.album.checkOwnerAccess(authUser.id, ids);
        const isShared = await this.repository.album.checkSharedAlbumAccess(authUser.id, setDifference(ids, isOwner));
        return setUnion(isOwner, isShared);
      }

      case Permission.ALBUM_UPDATE:
        return await this.repository.album.checkOwnerAccess(authUser.id, ids);

      case Permission.ALBUM_DELETE:
        return await this.repository.album.checkOwnerAccess(authUser.id, ids);

      case Permission.ALBUM_SHARE:
        return await this.repository.album.checkOwnerAccess(authUser.id, ids);

      case Permission.ALBUM_DOWNLOAD: {
        const isOwner = await this.repository.album.checkOwnerAccess(authUser.id, ids);
        const isShared = await this.repository.album.checkSharedAlbumAccess(authUser.id, setDifference(ids, isOwner));
        return setUnion(isOwner, isShared);
      }

      case Permission.ALBUM_REMOVE_ASSET:
        return await this.repository.album.checkOwnerAccess(authUser.id, ids);

      case Permission.ASSET_UPLOAD:
        return await this.repository.library.checkOwnerAccess(authUser.id, ids);

      case Permission.ARCHIVE_READ:
        return ids.has(authUser.id) ? new Set([authUser.id]) : new Set();

      case Permission.AUTH_DEVICE_DELETE:
        return await this.repository.authDevice.checkOwnerAccess(authUser.id, ids);

      case Permission.TIMELINE_READ: {
        const isOwner = ids.has(authUser.id) ? new Set([authUser.id]) : new Set<string>();
        const isPartner = await this.repository.timeline.checkPartnerAccess(authUser.id, setDifference(ids, isOwner));
        return setUnion(isOwner, isPartner);
      }

      case Permission.TIMELINE_DOWNLOAD:
        return ids.has(authUser.id) ? new Set([authUser.id]) : new Set();

      case Permission.LIBRARY_READ: {
        const isOwner = await this.repository.library.checkOwnerAccess(authUser.id, ids);
        const isPartner = await this.repository.library.checkPartnerAccess(authUser.id, setDifference(ids, isOwner));
        return setUnion(isOwner, isPartner);
      }

      case Permission.LIBRARY_UPDATE:
        return await this.repository.library.checkOwnerAccess(authUser.id, ids);

      case Permission.LIBRARY_DELETE:
        return await this.repository.library.checkOwnerAccess(authUser.id, ids);

      case Permission.PERSON_READ:
        return await this.repository.person.checkOwnerAccess(authUser.id, ids);

      case Permission.PERSON_WRITE:
        return await this.repository.person.checkOwnerAccess(authUser.id, ids);

      case Permission.PERSON_MERGE:
        return await this.repository.person.checkOwnerAccess(authUser.id, ids);

      case Permission.PERSON_CREATE:
        return this.repository.person.hasFaceOwnerAccess(authUser.id, ids);

      case Permission.PERSON_REASSIGN:
        return this.repository.person.hasFaceOwnerAccess(authUser.id, ids);

      case Permission.PARTNER_UPDATE:
        return await this.repository.partner.checkUpdateAccess(authUser.id, ids);
    }

    const allowedIds = new Set();
    for (const id of ids) {
      const hasAccess = await this.hasOtherAccess(authUser, permission, id);
      if (hasAccess) {
        allowedIds.add(id);
      }
    }
    return allowedIds;
  }

  // TODO: Migrate logic to checkAccessOther to evaluate permissions in bulk.
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

      default:
        return false;
    }
  }
}
