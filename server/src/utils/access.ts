import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthSharedLink } from 'src/database.js';
import { AuthDto } from 'src/dtos/auth.dto.js';
import { PersonUserRole } from 'src/dtos/person.dto.js';
import { AlbumUserRole, Permission } from 'src/enum.js';
import { AccessRepository } from 'src/repositories/access.repository.js';
import { PersonId } from 'src/repositories/person.repository.js';

export type GrantedRequest = {
  requested: Permission[];
  current: Permission[];
};

export const isGranted = ({ requested, current }: GrantedRequest) => {
  if (current.includes(Permission.All)) {
    return true;
  }

  return new Set(current).isSupersetOf(new Set(requested));
};

export const areSetsEqual = <T>(setA: Set<T>, setB: Set<T>): boolean => {
  return setA.size === setB.size && setA.isSupersetOf(setB);
};

// object ids are compared by identity, so checks must return the request's own elements, not copies
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

export type AccessPersonRequest = {
  auth: AuthDto;
  permission: Permission;
  ids: Set<PersonId> | PersonId[];
};

type SharedLinkAccessRequest<T extends Permission = Permission> = T extends Permission
  ? { sharedLink: AuthSharedLink; permission: T; ids: Set<PermissionIdType<T>> }
  : never;
type OtherAccessRequest<T extends Permission = Permission> = T extends Permission
  ? { auth: AuthDto; permission: T; ids: Set<PermissionIdType<T>> }
  : never;

export const requireUploadAccess = (auth: AuthDto | null): AuthDto => {
  if (!auth || (auth.sharedLink && !auth.sharedLink.allowUpload)) {
    throw new UnauthorizedException();
  }
  return auth;
};

export const requireAccess = async <T extends Permission>(access: AccessRepository, request: AccessRequest<T>) => {
  const ids = Array.isArray(request.ids) ? new Set(request.ids) : request.ids;
  const allowedIds = await checkAccess(access, { auth: request.auth, permission: request.permission, ids });
  if (!areSetsEqual(ids, allowedIds)) {
    throw new BadRequestException(`Not found or no ${request.permission} access`);
  }
};

const PERSON_READ_ROLES = [PersonUserRole.Read, PersonUserRole.Write, PersonUserRole.Admin];
const PERSON_WRITE_ROLES = [PersonUserRole.Write, PersonUserRole.Admin];
const PERSON_ADMIN_ROLES = [PersonUserRole.Admin];

export const requirePersonAccess = async (access: AccessRepository, request: AccessPersonRequest) => {
  const ids = Array.isArray(request.ids) ? new Set(request.ids) : request.ids;
  const allowedIds = await checkPersonAccess(access, { auth: request.auth, permission: request.permission, ids });
  if (!areSetsEqual(ids, allowedIds)) {
    throw new BadRequestException(`Not found or no ${request.permission} access`);
  }
};

export const checkPersonAccess = async (
  access: AccessRepository,
  { ids, auth, permission }: AccessPersonRequest,
): Promise<Set<PersonId>> => {
  const idSet = Array.isArray(ids) ? new Set(ids) : ids;
  if (idSet.size === 0) {
    return new Set<PersonId>();
  }

  switch (permission) {
    case Permission.PersonRead: {
      return access.person.checkAccess(auth.user.id, idSet, PERSON_READ_ROLES);
    }

    case Permission.PersonUpdate: {
      return access.person.checkAccess(auth.user.id, idSet, PERSON_WRITE_ROLES);
    }

    case Permission.PersonDelete:
    case Permission.PersonMerge: {
      return access.person.checkAccess(auth.user.id, idSet, PERSON_ADMIN_ROLES);
    }

    default: {
      return new Set();
    }
  }
};

export const checkAccess = <T extends Permission>(
  access: AccessRepository,
  { ids, auth, permission }: AccessRequest<T>,
): Promise<Set<PermissionIdType<T>>> => {
  const idSet = Array.isArray(ids) ? new Set(ids) : ids;
  if (idSet.size === 0) {
    return Promise.resolve(new Set());
  }

  const allowed = auth.sharedLink
    ? checkSharedLinkAccess(access, { sharedLink: auth.sharedLink, permission, ids: idSet } as SharedLinkAccessRequest)
    : checkOtherAccess(access, { auth, permission, ids: idSet } as OtherAccessRequest);
  return allowed as Promise<Set<PermissionIdType<T>>>;
};

