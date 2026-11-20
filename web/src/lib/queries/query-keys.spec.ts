import { getActivitiesQuery, getActivityStatisticsQuery, getMyLikeQuery } from '#lib/queries/activity.query.ts';
import {
  getAlbumInfoQuery,
  getAlbumMapMarkersQuery,
  getAlbumQuery,
  getAlbumStatisticsQuery,
  getAlbumsByAssetQuery,
  getAllAlbumsQuery,
  getRecentAlbumsQuery,
} from '#lib/queries/album.query.ts';
import { getApiKeysQuery } from '#lib/queries/api-key.query.ts';
import { getAssetStatisticsQuery } from '#lib/queries/asset.query.ts';
import { getAuthStatusQuery } from '#lib/queries/auth.query.ts';
import {
  getClusterGroupRequestsForGroupQuery,
  getClusterGroupRequestsQuery,
  getClusterGroupUsersQuery,
} from '#lib/queries/cluster-group.query.ts';
import {
  getAdminConfigDefaultsQuery,
  getAdminConfigQuery,
  getStorageTemplateOptionsQuery,
  getStorageTemplatePreviewQuery,
} from '#lib/queries/config-admin.query.ts';
import { getPublicConfigQuery } from '#lib/queries/config-public.query.ts';
import { getUserConfigQuery } from '#lib/queries/config-user.query.ts';
import { getDatabaseBackupsQuery } from '#lib/queries/database-backup.query.ts';
import { getAssetDuplicatesQuery } from '#lib/queries/duplicate.query.ts';
import { getFacesQuery } from '#lib/queries/face.query.ts';
import { getIntegrityReportQuery, getIntegrityReportSummaryQuery } from '#lib/queries/integrity-admin.query.ts';
import { getAllLibrariesQuery, getLibraryQuery, getLibraryStatisticsQuery } from '#lib/queries/library.query.ts';
import { detectPriorInstallQuery, getMaintenanceStatusQuery } from '#lib/queries/maintenance.query.ts';
import { getMapMarkersQuery } from '#lib/queries/map.query.ts';
import { getNotificationsQuery } from '#lib/queries/notification.query.ts';
import { getPartnersQuery } from '#lib/queries/partner.query.ts';
import { searchPasskeysQuery } from '#lib/queries/passkey.query.ts';
import {
  getAllPeoplePagesQuery,
  getAllPeopleQuery,
  getPersonQuery,
  getPersonStatisticsQuery,
  getUsersForPeopleQuery,
} from '#lib/queries/person.query.ts';
import { searchPluginMethodsQuery, searchPluginTemplatesQuery } from '#lib/queries/plugin.query.ts';
import { QueryKeys } from '#lib/queries/query-keys.ts';
import {
  getQueueQuery,
  getQueueSnapshotsQuery,
  getQueuesLegacyQuery,
  getQueuesQuery,
} from '#lib/queries/queue.query.ts';
import {
  getAssetsByCityQuery,
  getExploreDataQuery,
  getSearchSuggestionsQuery,
  searchPersonQuery,
  searchPlacesQuery,
} from '#lib/queries/search.query.ts';
import {
  getAboutInfoQuery,
  getServerConfigQuery,
  getServerFeaturesQuery,
  getServerStatisticsQuery,
  getServerVersionQuery,
  getStorageQuery,
  getSupportedMediaTypesQuery,
  getVersionHistoryQuery,
} from '#lib/queries/server-info.query.ts';
import { getServerLicenseQuery } from '#lib/queries/server-license.query.ts';
import { getSessionsQuery } from '#lib/queries/session.query.ts';
import { getAllSharedLinksQuery, getMySharedLinkQuery, getSharedLinkQuery } from '#lib/queries/shared-link.query.ts';
import { getStackQuery } from '#lib/queries/stack.query.ts';
import { getAllTagsQuery, getTagByIdQuery } from '#lib/queries/tag.query.ts';
import {
  getUserAdminQuery,
  getUserCalendarHeatmapAdminQuery,
  getUserPreferencesAdminQuery,
  getUserSessionsAdminQuery,
  getUserStatisticsAdminQuery,
  searchUsersAdminQuery,
} from '#lib/queries/user-admin.query.ts';
import {
  getMyCalendarHeatmapQuery,
  getMyPreferencesQuery,
  getMyUserQuery,
  getUserQuery,
  searchUsersQuery,
} from '#lib/queries/user.query.ts';
import {
  getAssetsByOriginalPathQuery,
  getFolderTreeQuery,
  getUniqueOriginalPathsQuery,
} from '#lib/queries/view.query.ts';
import {
  getWorkflowForShareQuery,
  getWorkflowLogsQuery,
  getWorkflowQuery,
  getWorkflowTriggersQuery,
  searchWorkflowsQuery,
} from '#lib/queries/workflow.query.ts';
import {
  CalendarHeatmapType,
  IntegrityReport,
  PartnerDirection,
  QueueName,
  SearchSuggestionType,
  WorkflowResult,
  WorkflowTrigger,
} from '@immich/sdk';

