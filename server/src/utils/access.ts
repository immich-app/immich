import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import stableJsonStringify from 'json-stable-stringify';
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

const isSetSuperset = <T>(set: Set<T>, subset: Set<T>): boolean => {
  if (!set.values().some((value) => typeof value === 'object')) {
    return set.isSupersetOf(subset);
  }

  const map = new Map(set.values().map((value) => [stableJsonStringify(value) as string, value]));

  for (const element of subset) {
    if (!map.has(stableJsonStringify(element) as string)) {
      return false;
    }
  }

  return true;
};

export const areSetsEqual = <T>(setA: Set<T>, setB: Set<T>): boolean => {
  return setA.size === setB.size && isSetSuperset(setA, setB);
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

export type AccessPersonRequest = {
  auth: AuthDto;
  permission: Permission;
  ids: Set<PersonId> | PersonId[];
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

const PERSON_READ_ROLES = [PersonUserRole.Read, PersonUserRole.Write, PersonUserRole.Admin];
const PERSON_WRITE_ROLES = [PersonUserRole.Write, PersonUserRole.Admin];
const PERSON_ADMIN_ROLES = [PersonUserRole.Admin];

const asStringSet = (source: Set<PersonId>): Set<string> =>
  new Set(source.values().map((item) => `${item.personGroupId}/$${item.ownerId}`));

export const requirePersonAccess = async (access: AccessRepository, request: AccessPersonRequest) => {
  const allowedIds = await checkPersonAccess(access, request);
  if (!areSetsEqual(asStringSet(new Set(request.ids)), asStringSet(allowedIds))) {
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
      const isAlbumOwner = await access.activity.checkAlbumOwnerAccess(auth.user.id, ids.difference(isOwner));
      return isOwner.union(isAlbumOwner);
    }

    case Permission.AssetRead: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      const isOwner = await access.asset.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission);
      const isAlbum = await access.asset.checkAlbumAccess(auth.user.id, ids.difference(isOwner));
      const isPartner = await access.asset.checkPartnerAccess(
        auth.user.id,
        ids.difference(isOwner).difference(isAlbum),
      );
      return isOwner.union(isAlbum).union(isPartner);
    }

    case Permission.AssetShare: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      const isOwner = await access.asset.checkOwnerAccess(auth.user.id, ids, false);
      const isPartner = await access.asset.checkPartnerAccess(auth.user.id, ids.difference(isOwner));
      return isOwner.union(isPartner);
    }

    case Permission.AssetFileDownload: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return access.assetFile.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission);
    }

    case Permission.AssetView: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      const isOwner = await access.asset.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission);
      const isAlbum = await access.asset.checkAlbumAccess(auth.user.id, ids.difference(isOwner));
      const isPartner = await access.asset.checkPartnerAccess(
        auth.user.id,
        ids.difference(isOwner).difference(isAlbum),
      );
      return isOwner.union(isAlbum).union(isPartner);
    }

    case Permission.AssetDownload: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      const isOwner = await access.asset.checkOwnerAccess(auth.user.id, ids, auth.session?.hasElevatedPermission);
      const isAlbum = await access.asset.checkAlbumAccess(auth.user.id, ids.difference(isOwner));
      const isPartner = await access.asset.checkPartnerAccess(
        auth.user.id,
        ids.difference(isOwner).difference(isAlbum),
      );
      return isOwner.union(isAlbum).union(isPartner);
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
        ids.difference(isOwner),
        AlbumUserRole.Viewer,
      );
      return isOwner.union(isShared);
    }

    case Permission.AlbumAssetCreate: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      const isOwner = await access.album.checkOwnerAccess(auth.user.id, ids);
      const isShared = await access.album.checkSharedAlbumAccess(
        auth.user.id,
        ids.difference(isOwner),
        AlbumUserRole.Editor,
      );
      return isOwner.union(isShared);
    }

    case Permission.AlbumUpdate: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      const isOwner = await access.album.checkOwnerAccess(auth.user.id, ids);
      const isShared = await access.album.checkSharedAlbumAccess(
        auth.user.id,
        ids.difference(isOwner),
        AlbumUserRole.Editor,
      );
      return isOwner.union(isShared);
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
        ids.difference(isOwner),
        AlbumUserRole.Editor,
      );
      return isOwner.union(isShared);
    }

    case Permission.AlbumDownload: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      const isOwner = await access.album.checkOwnerAccess(auth.user.id, ids);
      const isShared = await access.album.checkSharedAlbumAccess(
        auth.user.id,
        ids.difference(isOwner),
        AlbumUserRole.Viewer,
      );
      return isOwner.union(isShared);
    }

    case Permission.AlbumAssetDelete: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      const isOwner = await access.album.checkOwnerAccess(auth.user.id, ids);
      const isShared = await access.album.checkSharedAlbumAccess(
        auth.user.id,
        ids.difference(isOwner),
        AlbumUserRole.Editor,
      );
      return isOwner.union(isShared);
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
      const isPartner = await access.timeline.checkPartnerAccess(auth.user.id, ids.difference(isOwner));
      return isOwner.union(isPartner);
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

    case Permission.PersonReassign: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      return access.person.checkFaceOwnerAccess(auth.user.id, ids);
    }

    case Permission.ClusterGroupRead: {
      const { ids } = typeSafeRequest<typeof permission>(request);
      const isMember = await access.clusterGroup.checkOwnerAccess(auth.user.id, ids);
      const isInvited = await access.clusterGroup.checkInviteAccess(auth.user.id, ids.difference(isMember));
      return isMember.union(isInvited);
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
      return isOwner.union(isGroupMember);
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
