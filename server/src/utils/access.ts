import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthSharedLink } from 'src/database';
import { AuthDto } from 'src/dtos/auth.dto';
import { AlbumUserRole, Permission } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { setDifference, setIsEqual, setIsSuperset, setUnion } from 'src/utils/set';

export type GrantedRequest = {
  requested: Permission[];
  current: Permission[];
};

export const isGranted = ({ requested, current }: GrantedRequest) => {
  if (current.includes(Permission.All)) {
    return true;
  }

  return setIsSuperset(new Set(current), new Set(requested));
};

export type AccessRequest = {
  auth: AuthDto;
  permission: Permission;
  ids: Set<string> | string[];
};

type SharedLinkAccessRequest = {
  sharedLink: AuthSharedLink;
  hideNsfwAssets?: boolean;
  permission: Permission;
  ids: Set<string>;
};
type OtherAccessRequest = { auth: AuthDto; permission: Permission; ids: Set<string> };

const checkAssetOwnerAccess = (
  access: AccessRepository,
  auth: AuthDto,
  ids: Set<string>,
  hasElevatedPermission: boolean | undefined,
) =>
  auth.hideNsfwAssets
    ? access.asset.checkOwnerAccess(auth.user.id, ids, hasElevatedPermission, true)
    : access.asset.checkOwnerAccess(auth.user.id, ids, hasElevatedPermission);

const checkAssetAlbumAccess = (access: AccessRepository, auth: AuthDto, ids: Set<string>) =>
  auth.hideNsfwAssets
    ? access.asset.checkAlbumAccess(auth.user.id, ids, true)
    : access.asset.checkAlbumAccess(auth.user.id, ids);

const checkAssetPartnerAccess = (access: AccessRepository, auth: AuthDto, ids: Set<string>) =>
  auth.hideNsfwAssets
    ? access.asset.checkPartnerAccess(auth.user.id, ids, true)
    : access.asset.checkPartnerAccess(auth.user.id, ids);

const checkPersonOwnerAccess = (access: AccessRepository, auth: AuthDto, ids: Set<string>) =>
  auth.hideNsfwAssets
    ? access.person.checkOwnerAccess(auth.user.id, ids, true)
    : access.person.checkOwnerAccess(auth.user.id, ids);

const checkPersonFaceOwnerAccess = (access: AccessRepository, auth: AuthDto, ids: Set<string>) =>
  auth.hideNsfwAssets
    ? access.person.checkFaceOwnerAccess(auth.user.id, ids, true)
    : access.person.checkFaceOwnerAccess(auth.user.id, ids);

const checkActivityOwnerAccess = (access: AccessRepository, auth: AuthDto, ids: Set<string>) =>
  auth.hideNsfwAssets
    ? access.activity.checkOwnerAccess(auth.user.id, ids, true)
    : access.activity.checkOwnerAccess(auth.user.id, ids);

const checkActivityAlbumOwnerAccess = (access: AccessRepository, auth: AuthDto, ids: Set<string>) =>
  auth.hideNsfwAssets
    ? access.activity.checkAlbumOwnerAccess(auth.user.id, ids, true)
    : access.activity.checkAlbumOwnerAccess(auth.user.id, ids);

const checkDuplicateOwnerAccess = (access: AccessRepository, auth: AuthDto, ids: Set<string>) =>
  auth.hideNsfwAssets
    ? access.duplicate.checkOwnerAccess(auth.user.id, ids, true)
    : access.duplicate.checkOwnerAccess(auth.user.id, ids);

const checkMemoryOwnerAccess = (access: AccessRepository, auth: AuthDto, ids: Set<string>) =>
  auth.hideNsfwAssets
    ? access.memory.checkOwnerAccess(auth.user.id, ids, true)
    : access.memory.checkOwnerAccess(auth.user.id, ids);

const checkStackOwnerAccess = (access: AccessRepository, auth: AuthDto, ids: Set<string>) =>
  auth.hideNsfwAssets
    ? access.stack.checkOwnerAccess(auth.user.id, ids, true)
    : access.stack.checkOwnerAccess(auth.user.id, ids);

export const requireUploadAccess = (auth: AuthDto | null): AuthDto => {
  if (!auth || (auth.sharedLink && !auth.sharedLink.allowUpload)) {
    throw new UnauthorizedException();
  }
  return auth;
};

export const requireAccess = async (access: AccessRepository, request: AccessRequest) => {
  const allowedIds = await checkAccess(access, request);
  if (!setIsEqual(new Set(request.ids), allowedIds)) {
    throw new BadRequestException(`Not found or no ${request.permission} access`);
  }
};

export const checkAccess = async (
  access: AccessRepository,
  { ids, auth, permission }: AccessRequest,
): Promise<Set<string>> => {
  const idSet = Array.isArray(ids) ? new Set(ids) : ids;
  if (idSet.size === 0) {
    return new Set<string>();
  }

  return auth.sharedLink
    ? checkSharedLinkAccess(access, {
        sharedLink: auth.sharedLink,
        hideNsfwAssets: auth.hideNsfwAssets,
        permission,
        ids: idSet,
      })
    : checkOtherAccess(access, { auth, permission, ids: idSet });
};