type QueryFactory = () => { queryKey: readonly unknown[]; queryFn?: unknown };

const id = 'resource-id';

const queries: Record<string, QueryFactory> = {
  getActivitiesQuery: () => getActivitiesQuery({ albumId: id, assetId: 'asset-id' }),
  getMyLikeQuery: () => getMyLikeQuery({ albumId: id }),
  getActivityStatisticsQuery: () => getActivityStatisticsQuery({ albumId: id }),
  getAllAlbumsQuery: () => getAllAlbumsQuery({ isOwned: true }),
  getRecentAlbumsQuery: () => getRecentAlbumsQuery(),
  getAlbumQuery: () => getAlbumQuery(id),
  getAlbumsByAssetQuery: () => getAlbumsByAssetQuery('asset-id'),
  getAlbumStatisticsQuery: () => getAlbumStatisticsQuery(),
  getAlbumInfoQuery: () => getAlbumInfoQuery(id),
  getAlbumMapMarkersQuery: () => getAlbumMapMarkersQuery(id),
  getApiKeysQuery: () => getApiKeysQuery(),
  getAssetStatisticsQuery: () => getAssetStatisticsQuery({ isFavorite: true }),
  getAuthStatusQuery: () => getAuthStatusQuery(),
  getClusterGroupRequestsQuery: () => getClusterGroupRequestsQuery(),
  getClusterGroupRequestsForGroupQuery: () => getClusterGroupRequestsForGroupQuery(id),
  getClusterGroupUsersQuery: () => getClusterGroupUsersQuery(id),
  getAdminConfigQuery: () => getAdminConfigQuery(),
  getAdminConfigDefaultsQuery: () => getAdminConfigDefaultsQuery(),
  getStorageTemplateOptionsQuery: () => getStorageTemplateOptionsQuery(),
  getStorageTemplatePreviewQuery: () => getStorageTemplatePreviewQuery('{{y}}/{{filename}}'),
  getPublicConfigQuery: () => getPublicConfigQuery(),
  getUserConfigQuery: () => getUserConfigQuery(),
  getDatabaseBackupsQuery: () => getDatabaseBackupsQuery(),
  getAssetDuplicatesQuery: () => getAssetDuplicatesQuery(),
  getFacesQuery: () => getFacesQuery('asset-id'),
  getIntegrityReportSummaryQuery: () => getIntegrityReportSummaryQuery(),
  getIntegrityReportQuery: () => getIntegrityReportQuery(IntegrityReport.MissingFile),
  getAllLibrariesQuery: () => getAllLibrariesQuery(),
  getLibraryQuery: () => getLibraryQuery(id),
  getLibraryStatisticsQuery: () => getLibraryStatisticsQuery(id),
  getMaintenanceStatusQuery: () => getMaintenanceStatusQuery(),
  detectPriorInstallQuery: () => detectPriorInstallQuery(),
  getMapMarkersQuery: () => getMapMarkersQuery({ isFavorite: true }),
  getNotificationsQuery: () => getNotificationsQuery(),
  getPartnersQuery: () => getPartnersQuery(PartnerDirection.SharedBy),
  searchPasskeysQuery: () => searchPasskeysQuery(),
  getAllPeopleQuery: () => getAllPeopleQuery({ withHidden: true }),
  getAllPeoplePagesQuery: () => getAllPeoplePagesQuery({ withHidden: true }),
  getPersonQuery: () => getPersonQuery(id),
  getPersonStatisticsQuery: () => getPersonStatisticsQuery(id),
  getUsersForPeopleQuery: () => getUsersForPeopleQuery({ personId: id }),
  searchPluginMethodsQuery: () => searchPluginMethodsQuery({ trigger: WorkflowTrigger.AssetCreate }),
  searchPluginTemplatesQuery: () => searchPluginTemplatesQuery(),
  getQueuesQuery: () => getQueuesQuery(),
  getQueuesLegacyQuery: () => getQueuesLegacyQuery(),
  getQueueQuery: () => getQueueQuery(QueueName.ThumbnailGeneration),
  getSearchSuggestionsQuery: () => getSearchSuggestionsQuery({ $type: SearchSuggestionType.Country }),
  searchPersonQuery: () => searchPersonQuery({ name: 'name' }),
  searchPlacesQuery: () => searchPlacesQuery({ name: 'name' }),
  getExploreDataQuery: () => getExploreDataQuery(),
  getAssetsByCityQuery: () => getAssetsByCityQuery(),
  getAboutInfoQuery: () => getAboutInfoQuery(),
  getVersionHistoryQuery: () => getVersionHistoryQuery(),
  getStorageQuery: () => getStorageQuery(),
  getServerConfigQuery: () => getServerConfigQuery(),
  getServerFeaturesQuery: () => getServerFeaturesQuery(),
  getSupportedMediaTypesQuery: () => getSupportedMediaTypesQuery(),
  getServerStatisticsQuery: () => getServerStatisticsQuery(),
  getServerVersionQuery: () => getServerVersionQuery(),
  getServerLicenseQuery: () => getServerLicenseQuery(),
  getSessionsQuery: () => getSessionsQuery(),
  getAllSharedLinksQuery: () => getAllSharedLinksQuery({ albumId: id }),
  getSharedLinkQuery: () => getSharedLinkQuery(id),
  getMySharedLinkQuery: () => getMySharedLinkQuery({ key: 'shared-key' }),
  getStackQuery: () => getStackQuery(id),
  getAllTagsQuery: () => getAllTagsQuery(),
  getTagByIdQuery: () => getTagByIdQuery(id),
  searchUsersAdminQuery: () => searchUsersAdminQuery({ withDeleted: true }),
  getUserAdminQuery: () => getUserAdminQuery(id),
  getUserPreferencesAdminQuery: () => getUserPreferencesAdminQuery(id),
  getUserStatisticsAdminQuery: () => getUserStatisticsAdminQuery(id),
  getUserSessionsAdminQuery: () => getUserSessionsAdminQuery(id),
  getUserCalendarHeatmapAdminQuery: () => getUserCalendarHeatmapAdminQuery(id),
  getMyUserQuery: () => getMyUserQuery(),
  getMyPreferencesQuery: () => getMyPreferencesQuery(),
  getMyCalendarHeatmapQuery: () => getMyCalendarHeatmapQuery(CalendarHeatmapType.Upload),
  searchUsersQuery: () => searchUsersQuery(),
  getUserQuery: () => getUserQuery(id),
  getUniqueOriginalPathsQuery: () => getUniqueOriginalPathsQuery(),
  getFolderTreeQuery: () => getFolderTreeQuery(),
  getAssetsByOriginalPathQuery: () => getAssetsByOriginalPathQuery('/photos/2024'),
  searchWorkflowsQuery: () => searchWorkflowsQuery(),
  getWorkflowQuery: () => getWorkflowQuery(id),
  getWorkflowForShareQuery: () => getWorkflowForShareQuery(id),
  getWorkflowTriggersQuery: () => getWorkflowTriggersQuery(),
  getWorkflowLogsQuery: () => getWorkflowLogsQuery(id, WorkflowResult.Completed),
};

