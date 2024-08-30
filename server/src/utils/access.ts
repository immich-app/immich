import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthDto } from 'src/dtos/auth.dto';
import { SharedLinkEntity } from 'src/entities/shared-link.entity';
import { AlbumUserRole, Permission } from 'src/enum';
import { IAccessRepository } from 'src/interfaces/access.interface';
import { setDifference, setIsEqual, setIsSuperset, setUnion } from 'src/utils/set';

export type GrantedRequest = {
  requested: Permission[];
  current: Permission[];
};

export const isGranted = ({ requested, current }: GrantedRequest) => {
  if (current.includes(Permission.ALL)) {
    return true;
  }

  return setIsSuperset(new Set(current), new Set(requested));
};

export type AccessRequest = {
  auth: AuthDto;
  permission: Permission;
  ids: Set<string> | string[];
};

type SharedLinkAccessRequest = { sharedLink: SharedLinkEntity; permission: Permission; ids: Set<string> };
type OtherAccessRequest = { auth: AuthDto; permission: Permission; ids: Set<string> };

export const requireUploadAccess = (auth: AuthDto | null): AuthDto => {
  if (!auth || (auth.sharedLink && !auth.sharedLink.allowUpload)) {
    throw new UnauthorizedException();
  }
  return auth;
};

export const requireAccess = async (access: IAccessRepository, request: AccessRequest) => {
  const allowedIds = await checkAccess(access, request);
  if (!setIsEqual(new Set(request.ids), allowedIds)) {
    throw new BadRequestException(`Not found or no ${request.permission} access`);
  }
};

export const checkAccess = async (
  access: IAccessRepository,
  { ids, auth, permission }: AccessRequest,
): Promise<Set<string>> => {
  const idSet = Array.isArray(ids) ? new Set(ids) : ids;
  if (idSet.size === 0) {
    return new Set<string>();
  }

  return auth.sharedLink
    ? checkSharedLinkAccess(access, { sharedLink: auth.sharedLink, permission, ids: idSet })
    : checkOtherAccess(access, { auth, permission, ids: idSet });
};

const checkSharedLinkAccess = async (
  access: IAccessRepository,
  request: SharedLinkAccessRequest,
): Promise<Set<string>> => {
  const { sharedLink, permission, ids } = request;
  const sharedLinkId = sharedLink.id;

  switch (permission) {
    case Permission.ASSET_READ: {
      return await access.asset.checkSharedLinkAccess(sharedLinkId, ids);
    }

    case Permission.ASSET_VIEW: {
      return await access.asset.checkSharedLinkAccess(sharedLinkId, ids);
    }

    case Permission.ASSET_DOWNLOAD: {
      return sharedLink.allowDownload ? await access.asset.checkSharedLinkAccess(sharedLinkId, ids) : new Set();
    }

    case Permission.ASSET_UPLOAD: {
      return sharedLink.allowUpload ? ids : new Set();
    }

    case Permission.ASSET_SHARE: {
      // TODO: fix this to not use sharedLink.userId for access control
      return await access.asset.checkOwnerAccess(sharedLink.userId, ids);
    }

    case Permission.ALBUM_READ: {
      return await access.album.checkSharedLinkAccess(sharedLinkId, ids);
    }

    case Permission.ALBUM_DOWNLOAD: {
      return sharedLink.allowDownload ? await access.album.checkSharedLinkAccess(sharedLinkId, ids) : new Set();
    }

    case Permission.ALBUM_ADD_ASSET: {
      return sharedLink.allowUpload ? await access.album.checkSharedLinkAccess(sharedLinkId, ids) : new Set();
    }

    default: {
      return new Set<string>();
    }
  }
};