const checkSharedLinkAccess = async (
  access: AccessRepository,
  request: SharedLinkAccessRequest,
): Promise<Set<string>> => {
  const { sharedLink, hideNsfwAssets, permission, ids } = request;
  const sharedLinkId = sharedLink.id;

  switch (permission) {
    case Permission.AssetRead: {
      return hideNsfwAssets
        ? await access.asset.checkSharedLinkAccess(sharedLinkId, ids, true)
        : await access.asset.checkSharedLinkAccess(sharedLinkId, ids);
    }

    case Permission.AssetView: {
      return hideNsfwAssets
        ? await access.asset.checkSharedLinkAccess(sharedLinkId, ids, true)
        : await access.asset.checkSharedLinkAccess(sharedLinkId, ids);
    }

    case Permission.AssetDownload: {
      if (!sharedLink.allowDownload) {
        return new Set();
      }
      return hideNsfwAssets
        ? await access.asset.checkSharedLinkAccess(sharedLinkId, ids, true)
        : await access.asset.checkSharedLinkAccess(sharedLinkId, ids);
    }

    case Permission.AssetUpload: {
      return sharedLink.allowUpload ? ids : new Set();
    }

    case Permission.AlbumRead: {
      return await access.album.checkSharedLinkAccess(sharedLinkId, ids);
    }

    case Permission.AlbumDownload: {
      return sharedLink.allowDownload ? await access.album.checkSharedLinkAccess(sharedLinkId, ids) : new Set();
    }

    case Permission.AlbumAssetCreate: {
      return sharedLink.allowUpload ? await access.album.checkSharedLinkAccess(sharedLinkId, ids) : new Set();
    }

    default: {
      return new Set<string>();
    }
  }
};

