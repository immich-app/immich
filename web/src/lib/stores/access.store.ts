import { user as userStore } from '$lib/stores/user.store';
import { getSharedLink } from '$lib/utils';
import {
  getPartners,
  PartnerDirection,
  Permission,
  type AlbumResponseDto,
  type AssetResponseDto,
  type PartnerResponseDto,
  type SharedLinkResponseDto,
  type UserAdminResponseDto,
} from '@immich/sdk';
import { derived, writable } from 'svelte/store';

type AssetPermissions =
  | 'asset.delete'
  | 'asset.share'
  | 'asset.download'
  | 'asset.upload'
  | 'asset.favorite'
  | 'asset.stack'
  | 'asset.unstack';

type AlbumPermissions = 'album.update';

type AssetAccessRequest = { asset: AssetResponseDto; access: AssetPermissions };
type AlbumAccessRequest = { album: AlbumResponseDto; access: AlbumPermissions };
type AccessRequest = AssetAccessRequest | AlbumAccessRequest;

type AccessData = {
  user?: UserAdminResponseDto;
  partners?: PartnerResponseDto[];
  sharedLink?: SharedLinkResponseDto;
};

const isAssetRequest = (request: AccessRequest): request is AssetAccessRequest => 'asset' in request;
const isAlbumRequest = (request: AccessRequest): request is AlbumAccessRequest => 'album' in request;

export const hasAccess = (request: AccessRequest, data: AccessData) => {
  return hasUserAccess(request, data) || hasSharedLinkAccess(request, data);
};

const hasUserAccess = (request: AccessRequest, { user, partners }: AccessData) => {
  if (!user) {
    return false;
  }

  const partnerIds = new Set((partners || []).map((partner) => partner.id));

  if (isAssetRequest(request)) {
    const { asset, access } = request;
    if (asset.ownerId === user.id) {
      return true;
    }

    if ((['asset.download'] as AssetPermissions[]).includes(access) && partnerIds.has(asset.ownerId)) {
      return true;
    }
  }

  if (isAlbumRequest(request)) {
    const { album } = request;
    if (album.ownerId === user.id) {
      return true;
    }
  }

  return false;
};

const hasSharedLinkAccess = (request: AccessRequest, { sharedLink }: AccessData) => {
  if (!sharedLink) {
    return false;
  }

  switch (request.access) {
    case Permission.AssetUpload: {
      return sharedLink.allowUpload;
    }

    case Permission.AssetDownload: {
      return sharedLink.allowDownload;
    }

    default: {
      return false;
    }
  }
};

const partnerStore = writable<PartnerResponseDto[]>([]);
export const access = derived([userStore, partnerStore], ([user, partners]) => {
  const data = { user, partners, sharedLink: getSharedLink() };
  return (request: AccessRequest) => hasAccess(request, data);
});

const init = async () => {
  const partners = await getPartners({ direction: PartnerDirection.SharedWith });
  partnerStore.set(partners);
};

export const accessManager = {
  init,
};
