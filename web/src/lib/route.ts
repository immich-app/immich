import { OpenQueryParam, type SharedLinkTab } from '$lib/constants';
import { QueueName, type MetadataSearchDto, type SmartSearchDto } from '@immich/sdk';
import { omitBy } from 'lodash-es';

const asQueueSlug = (name: QueueName) => {
  return name.replaceAll(/[A-Z]/g, (m) => '-' + m.toLowerCase());
};

export const fromQueueSlug = (slug: string): QueueName | undefined => {
  const name = slug.replaceAll(/-([a-z])/g, (_, c) => c.toUpperCase());
  if (Object.values(QueueName).includes(name as QueueName)) {
    return name as QueueName;
  }
};

type QueryValue = number | string;
const asQueryString = (params?: Record<string, QueryValue | undefined>) => {
  const items = Object.entries(params ?? {})
    .filter((item): item is [string, QueryValue] => item[1] !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);

  return items.length === 0 ? '' : `?${items.join('&')}`;
};

export const Route = {
  // auth
  login: (params?: { continue?: string; autoLaunch?: 0 | 1 }) => '/auth/login' + asQueryString(params),
  register: () => '/auth/register',
  changePassword: () => '/auth/change-password',
  onboarding: (params?: { step?: string }) => '/auth/onboarding' + asQueryString(params),
  pinPrompt: (params?: { continue?: string }) => '/auth/pin-prompt' + asQueryString({ continue: params?.continue }),

  // albums
  albums: () => '/albums',
  viewAlbum: ({ id }: { id: string }) => `/albums/${id}`,
  viewAlbumAsset: ({ albumId, assetId }: { albumId: string; assetId: string }) =>
    `/albums/${albumId}/photos/${assetId}`,

  // explore
  explore: () => '/explore',
  places: () => '/places',

  // libraries
  libraries: () => '/admin/library-management',
  newLibrary: () => '/admin/library-management/new',
  viewLibrary: ({ id }: { id: string }) => `/admin/library-management/${id}`,
  editLibrary: ({ id }: { id: string }) => `/admin/library-management/${id}/edit`,

  // memories
  memories: (params?: { id?: string }) => '/memory' + asQueryString(params),

  // partners
  viewPartner: ({ id }: { id: string }) => `/partners/${id}`,

  // photos
  photos: (params?: { at?: string }) => '/photos' + asQueryString(params),
  viewAsset: ({ id }: { id: string }) => `/photos/${id}`,
  archive: () => '/archive',
  favorites: () => '/favorites',
  locked: () => '/locked',
  trash: () => '/trash',
  viewTrashedAsset: ({ id }: { id: string }) => `/trash/photos/${id}`,

  // search
  search: (dto?: MetadataSearchDto | SmartSearchDto) => {
    const metadata = omitBy(dto ?? {}, (value) => value === undefined);
    const query = Object.keys(metadata).length === 0 ? undefined : JSON.stringify(metadata);
    return `/search` + asQueryString({ query });
  },

  // sharing
  sharing: () => '/sharing',

  // shared links
  sharedLinks: (params?: { filter?: SharedLinkTab }) => '/shared-links' + asQueryString(params),
  editSharedLink: ({ id }: { id: string }) => `/shared-links/${id}/edit`,
  viewSharedLink: ({ slug, key }: { slug?: string | null; key: string }) => (slug ? `/s/${slug}` : `/share/${key}`),

  // settings
  userSettings: (params?: { isOpen?: OpenQueryParam }) => '/user-settings' + asQueryString(params),

  // system
  systemSettings: (params?: { isOpen?: OpenQueryParam }) => '/admin/system-settings' + asQueryString(params),
  systemStatistics: () => '/admin/server-status',

  // users
  users: () => '/admin/users',
  newUser: () => `/admin/users/new`,
  viewUser: ({ id }: { id: string }) => `/admin/users/${id}`,
  editUser: ({ id }: { id: string }) => `/admin/users/${id}/edit`,

  // utilities
  utilities: () => '/utilities',
  duplicatesUtility: (params?: { index?: number }) => '/utilities/duplicates' + asQueryString(params),
  largeFileUtility: () => '/utilities/large-files',
  geolocationUtility: () => '/utilities/geolocation',

  // workflows
  workflows: () => '/utilities/workflows',
  viewWorkflow: ({ id }: { id: string }) => `/utilities/workflows/${id}`,

  // queues
  queues: () => '/admin/queues',
  viewQueue: ({ name }: { name: QueueName }) => `/admin/queues/${asQueueSlug(name)}`,
};
