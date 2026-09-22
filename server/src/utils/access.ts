import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthSharedLink } from 'src/database.js';
import { AuthDto } from 'src/dtos/auth.dto.js';
import { AlbumUserRole, Permission } from 'src/enum.js';
import { AccessRepository } from 'src/repositories/access.repository.js';
import { areSetsEqual, isSetSuperset, setDifference, setUnion } from 'src/utils/set.js';

export type GrantedRequest = {
  requested: Permission[];
  current: Permission[];
};

export const isGranted = ({ requested, current }: GrantedRequest) => {
  if (current.includes(Permission.All)) {
    return true;
  }

  return isSetSuperset(new Set(current), new Set(requested));
};

type PermissionIdOverrides = {
  // TODO remove once first real override exists
  [Permission.AssetRead]: string;
};

type PermissionIdType<T extends Permission> = T extends keyof PermissionIdOverrides ? PermissionIdOverrides[T] : string;

export type AccessRequest<T extends Permission> = {
  auth: AuthDto;
  permission: T;
  ids: Set<PermissionIdType<T>> | PermissionIdType<T>[];
};

type SharedLinkAccessRequest<T extends Permission> = {
  sharedLink: AuthSharedLink;
  permission: T;
  ids: Set<PermissionIdType<T>>;
};
type OtherAccessRequest<T extends Permission> = { auth: AuthDto; permission: T; ids: Set<PermissionIdType<T>> };

export const requireUploadAccess = (auth: AuthDto | null): AuthDto => {
  if (!auth || (auth.sharedLink && !auth.sharedLink.allowUpload)) {
    throw new UnauthorizedException();
  }
  return auth;
};

export const requireAccess = async <T extends Permission>(access: AccessRepository, request: AccessRequest<T>) => {
  const allowedIds = await checkAccess(access, request);
  if (!areSetsEqual(new Set(request.ids), allowedIds)) {
    throw new BadRequestException(`Not found or no ${request.permission} access`);
  }
};

export const checkAccess = async <T extends Permission>(
  access: AccessRepository,
  { ids, auth, permission }: AccessRequest<T>,
): Promise<Set<PermissionIdType<T>>> => {
  const idSet = Array.isArray(ids) ? new Set(ids) : ids;
  if (idSet.size === 0) {
    return new Set();
  }

  return auth.sharedLink
    ? (checkSharedLinkAccess(access, { sharedLink: auth.sharedLink, permission, ids: idSet }) as Promise<
        Set<PermissionIdType<T>>
      >)
    : (checkOtherAccess(access, { auth, permission, ids: idSet }) as Promise<Set<PermissionIdType<T>>>);
};

const checkSharedLinkAccess = async <T extends Permission>(
  access: AccessRepository,
  request: SharedLinkAccessRequest<T>,
): Promise<Set<PermissionIdType<Permission>>> => {
  const { sharedLink } = request;
  const sharedLinkId = sharedLink.id;
  const permission = request.permission as Permission;

  // As long as typescript does not support a OneOf kind of type, we cannot properly narrow down the type here
  // as T could be something like `Permission.AssetRead | Permission.AssetView`, in which case `ids` can still be for `AssetView`,
  // even though the switch is in the`AssetRead` branch.
  // https://github.com/microsoft/TypeScript/issues/27808
  const typeSafeRequest = <T extends Permission>(request: SharedLinkAccessRequest<Permission>) =>
    request as SharedLinkAccessRequest<T>;

  switch (permission) {
    case Permission.AssetRead: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return access.asset.checkSharedLinkAccess(sharedLinkId, ids);
    }

    case Permission.AssetView: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return access.asset.checkSharedLinkAccess(sharedLinkId, ids);
    }

    case Permission.AssetDownload: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return sharedLink.allowDownload ? access.asset.checkSharedLinkAccess(sharedLinkId, ids) : new Set();
    }

    case Permission.AssetUpload: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return sharedLink.allowUpload ? ids : new Set();
    }

    case Permission.AlbumRead: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return access.album.checkSharedLinkAccess(sharedLinkId, ids);
    }

    case Permission.AlbumDownload: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return sharedLink.allowDownload ? access.album.checkSharedLinkAccess(sharedLinkId, ids) : new Set();
    }

    case Permission.AlbumAssetCreate: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return sharedLink.allowUpload ? access.album.checkSharedLinkAccess(sharedLinkId, ids) : new Set();
    }

    default: {
      return new Set();
    }
  }
};