const checkOtherAccess = async (access: IAccessRepository, request: OtherAccessRequest): Promise<Set<string>> => {
  const { auth, permission, ids } = request;

  switch (permission) {
    // uses album id
    case Permission.ACTIVITY_CREATE: {
      return await access.activity.checkCreateAccess(auth.user.id, ids);
    }

    // uses activity id
    case Permission.ACTIVITY_DELETE: {
      const isOwner = await access.activity.checkOwnerAccess(auth.user.id, ids);
      const isAlbumOwner = await access.activity.checkAlbumOwnerAccess(auth.user.id, setDifference(ids, isOwner));
      return setUnion(isOwner, isAlbumOwner);
    }

    case Permission.ASSET_READ: {
      const isOwner = await access.asset.checkOwnerAccess(auth.user.id, ids);
      const isAlbum = await access.asset.checkAlbumAccess(auth.user.id, setDifference(ids, isOwner));
      const isPartner = await access.asset.checkPartnerAccess(auth.user.id, setDifference(ids, isOwner, isAlbum));
      return setUnion(isOwner, isAlbum, isPartner);
    }

    case Permission.ASSET_SHARE: {
      const isOwner = await access.asset.checkOwnerAccess(auth.user.id, ids);
      const isPartner = await access.asset.checkPartnerAccess(auth.user.id, setDifference(ids, isOwner));
      return setUnion(isOwner, isPartner);
    }

    case Permission.ASSET_VIEW: {
      const isOwner = await access.asset.checkOwnerAccess(auth.user.id, ids);
      const isAlbum = await access.asset.checkAlbumAccess(auth.user.id, setDifference(ids, isOwner));
      const isPartner = await access.asset.checkPartnerAccess(auth.user.id, setDifference(ids, isOwner, isAlbum));
      return setUnion(isOwner, isAlbum, isPartner);
    }

    case Permission.ASSET_DOWNLOAD: {
      const isOwner = await access.asset.checkOwnerAccess(auth.user.id, ids);
      const isAlbum = await access.asset.checkAlbumAccess(auth.user.id, setDifference(ids, isOwner));
      const isPartner = await access.asset.checkPartnerAccess(auth.user.id, setDifference(ids, isOwner, isAlbum));
      return setUnion(isOwner, isAlbum, isPartner);
    }

    case Permission.ASSET_UPDATE: {
      return await access.asset.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.ASSET_DELETE: {
      return await access.asset.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.ALBUM_READ: {
      const isOwner = await access.album.checkOwnerAccess(auth.user.id, ids);
      const isShared = await access.album.checkSharedAlbumAccess(
        auth.user.id,
        setDifference(ids, isOwner),
        AlbumUserRole.VIEWER,
      );
      return setUnion(isOwner, isShared);
    }

    case Permission.ALBUM_ADD_ASSET: {
      const isOwner = await access.album.checkOwnerAccess(auth.user.id, ids);
      const isShared = await access.album.checkSharedAlbumAccess(
        auth.user.id,
        setDifference(ids, isOwner),
        AlbumUserRole.EDITOR,
      );
      return setUnion(isOwner, isShared);
    }

    case Permission.ALBUM_UPDATE: {
      return await access.album.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.ALBUM_DELETE: {
      return await access.album.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.ALBUM_SHARE: {
      return await access.album.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.ALBUM_DOWNLOAD: {
      const isOwner = await access.album.checkOwnerAccess(auth.user.id, ids);
      const isShared = await access.album.checkSharedAlbumAccess(
        auth.user.id,
        setDifference(ids, isOwner),
        AlbumUserRole.VIEWER,
      );
      return setUnion(isOwner, isShared);
    }

    case Permission.ALBUM_REMOVE_ASSET: {
      const isOwner = await access.album.checkOwnerAccess(auth.user.id, ids);
      const isShared = await access.album.checkSharedAlbumAccess(
        auth.user.id,
        setDifference(ids, isOwner),
        AlbumUserRole.EDITOR,
      );
      return setUnion(isOwner, isShared);
    }

    case Permission.ASSET_UPLOAD: {
      return ids.has(auth.user.id) ? new Set([auth.user.id]) : new Set<string>();
    }

    case Permission.ARCHIVE_READ: {
      return ids.has(auth.user.id) ? new Set([auth.user.id]) : new Set();
    }

    case Permission.AUTH_DEVICE_DELETE: {
      return await access.authDevice.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.TAG_ASSET:
    case Permission.TAG_READ:
    case Permission.TAG_UPDATE:
    case Permission.TAG_DELETE: {
      return await access.tag.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.TIMELINE_READ: {
      const isOwner = ids.has(auth.user.id) ? new Set([auth.user.id]) : new Set<string>();
      const isPartner = await access.timeline.checkPartnerAccess(auth.user.id, setDifference(ids, isOwner));
      return setUnion(isOwner, isPartner);
    }

    case Permission.TIMELINE_DOWNLOAD: {
      return ids.has(auth.user.id) ? new Set([auth.user.id]) : new Set();
    }

    case Permission.MEMORY_READ: {
      return access.memory.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.MEMORY_UPDATE: {
      return access.memory.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.MEMORY_DELETE: {
      return access.memory.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.MEMORY_DELETE: {
      return access.memory.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.PERSON_READ: {
      return await access.person.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.PERSON_UPDATE: {
      return await access.person.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.PERSON_MERGE: {
      return await access.person.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.PERSON_CREATE: {
      return access.person.checkFaceOwnerAccess(auth.user.id, ids);
    }

    case Permission.PERSON_REASSIGN: {
      return access.person.checkFaceOwnerAccess(auth.user.id, ids);
    }

    case Permission.PARTNER_UPDATE: {
      return await access.partner.checkUpdateAccess(auth.user.id, ids);
    }

    case Permission.STACK_READ: {
      return access.stack.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.STACK_UPDATE: {
      return access.stack.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.STACK_DELETE: {
      return access.stack.checkOwnerAccess(auth.user.id, ids);
    }

    default: {
      return new Set<string>();
    }
  }
};