const clientOnlyQueries = new Set(['getQueueSnapshotsQuery']);
const nonGetQueries = new Set(['getStorageTemplatePreviewQuery']);

const queryModules = import.meta.glob<Record<string, unknown>>('./*.query.ts', { eager: true });

const getResourcePath = (queryKey: readonly unknown[]) => {
  const end = queryKey.findIndex((element) => typeof element !== 'string');
  return queryKey.slice(0, end === -1 ? undefined : end);
};

const getRequest = async ({ queryKey, queryFn }: ReturnType<QueryFactory>) => {
  const requests: Request[] = [];
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push(new Request(input, init));
    return Promise.resolve(Response.json({}));
  });

  const run = queryFn as (context: unknown) => Promise<unknown>;
  await run({ queryKey, signal: new AbortController().signal, pageParam: undefined, meta: undefined });

  expect(requests).toHaveLength(1);
  const [{ method, url }] = requests;
  const path = new URL(url).pathname
    .split('/')
    .slice(2)
    .map((segment) => decodeURIComponent(segment));
  return { method, path };
};

describe('query keys', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each(Object.entries({ ...queries, getQueueSnapshotsQuery }))('%s takes its key from QueryKeys', (_, factory) => {
    const spies = Object.keys(QueryKeys).map((name) => vi.spyOn(QueryKeys, name as keyof typeof QueryKeys));

    const { queryKey } = factory();

    expect(spies.flatMap((spy) => spy.mock.results.map(({ value }) => value))).toContain(queryKey);
  });

  it.each(Object.entries(queries))('%s starts with its request path', async (_, factory) => {
    const options = factory();

    const { path } = await getRequest(options);

    expect(getResourcePath(options.queryKey)).toEqual(path);
  });

  it.each(Object.entries(queries))('%s reads with GET', async (name, factory) => {
    const { method } = await getRequest(factory());

    expect(method).toBe(nonGetQueries.has(name) ? 'POST' : 'GET');
  });

  it('covers every exported query factory', () => {
    const exported = Object.values(queryModules).flatMap((module) =>
      Object.keys(module).filter((name) => name.endsWith('Query')),
    );

    const covered = new Set([...Object.keys(queries), ...clientOnlyQueries]);
    const uncovered = exported.filter((name) => !covered.has(name));

    expect(uncovered).toEqual([]);
  });
});
