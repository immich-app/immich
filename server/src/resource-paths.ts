import { QueueName } from 'src/enum.js';

type IdParams = { id: string };

export const Resource = {
  activities: () => '/activities',
  activityStatistics: () => '/activities/statistics',

  adminConfig: () => '/admin/config',

  databaseBackups: () => '/admin/database-backups',

  integrityReport: () => '/admin/integrity/report',
  integrityReportSummary: () => '/admin/integrity/summary',

  adminUsers: () => '/admin/users',
  adminUser: ({ id }: IdParams) => `/admin/users/${id}`,
  adminUserPreferences: ({ id }: IdParams) => `/admin/users/${id}/preferences`,

  albums: () => '/albums',
  albumStatistics: () => '/albums/statistics',
  album: ({ id }: IdParams) => `/albums/${id}`,

  apiKeys: () => '/api-keys',
  apiKey: ({ id }: IdParams) => `/api-keys/${id}`,

  assetFile: ({ id }: IdParams) => `/asset-files/${id}`,

  assets: () => '/assets',
  assetStatistics: () => '/assets/statistics',
  asset: ({ id }: IdParams) => `/assets/${id}`,

  authStatus: () => '/auth/status',

  clusterGroupRequests: () => '/cluster-groups/requests',
  clusterGroup: ({ id }: IdParams) => `/cluster-groups/${id}`,
  clusterGroupRequestsForGroup: ({ id }: IdParams) => `/cluster-groups/${id}/requests`,

  duplicates: () => '/duplicates',

  faces: () => '/faces',

  jobs: () => '/jobs',

  libraries: () => '/libraries',
  library: ({ id }: IdParams) => `/libraries/${id}`,

  mapMarkers: () => '/map/markers',

  memories: () => '/memories',
  memory: ({ id }: IdParams) => `/memories/${id}`,

  notifications: () => '/notifications',
  notification: ({ id }: IdParams) => `/notifications/${id}`,

  partners: () => '/partners',

  passkeys: () => '/passkeys',
  passkey: ({ id }: IdParams) => `/passkeys/${id}`,

  people: () => '/people',
  person: ({ id }: IdParams) => `/people/${id}`,

  queue: ({ name }: { name: QueueName }) => `/queues/${name}`,

  search: () => '/search',
  searchPerson: () => '/search/person',

  serverAbout: () => '/server/about',
  serverLicense: () => '/server/license',

  sessions: () => '/sessions',

  sharedLinks: () => '/shared-links',
  sharedLink: ({ id }: IdParams) => `/shared-links/${id}`,

  stacks: () => '/stacks',
  stack: ({ id }: IdParams) => `/stacks/${id}`,

  adminOnboarding: () => '/system-metadata/admin-onboarding',

  tags: () => '/tags',
  tag: ({ id }: IdParams) => `/tags/${id}`,

  myUser: () => '/users/me',
  myPreferences: () => '/users/me/preferences',
  myLicense: () => '/users/me/license',
  myOnboarding: () => '/users/me/onboarding',
  user: ({ id }: IdParams) => `/users/${id}`,

  view: () => '/view',

  workflows: () => '/workflows',
  workflow: ({ id }: IdParams) => `/workflows/${id}`,
};