const checkSharedLinkAccess = async (
  access: AccessRepository,
  { sharedLink, permission, ids }: SharedLinkAccessRequest,
): Promise<Set<PermissionIdType<Permission>>> => {
  const sharedLinkId = sharedLink.id;

  switch (permission) {
    case Permission.AssetRead: {
      return access.asset.checkSharedLinkAccess(sharedLinkId, ids);
    }

    case Permission.AssetView: {
      return access.asset.checkSharedLinkAccess(sharedLinkId, ids);
    }

    case Permission.AssetDownload: {
      return sharedLink.allowDownload ? access.asset.checkSharedLinkAccess(sharedLinkId, ids) : new Set();
    }

    case Permission.AssetUpload: {
      return sharedLink.allowUpload ? ids : new Set();
    }

    case Permission.AlbumRead: {
      return access.album.checkSharedLinkAccess(sharedLinkId, ids);
    }

    case Permission.AlbumDownload: {
      return sharedLink.allowDownload ? access.album.checkSharedLinkAccess(sharedLinkId, ids) : new Set();
    }

    case Permission.AlbumAssetCreate: {
      return sharedLink.allowUpload ? access.album.checkSharedLinkAccess(sharedLinkId, ids) : new Set();
    }

    default: {
      return new Set();
    }
  }
};