const checkOtherAccess = async <T extends Permission>(
  access: AccessRepository,
  request: OtherAccessRequest<T>,
): Promise<Set<PermissionIdType<Permission>>> => {
  const { auth } = request;
  const permission = request.permission as Permission;

  // As long as typescript does not support a OneOf kind of type, we cannot properly narrow down the type here
  // as T could be something like `Permission.AssetRead | Permission.AssetView`, in which case `ids` can still be for `AssetView`,
  // even though the switch is in the`AssetRead` branch.
  // https://github.com/microsoft/TypeScript/issues/27808
  const typeSafeRequest = <T extends Permission>(request: OtherAccessRequest<Permission>) =>
    request as OtherAccessRequest<T>;

  switch (permission) {
    // uses album id
    case Permission.ActivityCreate: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return access.activity.checkCreateAccess(auth.user.id, ids);
    }

    // uses activity id
    case Permission.ActivityDelete: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      const isOwner = await access.activity.checkOwnerAccess(auth.user.id, ids);
      const isAlbumOwner = await access.activity.checkAlbumOwnerAccess(auth.user.id, setDifference(ids, isOwner));
      return setUnion(isOwner, isAlbumOwner);
    }

    case Permission.AssetRead: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      const isOwner = await access.asset.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission);
      const isAlbum = await access.asset.checkAlbumAccess(auth.user.id, setDifference(ids, isOwner));
      const isPartner = await access.asset.checkPartnerAccess(auth.user.id, setDifference(ids, isOwner, isAlbum));
      return setUnion(isOwner, isAlbum, isPartner);
    }

    case Permission.AssetShare: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      const isOwner = await access.asset.checkOwnerAccess(auth.user.id, ids, false);
      const isPartner = await access.asset.checkPartnerAccess(auth.user.id, setDifference(ids, isOwner));
      return setUnion(isOwner, isPartner);
    }

    case Permission.AssetFileDownload: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return access.assetFile.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission);
    }

    case Permission.AssetView: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      const isOwner = await access.asset.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission);
      const isAlbum = await access.asset.checkAlbumAccess(auth.user.id, setDifference(ids, isOwner));
      const isPartner = await access.asset.checkPartnerAccess(auth.user.id, setDifference(ids, isOwner, isAlbum));
      return setUnion(isOwner, isAlbum, isPartner);
    }

    case Permission.AssetDownload: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      const isOwner = await access.asset.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission);
      const isAlbum = await access.asset.checkAlbumAccess(auth.user.id, setDifference(ids, isOwner));
      const isPartner = await access.asset.checkPartnerAccess(auth.user.id, setDifference(ids, isOwner, isAlbum));
      return setUnion(isOwner, isAlbum, isPartner);
    }

    case Permission.AssetUpdate: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return await access.asset.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission);
    }

    case Permission.AssetDelete: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return await access.asset.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission);
    }

    case Permission.AssetCopy: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return await access.asset.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission);
    }

    case Permission.AssetEditGet: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return await access.asset.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission);
    }

    case Permission.AssetEditCreate: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return await access.asset.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission);
    }

    case Permission.AssetEditDelete: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return await access.asset.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission);
    }

    case Permission.AssetFileRead:
    case Permission.AssetFileDelete: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return await access.assetFile.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission);
    }

    case Permission.AlbumRead: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      const isOwner = await access.album.checkOwnerAccess(auth.user.id, ids);
      const isShared = await access.album.checkSharedAlbumAccess(
        auth.user.id,
        setDifference(ids, isOwner),
        AlbumUserRole.Viewer,
      );
      return setUnion(isOwner, isShared);
    }

    case Permission.AlbumAssetCreate: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      const isOwner = await access.album.checkOwnerAccess(auth.user.id, ids);
      const isShared = await access.album.checkSharedAlbumAccess(
        auth.user.id,
        setDifference(ids, isOwner),
        AlbumUserRole.Editor,
      );
      return setUnion(isOwner, isShared);
    }

    case Permission.AlbumUpdate: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      const isOwner = await access.album.checkOwnerAccess(auth.user.id, ids);
      const isShared = await access.album.checkSharedAlbumAccess(
        auth.user.id,
        setDifference(ids, isOwner),
        AlbumUserRole.Editor,
      );
      return setUnion(isOwner, isShared);
    }

    case Permission.AlbumDelete: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return await access.album.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.AlbumShare: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      const isOwner = await access.album.checkOwnerAccess(auth.user.id, ids);
      const isShared = await access.album.checkSharedAlbumAccess(
        auth.user.id,
        setDifference(ids, isOwner),
        AlbumUserRole.Editor,
      );
      return setUnion(isOwner, isShared);
    }

    case Permission.AlbumDownload: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      const isOwner = await access.album.checkOwnerAccess(auth.user.id, ids);
      const isShared = await access.album.checkSharedAlbumAccess(
        auth.user.id,
        setDifference(ids, isOwner),
        AlbumUserRole.Viewer,
      );
      return setUnion(isOwner, isShared);
    }

    case Permission.AlbumAssetDelete: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      const isOwner = await access.album.checkOwnerAccess(auth.user.id, ids);
      const isShared = await access.album.checkSharedAlbumAccess(
        auth.user.id,
        setDifference(ids, isOwner),
        AlbumUserRole.Editor,
      );
      return setUnion(isOwner, isShared);
    }

    case Permission.AssetUpload: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return ids.has(auth.user.id) ? new Set([auth.user.id]) : new Set<string>();
    }

    case Permission.ArchiveRead: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return ids.has(auth.user.id) ? new Set([auth.user.id]) : new Set();
    }

    case Permission.DuplicateRead:
    case Permission.DuplicateDelete: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return access.duplicate.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.AuthDeviceDelete: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return await access.authDevice.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.FaceDelete: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return access.person.checkFaceOwnerAccess(auth.user.id, ids);
    }

    case Permission.NotificationRead:
    case Permission.NotificationUpdate:
    case Permission.NotificationDelete: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return access.notification.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.TagAsset:
    case Permission.TagRead:
    case Permission.TagUpdate:
    case Permission.TagDelete: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return await access.tag.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.TimelineRead: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      const isOwner = ids.has(auth.user.id) ? new Set([auth.user.id]) : new Set<string>();
      const isPartner = await access.timeline.checkPartnerAccess(auth.user.id, setDifference(ids, isOwner));
      return setUnion(isOwner, isPartner);
    }

    case Permission.TimelineDownload: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return ids.has(auth.user.id) ? new Set([auth.user.id]) : new Set();
    }

    case Permission.MemoryRead: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return access.memory.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.MemoryUpdate: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return access.memory.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.MemoryDelete: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return access.memory.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.PersonCreate: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return access.person.checkFaceOwnerAccess(auth.user.id, ids);
    }

    case Permission.PersonRead:
    case Permission.PersonUpdate:
    case Permission.PersonDelete:
    case Permission.PersonMerge: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return await access.person.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.PersonReassign: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return access.person.checkFaceOwnerAccess(auth.user.id, ids);
    }

    case Permission.ClusterGroupRead: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      const isMember = await access.clusterGroup.checkOwnerAccess(auth.user.id, ids);
      const isInvited = await access.clusterGroup.checkInviteAccess(auth.user.id, setDifference(ids, isMember));
      return setUnion(isMember, isInvited);
    }

    case Permission.ClusterGroupLeave:
    case Permission.ClusterGroupRequestCreate: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return access.clusterGroup.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.ClusterGroupRequestDelete: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      const isOwner = await access.clusterGroupRequest.checkOwnerAccess(auth.user.id, ids);
      const isGroupMember = await access.clusterGroupRequest.checkGroupAccess(auth.user.id, ids);
      return setUnion(isOwner, isGroupMember);
    }

    case Permission.ClusterGroupRequestRead: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return access.clusterGroupRequest.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.PartnerUpdate: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return access.partner.checkUpdateAccess(auth.user.id, ids);
    }

    case Permission.SessionRead:
    case Permission.SessionUpdate:
    case Permission.SessionDelete:
    case Permission.SessionLock: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return access.session.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.StackRead: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return access.stack.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.StackUpdate: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return access.stack.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.StackDelete: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return access.stack.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.WorkflowRead:
    case Permission.WorkflowUpdate:
    case Permission.WorkflowDelete:
    case Permission.WorkflowLogs: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return access.workflow.checkOwnerAccess(auth.user.id, ids);
    }

    default: {
      return new Set();
    }
  }
};

export const requireElevatedPermission = (auth: AuthDto) => {
  if (!auth.session?.hasElevatedPermission) {
    throw new UnauthorizedException('Elevated permission is required');
  }
};
