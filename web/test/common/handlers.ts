import type { MockData } from '#test/common/data.ts';
import { factory } from '#test/common/factories.ts';
import { fromBase64, minimalMp4, placeholderImage } from '#test/common/helpers.ts';
import type { Handlers } from '#test/common/types.ts';
import { AssetUploadAction, WorkflowTrigger, WorkflowType } from '@immich/sdk';

const notFound = { status: 404, json: { message: 'Not found', statusCode: 404 } };
const passwordRequired = { status: 401, json: { message: 'Password required', statusCode: 401 } };
const invalidPassword = { status: 401, json: { message: 'Invalid password', statusCode: 401 } };
const emptyZip = fromBase64('UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==');

export const createHandlers = (data: MockData): Handlers => {
  const media = (assetId: string) => {
    if (data.isBroken(assetId)) {
      return { status: 404 };
    }
    return { body: placeholderImage(data.getAsset(assetId), assetId), contentType: 'image/svg+xml' };
  };

  return {
    getServerConfig: () => ({ json: data.serverConfig }),
    getPublicConfig: () => ({ json: data.publicConfig }),
    getUserConfig: () => ({ json: data.userConfig }),
    getAdminConfig: () => ({ json: data.adminConfig }),
    getAdminConfigDefaults: () => ({ json: data.adminConfig }),
    updateAdminConfig: ({ body }) => ({ json: data.updateAdminConfig(body) }),
    getServerFeatures: () => ({ json: data.serverFeatures }),
    getAboutInfo: () => ({ json: data.aboutInfo }),
    getStorage: () => ({ json: data.storage }),
    getVersionHistory: () => ({ json: data.versionHistory }),
    getSupportedMediaTypes: () => ({ json: data.mediaTypes }),
    getMyUser: () => ({ json: data.user }),
    getMyPreferences: () => ({ json: data.getPreferences() }),
    getNotifications: () => ({ json: data.notifications }),
    searchUsersAdmin: ({ params = {} }) => ({ json: data.userList(params) }),
    createUserAdmin: ({ body }) => ({ status: 201, json: data.createUser(body) }),
    updateUserAdmin: ({ params, body }) => {
      const user = data.updateUser(params.id, body);
      return user ? { json: user } : notFound;
    },
    getUserStatisticsAdmin: () => ({ json: { images: 0, videos: 0, total: 0 } }),
    getUserSessionsAdmin: () => ({ json: [] }),
    getApiKeys: () => ({ json: [] }),
    getSessions: () => ({ json: [] }),
    searchPasskeys: () => ({ json: [] }),
    getUserCalendarHeatmapAdmin: ({ params }) => ({
      json: { from: params.$from ?? '', to: params.to ?? '', series: [], totalCount: 0 },
    }),
    getUserPreferencesAdmin: () => ({ json: factory.preferences() }),
    getServerVersion: () => ({ json: data.serverVersion }),
    listDatabaseBackups: () => ({ json: data.backups }),
    getQueuesLegacy: () => ({ json: data.queues }),
    getIntegrityReportSummary: () => ({ json: data.getIntegrityReport() }),
    createJob: () => ({ status: 201 }),
    getQueues: () => ({ json: data.queueList() }),
    getQueue: ({ params }) => {
      const queue = data.getQueue(params.name);
      return queue ? { json: queue } : notFound;
    },
    getQueueJobs: () => ({ json: [] }),
    updateQueue: ({ params, body }) => {
      const queue = data.updateQueue(params.name, body);
      return queue ? { json: queue } : notFound;
    },
    emptyQueue: ({ params, body }) => (data.emptyQueue(params.name, body) ? { status: 204 } : notFound),
    runQueueCommandLegacy: ({ params, body }) => {
      const queue = data.runQueueCommand(params.name, body);
      return queue
        ? {
            json: {
              jobCounts: queue.statistics,
              queueStatus: { isActive: queue.statistics.active > 0, isPaused: queue.isPaused },
            },
          }
        : notFound;
    },

    getTimeBuckets: ({ params = {} }) => ({ json: data.timeBuckets(params) }),
    getTimeBucket: ({ params }) => ({ json: data.timeBucket(params.timeBucket, params) }),

    getAssetInfo: ({ params }) => {
      const asset = data.getAsset(params.id);
      return asset ? { json: data.assetForSharedLink(asset, params.key) } : notFound;
    },
    updateAsset: ({ params, body }) => {
      const asset = data.updateAsset(params.id, body);
      return asset ? { json: asset } : notFound;
    },
    updateAssets: ({ body }) => {
      data.updateAssets(body);
      return { status: 204 };
    },
    deleteAssets: ({ body }) => {
      data.deleteAssets(body.ids, body.force);
      return { status: 204 };
    },
    restoreAssets: ({ body }) => ({ json: { count: data.restoreAssets(body.ids) } }),
    getAssetOcr: ({ params }) => ({ json: data.getOcr(params.id) }),
    checkBulkUpload: ({ body }) => ({
      json: { results: body.assets.map(({ id }) => ({ id, action: AssetUploadAction.Accept })) },
    }),
    getAssetDuplicates: () => ({ json: data.duplicateList() }),
    resolveDuplicates: ({ body }) => ({ json: data.resolveDuplicates(body) }),
    deleteDuplicates: ({ body }) => {
      data.deleteDuplicates(body.ids);
      return { status: 204 };
    },

    getActivities: ({ params }) => ({ json: data.activityList(params) }),
    getActivityStatistics: ({ params }) => ({ json: data.activityStatistics(params) }),
    createActivity: ({ body }) => ({ status: 201, json: data.createActivity(body) }),
    deleteActivity: ({ params }) => (data.deleteActivity(params.id) ? { status: 204 } : notFound),

    getAllTags: () => ({ json: data.tagList() }),
    getTagById: ({ params }) => {
      const tag = data.getTag(params.id);
      return tag ? { json: tag } : notFound;
    },
    getSearchSuggestions: () => ({ json: [] }),

    updatePeople: ({ body }) => ({ json: data.updatePeople(body.people) }),
    getFaces: () => ({ json: [] }),
    createFace: () => ({ status: 201 }),
    getAllPeople: () => {
      const people = data.getPeople();
      return { json: { hasNextPage: false, hidden: 0, people, total: people.length } };
    },
    getPersonThumbnail: ({ params }) => ({
      body: placeholderImage(undefined, params.id),
      contentType: 'image/svg+xml',
    }),

    getStack: ({ params }) => {
      const stack = data.getStack(params.id);
      return stack ? { json: stack } : notFound;
    },
    createStack: ({ body }) => ({ status: 201, json: data.createStack(body) }),
    updateStack: ({ params, body }) => {
      const stack = data.updateStack(params.id, body);
      return stack ? { json: stack } : notFound;
    },
    removeAssetFromStack: ({ params }) =>
      data.removeFromStack(params.id, params.assetId) ? { status: 204 } : notFound,
    deleteStacks: ({ body }) => {
      data.deleteStacks(body.ids);
      return { status: 204 };
    },

    getAllAlbums: ({ params = {} }) => ({ json: data.albumList(params.assetId) }),
    createAlbum: ({ body }) => ({ status: 201, json: data.createAlbum(body) }),
    deleteAlbum: ({ params }) => {
      data.deleteAlbum(params.id);
      return { status: 204 };
    },
    getAlbumMapMarkers: ({ params }) => ({ json: data.mapMarkers(params.id) }),
    getMapMarkers: () => ({ json: data.mapMarkers() }),
    getAlbumInfo: ({ params }) => {
      const album = data.getAlbum(params.id);
      return album ? { json: album } : notFound;
    },
    updateAlbumInfo: ({ params, body }) => {
      const album = data.updateAlbum(params.id, body);
      return album ? { json: album } : notFound;
    },
    removeAssetFromAlbum: ({ params, body }) => ({ json: data.removeFromAlbum(params.id, body.ids) }),
    addAssetsToAlbum: ({ params, body }) => {
      data.addToAlbum(
        params.id,
        body.ids.map((id) => ({ id })),
      );
      return { json: body.ids.map((id) => ({ id, success: true })) };
    },

    searchMemories: ({ params = {} }) => ({ json: data.memoryList(params) }),
    memoriesStatistics: () => ({ json: { total: data.memoryList().length } }),
    getMemory: ({ params }) => {
      const memory = data.getMemory(params.id);
      return memory ? { json: memory } : notFound;
    },
    updateMemory: ({ params, body }) => {
      const memory = data.updateMemory(params.id, body);
      return memory ? { json: memory } : notFound;
    },
    deleteMemory: ({ params }) => {
      data.deleteMemory(params.id);
      return { status: 204 };
    },

    searchAssets: ({ body }) => ({ json: data.searchAssets(body) }),

    getAllSharedLinks: () => ({ json: data.sharedLinkList() }),
    getMySharedLink: ({ params = {} }) => {
      const link = data.getSharedLink(params);
      if (!link) {
        return notFound;
      }
      return link.password ? passwordRequired : { json: link };
    },
    sharedLinkLogin: ({ params = {}, body }) => {
      const link = data.getSharedLink(params);
      if (!link) {
        return notFound;
      }
      return link.password === body.password ? { json: link } : invalidPassword;
    },
    removeSharedLinkAssets: ({ params, body }) => {
      data.removeSharedLinkAssets(params.id, body.assetIds);
      return { json: body.assetIds.map((assetId) => ({ assetId, success: true })) };
    },
    getDownloadInfo: ({ body }) => ({ json: data.downloadInfo(body) }),
    downloadArchive: () => ({
      body: emptyZip,
      contentType: 'application/zip',
      headers: { 'Content-Disposition': 'attachment; filename="immich.zip"' },
    }),

    searchWorkflows: () => ({ json: data.workflowList() }),
    getWorkflowTriggers: () => ({
      json: Object.values(WorkflowTrigger).map((trigger) => ({ trigger, types: [WorkflowType.AssetV1] })),
    }),
    createWorkflow: ({ body }) => ({ status: 201, json: data.createWorkflow(body) }),
    updateWorkflow: ({ params, body }) => {
      const workflow = data.updateWorkflow(params.id, body);
      return workflow ? { json: workflow } : notFound;
    },
    searchPluginMethods: () => ({ json: data.pluginMethodList() }),
    searchPluginTemplates: () => ({ json: [] }),

    playAssetVideo: () => ({ body: minimalMp4, contentType: 'video/mp4' }),
    viewAsset: ({ params }) => media(params.id),
    downloadAsset: ({ params }) => media(params.id),
  };
};