const checkOtherAccess = async (
  access: AccessRepository,
  { auth, permission, ids }: OtherAccessRequest,
): Promise<Set<PermissionIdType<Permission>>> => {
  switch (permission) {
    // uses album id
    case Permission.ActivityCreate: {
      return access.activity.checkCreateAccess(auth.user.id, ids);
    }

    // uses activity id
    case Permission.ActivityDelete: {
      const isOwner = await access.activity.checkOwnerAccess(auth.user.id, ids);
      const isAlbumOwner = await access.activity.checkAlbumOwnerAccess(auth.user.id, ids.difference(isOwner));
      return isOwner.union(isAlbumOwner);
    }

    case Permission.AssetRead: {
      const isOwner = await access.asset.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission);
      const isAlbum = await access.asset.checkAlbumAccess(auth.user.id, ids.difference(isOwner));
      const isPartner = await access.asset.checkPartnerAccess(
        auth.user.id,
        ids.difference(isOwner).difference(isAlbum),
      );
      return isOwner.union(isAlbum).union(isPartner);
    }

    case Permission.AssetShare: {
      const isOwner = await access.asset.checkOwnerAccess(auth.user.id, ids, false);
      const isPartner = await access.asset.checkPartnerAccess(auth.user.id, ids.difference(isOwner));
      return isOwner.union(isPartner);
    }

    case Permission.AssetFileDownload: {
      return access.assetFile.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission);
    }

    case Permission.AssetView: {
      const isOwner = await access.asset.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission);
      const isAlbum = await access.asset.checkAlbumAccess(auth.user.id, ids.difference(isOwner));
      const isPartner = await access.asset.checkPartnerAccess(
        auth.user.id,
        ids.difference(isOwner).difference(isAlbum),
      );
      return isOwner.union(isAlbum).union(isPartner);
    }

    case Permission.AssetDownload: {
      const isOwner = await access.asset.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission);
      const isAlbum = await access.asset.checkAlbumAccess(auth.user.id, ids.difference(isOwner));
      const isPartner = await access.asset.checkPartnerAccess(
        auth.user.id,
        ids.difference(isOwner).difference(isAlbum),
      );
      return isOwner.union(isAlbum).union(isPartner);
    }

    case Permission.AssetUpdate: {
      return await access.asset.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission);
    }

    case Permission.AssetDelete: {
      return await access.asset.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission);
    }

    case Permission.AssetCopy: {
      return await access.asset.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission);
    }

    case Permission.AssetEditGet: {
      return await access.asset.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission);
    }

    case Permission.AssetEditCreate: {
      return await access.asset.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission);
    }

    case Permission.AssetEditDelete: {
      return await access.asset.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission);
    }

    case Permission.AssetFileRead:
    case Permission.AssetFileDelete: {
      return await access.assetFile.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission);
    }

    case Permission.AlbumRead: {
      const isOwner = await access.album.checkOwnerAccess(auth.user.id, ids);
      const isShared = await access.album.checkSharedAlbumAccess(
        auth.user.id,
        ids.difference(isOwner),
        AlbumUserRole.Viewer,
      );
      return isOwner.union(isShared);
    }

    case Permission.AlbumAssetCreate: {
      const isOwner = await access.album.checkOwnerAccess(auth.user.id, ids);
      const isShared = await access.album.checkSharedAlbumAccess(
        auth.user.id,
        ids.difference(isOwner),
        AlbumUserRole.Editor,
      );
      return isOwner.union(isShared);
    }

    case Permission.AlbumUpdate: {
      const isOwner = await access.album.checkOwnerAccess(auth.user.id, ids);
      const isShared = await access.album.checkSharedAlbumAccess(
        auth.user.id,
        ids.difference(isOwner),
        AlbumUserRole.Editor,
      );
      return isOwner.union(isShared);
    }

    case Permission.AlbumDelete: {
      return await access.album.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.AlbumShare: {
      const isOwner = await access.album.checkOwnerAccess(auth.user.id, ids);
      const isShared = await access.album.checkSharedAlbumAccess(
        auth.user.id,
        ids.difference(isOwner),
        AlbumUserRole.Editor,
      );
      return isOwner.union(isShared);
    }

    case Permission.AlbumDownload: {
      const isOwner = await access.album.checkOwnerAccess(auth.user.id, ids);
      const isShared = await access.album.checkSharedAlbumAccess(
        auth.user.id,
        ids.difference(isOwner),
        AlbumUserRole.Viewer,
      );
      return isOwner.union(isShared);
    }

    case Permission.AlbumAssetDelete: {
      const isOwner = await access.album.checkOwnerAccess(auth.user.id, ids);
      const isShared = await access.album.checkSharedAlbumAccess(
        auth.user.id,
        ids.difference(isOwner),
        AlbumUserRole.Editor,
      );
      return isOwner.union(isShared);
    }

    case Permission.AssetUpload: {
      return ids.has(auth.user.id) ? new Set([auth.user.id]) : new Set<string>();
    }

    case Permission.ArchiveRead: {
      return ids.has(auth.user.id) ? new Set([auth.user.id]) : new Set();
    }

    case Permission.DuplicateRead:
    case Permission.DuplicateDelete: {
      return access.duplicate.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.AuthDeviceDelete: {
      return await access.authDevice.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.FaceDelete: {
      return access.person.checkFaceOwnerAccess(auth.user.id, ids);
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
      return await access.tag.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.TimelineRead: {
      const isOwner = ids.has(auth.user.id) ? new Set([auth.user.id]) : new Set<string>();
      const isPartner = await access.timeline.checkPartnerAccess(auth.user.id, ids.difference(isOwner));
      return isOwner.union(isPartner);
    }

    case Permission.TimelineDownload: {
      return ids.has(auth.user.id) ? new Set([auth.user.id]) : new Set();
    }

    case Permission.MemoryRead: {
      return access.memory.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.MemoryUpdate: {
      return access.memory.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.MemoryDelete: {
      return access.memory.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.PersonCreate: {
      return access.person.checkFaceOwnerAccess(auth.user.id, ids);
    }

    case Permission.PersonReassign: {
      return access.person.checkFaceOwnerAccess(auth.user.id, ids);
    }

    case Permission.ClusterGroupRead: {
      const isMember = await access.clusterGroup.checkOwnerAccess(auth.user.id, ids);
      const isInvited = await access.clusterGroup.checkInviteAccess(auth.user.id, ids.difference(isMember));
      return isMember.union(isInvited);
    }

    case Permission.ClusterGroupLeave:
    case Permission.ClusterGroupRequestCreate: {
      return access.clusterGroup.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.ClusterGroupRequestDelete: {
      const isOwner = await access.clusterGroupRequest.checkOwnerAccess(auth.user.id, ids);
      const isGroupMember = await access.clusterGroupRequest.checkGroupAccess(auth.user.id, ids);
      return isOwner.union(isGroupMember);
    }

    case Permission.ClusterGroupRequestRead: {
      return access.clusterGroupRequest.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.PartnerUpdate: {
      return access.partner.checkUpdateAccess(auth.user.id, ids);
    }

    case Permission.SessionRead:
    case Permission.SessionUpdate:
    case Permission.SessionDelete:
    case Permission.SessionLock: {
      return access.session.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.StackRead: {
      return access.stack.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.StackUpdate: {
      return access.stack.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.StackDelete: {
      return access.stack.checkOwnerAccess(auth.user.id, ids);
    }

    case Permission.WorkflowRead:
    case Permission.WorkflowUpdate:
    case Permission.WorkflowDelete:
    case Permission.WorkflowLogs: {
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
