import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthSharedLink } from 'src/database';
import { AuthDto } from 'src/dtos/auth.dto';
import { AccessHint, AlbumUserRole, Permission } from 'src/enum';
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
  hint?: AccessHint;
};

type SharedLinkAccessRequest = { sharedLink: AuthSharedLink; permission: Permission; ids: Set<string> };
type OtherAccessRequest = { auth: AuthDto; permission: Permission; ids: Set<string>; hint?: AccessHint };

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
  { ids, auth, permission, hint }: AccessRequest,
): Promise<Set<string>> => {
  const idSet = Array.isArray(ids) ? new Set(ids) : ids;
  if (idSet.size === 0) {
    return new Set<string>();
  }

  return auth.sharedLink
    ? checkSharedLinkAccess(access, { sharedLink: auth.sharedLink, permission, ids: idSet })
    : checkOtherAccess(access, { auth, permission, ids: idSet, hint });
};

const checkSharedLinkAccess = async (
  access: AccessRepository,
  request: SharedLinkAccessRequest,
): Promise<Set<string>> => {
  const { sharedLink, permission, ids } = request;
  const sharedLinkId = sharedLink.id;

  switch (permission) {
    case Permission.AssetRead: {
      return await access.asset.checkSharedLinkAccess(sharedLinkId, ids);
    }

    case Permission.AssetView: {
      return await access.asset.checkSharedLinkAccess(sharedLinkId, ids);
    }

    case Permission.AssetDownload: {
      return sharedLink.allowDownload ? await access.asset.checkSharedLinkAccess(sharedLinkId, ids) : new Set();
    }

    case Permission.AssetUpload: {
      return sharedLink.allowUpload ? ids : new Set();
    }

    case Permission.AssetShare: {
      // TODO: fix this to not use sharedLink.userId for access control
      return await access.asset.checkOwnerAccess(sharedLink.userId, ids, false);
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

const safeMoveToFront = <T>(array: T[], index: number) => {
  if (index <= 0 || index >= array.length) {
    return;
  }

  const [item] = array.splice(index, 1);
  array.unshift(item);
};

type CheckFn = (ids: Set<string>) => Promise<Set<string>>;
const checkAll = async (ids: Set<string>, checks: Partial<Record<AccessHint, CheckFn>>, hint?: AccessHint) => {
  let grantedIds = new Set<string>();

  const items = Object.values(checks);
  if (hint && checks[hint]) {
    safeMoveToFront(items, items.indexOf(checks[hint]));
  }

  for (const check of items) {
    if (ids.size === 0) {
      break;
    }
    const approvedIds = await check(ids);
    grantedIds = setUnion(grantedIds, approvedIds);
    ids = setDifference(ids, approvedIds);
  }

  return grantedIds;
};

const checkOtherAccess = async (access: AccessRepository, request: OtherAccessRequest): Promise<Set<string>> => {
  const { auth, permission, ids, hint } = request;

  switch (permission) {
    // uses album id
    case Permission.ActivityCreate: {
      return await access.activity.checkCreateAccess(auth.user.id, ids);
    }

    // uses activity id
    case Permission.ActivityDelete: {
      return checkAll(
        ids,
        {
          [AccessHint.Owner]: (ids) => access.activity.checkOwnerAccess(auth.user.id, ids),
          [AccessHint.Album]: (ids) => access.activity.checkAlbumOwnerAccess(auth.user.id, ids),
        },
        hint,
      );
    }

    case Permission.AssetRead: {
      return checkAll(
        ids,
        {
          [AccessHint.Owner]: (ids) =>
            access.asset.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission),
          [AccessHint.Album]: (ids) => access.asset.checkAlbumAccess(auth.user.id, ids),
          [AccessHint.Partner]: (ids) => access.asset.checkPartnerAccess(auth.user.id, ids),
        },
        hint,
      );
    }

    case Permission.AssetShare: {
      return checkAll(ids, {
        [AccessHint.Owner]: (ids) => access.asset.checkOwnerAccess(auth.user.id, ids, false),
        [AccessHint.Partner]: (ids) => access.asset.checkPartnerAccess(auth.user.id, ids),
      });
    }

    case Permission.AssetView: {
      return checkAll(ids, {
        [AccessHint.Owner]: (ids) =>
          access.asset.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission),
        [AccessHint.Album]: (ids) => access.asset.checkAlbumAccess(auth.user.id, ids),
        [AccessHint.Partner]: (ids) => access.asset.checkPartnerAccess(auth.user.id, ids),
      });
    }

    case Permission.AssetDownload: {
      return checkAll(ids, {
        [AccessHint.Owner]: (ids) =>
          access.asset.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission),
        [AccessHint.Album]: (ids) => access.asset.checkAlbumAccess(auth.user.id, ids),
        [AccessHint.Partner]: (ids) => access.asset.checkPartnerAccess(auth.user.id, ids),
      });
    }

    case Permission.AssetUpdate: {
      return checkAll(ids, {
        [AccessHint.Owner]: (ids) =>
          access.asset.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission),
      });
    }

    case Permission.AssetDelete: {
      return checkAll(ids, {
        [AccessHint.Owner]: (ids) =>
          access.asset.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission),
      });
    }

    case Permission.AlbumRead: {
      return checkAll(
        ids,
        {
          [AccessHint.Owner]: (ids) => access.album.checkOwnerAccess(auth.user.id, ids),
          [AccessHint.Album]: (ids) => access.album.checkSharedAlbumAccess(auth.user.id, ids, AlbumUserRole.Viewer),
        },
        hint,
      );
    }

    case Permission.AlbumAssetCreate: {
      return checkAll(ids, {
        [AccessHint.Owner]: (ids) => access.album.checkOwnerAccess(auth.user.id, ids),
        [AccessHint.Album]: (ids) => access.album.checkSharedAlbumAccess(auth.user.id, ids, AlbumUserRole.Editor),
      });
    }

    case Permission.AlbumShare:
    case Permission.AlbumUpdate:
    case Permission.AlbumDelete: {
      return checkAll(
        ids,
        {
          [AccessHint.Owner]: (ids) => access.album.checkOwnerAccess(auth.user.id, ids),
        },
        hint,
      );
    }

    case Permission.AlbumDownload: {
      return checkAll(
        ids,
        {
          [AccessHint.Owner]: (ids) => access.album.checkOwnerAccess(auth.user.id, ids),
          [AccessHint.Album]: (ids) => access.album.checkSharedAlbumAccess(auth.user.id, ids, AlbumUserRole.Viewer),
        },
        hint,
      );
    }

    case Permission.AlbumAssetDelete: {
      return checkAll(
        ids,
        {
          [AccessHint.Owner]: (ids) => access.album.checkOwnerAccess(auth.user.id, ids),
          [AccessHint.Album]: (ids) => access.album.checkSharedAlbumAccess(auth.user.id, ids, AlbumUserRole.Editor),
        },
        hint,
      );
    }

    case Permission.AssetUpload: {
      return ids.has(auth.user.id) ? new Set([auth.user.id]) : new Set<string>();
    }

    case Permission.ArchiveRead: {
      return ids.has(auth.user.id) ? new Set([auth.user.id]) : new Set();
    }

    case Permission.AuthDeviceDelete: {
      return checkAll(
        ids,
        {
          [AccessHint.Owner]: (ids) => access.authDevice.checkOwnerAccess(auth.user.id, ids),
        },
        hint,
      );
    }

    case Permission.FaceDelete: {
      return checkAll(ids, {
        [AccessHint.Owner]: (ids) => access.person.checkFaceOwnerAccess(auth.user.id, ids),
      });
    }

    case Permission.NotificationRead:
    case Permission.NotificationUpdate:
    case Permission.NotificationDelete: {
      return checkAll(ids, {
        [AccessHint.Owner]: (ids) => access.notification.checkOwnerAccess(auth.user.id, ids),
      });
    }

    case Permission.TagAsset:
    case Permission.TagRead:
    case Permission.TagUpdate:
    case Permission.TagDelete: {
      return checkAll(ids, {
        [AccessHint.Owner]: (ids) => access.tag.checkOwnerAccess(auth.user.id, ids),
      });
    }

    case Permission.TimelineRead: {
      const isOwner = ids.has(auth.user.id) ? new Set([auth.user.id]) : new Set<string>();
      const isPartner = await access.timeline.checkPartnerAccess(auth.user.id, setDifference(ids, isOwner));
      return setUnion(isOwner, isPartner);
    }

    case Permission.TimelineDownload: {
      return ids.has(auth.user.id) ? new Set([auth.user.id]) : new Set();
    }

    case Permission.MemoryRead:
    case Permission.MemoryUpdate:
    case Permission.MemoryDelete: {
      return checkAll(ids, {
        [AccessHint.Owner]: (ids) => access.memory.checkOwnerAccess(auth.user.id, ids),
      });
    }

    case Permission.PersonCreate: {
      return checkAll(ids, {
        [AccessHint.Owner]: (ids) => access.person.checkFaceOwnerAccess(auth.user.id, ids),
      });
    }

    case Permission.PersonRead:
    case Permission.PersonUpdate:
    case Permission.PersonDelete:
    case Permission.PersonMerge: {
      return checkAll(ids, {
        [AccessHint.Owner]: (ids) => access.person.checkOwnerAccess(auth.user.id, ids),
      });
    }

    case Permission.PersonReassign: {
      return checkAll(ids, {
        [AccessHint.Owner]: (ids) => access.person.checkFaceOwnerAccess(auth.user.id, ids),
      });
    }

    case Permission.PartnerUpdate: {
      return checkAll(ids, {
        [AccessHint.Owner]: (ids) => access.partner.checkUpdateAccess(auth.user.id, ids),
      });
    }

    case Permission.SessionRead:
    case Permission.SessionUpdate:
    case Permission.SessionDelete:
    case Permission.SessionLock: {
      return checkAll(ids, {
        [AccessHint.Owner]: (ids) => access.session.checkOwnerAccess(auth.user.id, ids),
      });
    }

    case Permission.StackRead:
    case Permission.StackUpdate:
    case Permission.StackDelete: {
      return checkAll(ids, {
        [AccessHint.Owner]: (ids) => access.stack.checkOwnerAccess(auth.user.id, ids),
      });
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
