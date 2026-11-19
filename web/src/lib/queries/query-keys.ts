import type {
  CalendarHeatmapType,
  IntegrityReport,
  PartnerDirection,
  WorkflowResult,
  WorkflowTrigger,
  getAllPeople,
  getAssetStatistics,
  getMapMarkers,
  getMySharedLink,
  getSearchSuggestions,
  getUsersForPeople,
  searchPerson,
  searchPlaces,
} from '@immich/sdk';

type IdParams = { id: string };
type ActivityParams = { albumId: string; assetId?: string };
type PeopleParams = Parameters<typeof getAllPeople>[0];

export const QueryKeys = {
  // activities
  activities: (...params: [ActivityParams?]) => ['activities', ...params],
  activityStatistics: (...params: [ActivityParams?]) => [...QueryKeys.activities(), 'statistics', ...params],

  // system settings
  adminConfig: () => ['admin', 'config'],
  adminConfigDefaults: () => [...QueryKeys.adminConfig(), 'defaults'],
  storageTemplate: () => [...QueryKeys.adminConfig(), 'storage-template'],
  storageTemplatePreview: (params: { template: string }) => [...QueryKeys.storageTemplate(), 'preview', params],

  // backups
  databaseBackups: () => ['admin', 'database-backups'],

  // integrity checks
  integrityReport: (...params: [{ type: IntegrityReport }?]) => ['admin', 'integrity', 'report', ...params],
  integrityReportSummary: () => ['admin', 'integrity', 'summary'],

  // maintenance
  maintenancePriorInstall: () => ['admin', 'maintenance', 'detect-install'],
  maintenanceStatus: () => ['admin', 'maintenance', 'status'],

  // admin users
  adminUsers: (...params: [{ withDeleted: boolean }?]) => ['admin', 'users', ...params],
  adminUser: ({ id }: IdParams) => [...QueryKeys.adminUsers(), id],
  adminUserCalendarHeatmap: ({ id, ...params }: IdParams & { type: CalendarHeatmapType }) => [
    ...QueryKeys.adminUser({ id }),
    'calendar-heatmap',
    params,
  ],
  adminUserPreferences: ({ id }: IdParams) => [...QueryKeys.adminUser({ id }), 'preferences'],
  adminUserSessions: ({ id }: IdParams) => [...QueryKeys.adminUser({ id }), 'sessions'],
  adminUserStatistics: ({ id }: IdParams) => [...QueryKeys.adminUser({ id }), 'statistics'],

  // albums
  albums: (...params: [{ assetId?: string }?]) => ['albums', ...params],
  albumStatistics: () => [...QueryKeys.albums(), 'statistics'],
  album: ({ id }: IdParams) => [...QueryKeys.albums(), id],
  albumMapMarkers: ({ id }: IdParams) => [...QueryKeys.album({ id }), 'map-markers'],

  // api keys
  apiKeys: () => ['api-keys'],

  // assets
  assetStatistics: (params: Parameters<typeof getAssetStatistics>[0]) => ['assets', 'statistics', params],

  // auth
  authStatus: () => ['auth', 'status'],

  // cluster groups
  clusterGroups: () => ['cluster-groups'],
  clusterGroupRequests: () => [...QueryKeys.clusterGroups(), 'requests'],
  clusterGroupRequestsForGroup: ({ id }: IdParams) => [...QueryKeys.clusterGroups(), id, 'requests'],
  clusterGroupUsers: ({ id }: IdParams) => [...QueryKeys.clusterGroups(), id, 'users'],

  // settings
  userConfig: () => ['config'],

  // duplicates
  duplicates: () => ['duplicates'],

  // faces
  faces: (...params: [IdParams?]) => ['faces', ...params],

  // jobs
  jobs: () => ['jobs'],

  // libraries
  libraries: () => ['libraries'],
  libraryStatistics: ({ id }: IdParams) => [...QueryKeys.libraries(), id, 'statistics'],

  // map
  mapMarkers: (...params: [Parameters<typeof getMapMarkers>[0]?]) => ['map', 'markers', ...params],

  // notifications
  notifications: (params: { unread: boolean }) => ['notifications', params],

  // partners
  partners: (...params: [{ direction: PartnerDirection }?]) => ['partners', ...params],

  // passkeys
  passkeys: () => ['passkeys'],

  // people
  people: (...params: [PeopleParams?]) => ['people', ...params],
  peopleList: (params: PeopleParams) => [...QueryKeys.people(params), 'list'],
  peoplePages: (params: PeopleParams) => [...QueryKeys.people(params), 'pages'],
  peopleUsers: (params: Parameters<typeof getUsersForPeople>[0]) => [...QueryKeys.people(), 'users', params],
  person: ({ id }: IdParams) => [...QueryKeys.people(), id],
  personStatistics: ({ id }: IdParams) => [...QueryKeys.person({ id }), 'statistics'],

  // plugins
  pluginMethods: (params: { trigger?: WorkflowTrigger }) => ['plugins', 'methods', params],
  pluginTemplates: () => ['plugins', 'templates'],

  // public
  publicConfig: () => ['public', 'config'],

  // queues
  queues: () => ['queues'],

  // search
  searchCities: () => ['search', 'cities'],
  searchExplore: () => ['search', 'explore'],
  searchPerson: (...params: [Parameters<typeof searchPerson>[0]?]) => ['search', 'person', ...params],
  searchPlaces: (params: Parameters<typeof searchPlaces>[0]) => ['search', 'places', params],
  searchSuggestions: (params: Parameters<typeof getSearchSuggestions>[0]) => ['search', 'suggestions', params],

  // server
  server: () => ['server'],
  serverAbout: () => [...QueryKeys.server(), 'about'],
  serverConfig: () => [...QueryKeys.server(), 'config'],
  serverFeatures: () => [...QueryKeys.server(), 'features'],
  serverLicense: () => [...QueryKeys.server(), 'license'],
  serverMediaTypes: () => [...QueryKeys.server(), 'media-types'],
  serverStatistics: () => [...QueryKeys.server(), 'statistics'],
  serverStorage: () => [...QueryKeys.server(), 'storage'],
  serverVersion: () => [...QueryKeys.server(), 'version'],
  serverVersionHistory: () => [...QueryKeys.server(), 'version-history'],

  // sessions
  sessions: () => ['sessions'],

  // shared links
  sharedLinks: () => ['shared-links'],
  mySharedLink: (params: Parameters<typeof getMySharedLink>[0]) => [...QueryKeys.sharedLinks(), 'me', params],

  // stacks
  stack: ({ id }: IdParams) => ['stacks', id],

  // tags
  tags: () => ['tags'],

  // users
  users: () => ['users'],
  myUser: () => [...QueryKeys.users(), 'me'],
  myCalendarHeatmap: (params: { type: CalendarHeatmapType }) => [...QueryKeys.myUser(), 'calendar-heatmap', params],
  myPreferences: () => [...QueryKeys.myUser(), 'preferences'],
  user: ({ id }: IdParams) => [...QueryKeys.users(), id],

  // folders
  folderAssets: (params: { path?: string }) => ['view', 'folder', params],
  folderPaths: () => ['view', 'folder', 'unique-paths'],

  // workflows
  workflows: () => ['workflows'],
  workflowTriggers: () => [...QueryKeys.workflows(), 'triggers'],
  workflowLogs: ({ id, ...params }: IdParams & { result?: WorkflowResult }) => [
    ...QueryKeys.workflows(),
    id,
    'logs',
    params,
  ],
  workflowShare: ({ id }: IdParams) => [...QueryKeys.workflows(), id, 'share'],

  // client only
  queueSnapshots: () => ['queue-snapshots'],
};