const checkOtherAccess = async (access: AccessRepository, request: OtherAccessRequest): Promise<Set<string>> => {
  const { auth, permission, ids } = request;

  switch (permission) {
    // uses album id
    case Permission.ActivityCreate: {
      return await access.activity.checkCreateAccess(auth.user.id, ids);
    }

    // uses activity id
    case Permission.ActivityDelete: {
      const isOwner = await checkActivityOwnerAccess(access, auth, ids);
      const isAlbumOwner = await checkActivityAlbumOwnerAccess(access, auth, setDifference(ids, isOwner));
      return setUnion(isOwner, isAlbumOwner);
    }

    case Permission.AssetRead: {
      const isOwner = await checkAssetOwnerAccess(access, auth, ids, auth.session?.hasElevatedPermission);
      const isAlbum = await checkAssetAlbumAccess(access, auth, setDifference(ids, isOwner));
      const isPartner = await checkAssetPartnerAccess(access, auth, setDifference(ids, isOwner, isAlbum));
      return setUnion(isOwner, isAlbum, isPartner);
    }

    case Permission.AssetShare: {
      const isOwner = await checkAssetOwnerAccess(access, auth, ids, false);
      const isPartner = await checkAssetPartnerAccess(access, auth, setDifference(ids, isOwner));
      return setUnion(isOwner, isPartner);
    }

    case Permission.AssetView: {
      const isOwner = await checkAssetOwnerAccess(access, auth, ids, auth.session?.hasElevatedPermission);
      const isAlbum = await checkAssetAlbumAccess(access, auth, setDifference(ids, isOwner));
      const isPartner = await checkAssetPartnerAccess(access, auth, setDifference(ids, isOwner, isAlbum));
      return setUnion(isOwner, isAlbum, isPartner);
    }

    case Permission.AssetDownload: {
      const isOwner = await checkAssetOwnerAccess(access, auth, ids, auth.session?.hasElevatedPermission);
      const isAlbum = await checkAssetAlbumAccess(access, auth, setDifference(ids, isOwner));
      const isPartner = await checkAssetPartnerAccess(access, auth, setDifference(ids, isOwner, isAlbum));
      return setUnion(isOwner, isAlbum, isPartner);
    }

    case Permission.AssetUpdate: {
      return await checkAssetOwnerAccess(access, auth, ids, auth.session?.hasElevatedPermission);
    }

    case Permission.AssetDelete: {
      return await checkAssetOwnerAccess(access, auth, ids, auth.session?.hasElevatedPermission);
    }

    case Permission.AssetCopy: {
      return await checkAssetOwnerAccess(access, auth, ids, auth.session?.hasElevatedPermission);
    }

    case Permission.AssetEditGet: {
      return await checkAssetOwnerAccess(access, auth, ids, auth.session?.hasElevatedPermission);
    }

    case Permission.AssetEditCreate: {
      return await checkAssetOwnerAccess(access, auth, ids, auth.session?.hasElevatedPermission);
    }

    case Permission.AssetEditDelete: {
      return await checkAssetOwnerAccess(access, auth, ids, auth.session?.hasElevatedPermission);
    }

    case Permission.AlbumRead: {
      const isOwner = await access.album.checkOwnerAccess(auth.user.id, ids);
      const isShared = await access.album.checkSharedAlbumAccess(
        auth.user.id,
        setDifference(ids, isOwner),
        AlbumUserRole.Viewer,
      );
      return setUnion(isOwner, isShared);
    }

    case Permission.AlbumAssetCreate: {
      const isOwner = await access.album.checkOwnerAccess(auth.user.id, ids);
      const isShared = await access.album.checkSharedAlbumAccess(
        auth.user.id,
        setDifference(ids, isOwner),
        AlbumUserRole.Editor,
      );
      return setUnion(isOwner, isShared);
    }

    case Permission.AlbumUpdate: {
      const isOwner = await access.album.checkOwnerAccess(auth.user.id, ids);
      const isShared = await access.album.checkSharedAlbumAccess(
        auth.user.id,
        setDifference(ids, isOwner),
        AlbumUserRole.Editor,
      );
      return setUnion(isOwner, isShared);
    }

    case Permission.AlbumDelete: {
      return await access.album.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.AlbumShare: {
      const isOwner = await access.album.checkOwnerAccess(auth.user.id, ids);
      const isShared = await access.album.checkSharedAlbumAccess(
        auth.user.id,
        setDifference(ids, isOwner),
        AlbumUserRole.Editor,
      );
      return setUnion(isOwner, isShared);
    }

    case Permission.AlbumDownload: {
      const isOwner = await access.album.checkOwnerAccess(auth.user.id, ids);
      const isShared = await access.album.checkSharedAlbumAccess(
        auth.user.id,
        setDifference(ids, isOwner),
        AlbumUserRole.Viewer,
      );
      return setUnion(isOwner, isShared);
    }

    case Permission.AlbumAssetDelete: {
      const isOwner = await access.album.checkOwnerAccess(auth.user.id, ids);
      const isShared = await access.album.checkSharedAlbumAccess(
        auth.user.id,
        setDifference(ids, isOwner),
        AlbumUserRole.Editor,
      );
      return setUnion(isOwner, isShared);
    }

    case Permission.AssetUpload: {
      return ids.has(auth.user.id) ? new Set([auth.user.id]) : new Set<string>();
    }

    case Permission.ArchiveRead: {
      return ids.has(auth.user.id) ? new Set([auth.user.id]) : new Set();
    }

    case Permission.DuplicateRead:
    case Permission.DuplicateDelete: {
      return checkDuplicateOwnerAccess(access, auth, ids);
    }

    case Permission.AuthDeviceDelete: {
      return await access.authDevice.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.FaceDelete: {
      return checkPersonFaceOwnerAccess(access, auth, ids);
    }

    case Permission.NotificationRead:
    case Permission.NotificationUpdate:
    case Permission.NotificationDelete: {
      return access.notification.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.TagAsset:
    case Permission.TagRead:
    case Permission.TagUpdate:
    case Permission.TagDelete: {
      return await access.tag.checkOwnerAccess(auth.user.id, ids, auth.hideNsfwAssets);
    }

    case Permission.TimelineRead: {
      const isOwner = ids.has(auth.user.id) ? new Set([auth.user.id]) : new Set<string>();
      const isPartner = await access.timeline.checkPartnerAccess(auth.user.id, setDifference(ids, isOwner));
      return setUnion(isOwner, isPartner);
    }

    case Permission.TimelineDownload: {
      return ids.has(auth.user.id) ? new Set([auth.user.id]) : new Set();
    }

    case Permission.MemoryRead: {
      return checkMemoryOwnerAccess(access, auth, ids);
    }

    case Permission.MemoryUpdate: {
      return checkMemoryOwnerAccess(access, auth, ids);
    }

    case Permission.MemoryDelete: {
      return checkMemoryOwnerAccess(access, auth, ids);
    }

    case Permission.PersonCreate: {
      return checkPersonFaceOwnerAccess(access, auth, ids);
    }

    case Permission.PersonRead:
    case Permission.PersonUpdate:
    case Permission.PersonDelete:
    case Permission.PersonMerge: {
      return await checkPersonOwnerAccess(access, auth, ids);
    }

    case Permission.PersonReassign: {
      return checkPersonFaceOwnerAccess(access, auth, ids);
    }

    case Permission.PartnerUpdate: {
      return await access.partner.checkUpdateAccess(auth.user.id, ids);
    }

    case Permission.SessionRead:
    case Permission.SessionUpdate:
    case Permission.SessionDelete:
    case Permission.SessionLock: {
      return access.session.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.StackRead: {
      return checkStackOwnerAccess(access, auth, ids);
    }

    case Permission.StackUpdate: {
      return checkStackOwnerAccess(access, auth, ids);
    }

    case Permission.StackDelete: {
      return checkStackOwnerAccess(access, auth, ids);
    }

    case Permission.WorkflowRead:
    case Permission.WorkflowUpdate:
    case Permission.WorkflowDelete: {
      return access.workflow.checkOwnerAccess(auth.user.id, ids);
    }

    default: {
      return new Set<string>();
    }
  }
};

export const requireElevatedPermission = (auth: AuthDto) => {
  if (!auth.session?.hasElevatedPermission) {
    throw new UnauthorizedException('Elevated permission is required');
  }
};
