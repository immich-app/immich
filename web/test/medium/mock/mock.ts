import { createMockApi, type MockApi } from '#test/medium/mock/api.ts';
import { MockData } from '#test/medium/mock/data.ts';
import { factory } from '#test/medium/mock/factories.ts';
import { minimalMp4, placeholderImage } from '#test/medium/mock/helpers.ts';
import { BrowserLogger } from '#test/medium/mock/logger.ts';
import type { BrowserContext, Download, Page } from '@playwright/test';

export type { Call, Handler, HandlerContext, HandlerResult, OperationId, ResponseOf } from '#test/medium/mock/types.ts';

const notFound = { status: 404, json: { message: 'Not found', statusCode: 404 } };
const passwordRequired = { status: 401, json: { message: 'Password required', statusCode: 401 } };
const invalidPassword = { status: 401, json: { message: 'Invalid password', statusCode: 401 } };
const emptyZip = Buffer.from('UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==', 'base64');

export class Mock {
  readonly data = new MockData();
  readonly api: MockApi;
  readonly logger = new BrowserLogger();
  private page?: Page;
  private readonly onDownload = (download: Download) => this.api.recordDownload(new URL(download.url()));

  constructor(context: BrowserContext) {
    this.api = createMockApi(context).on({
      getServerConfig: () => ({ json: this.data.serverConfig }),
      getPublicConfig: () => ({ json: this.data.publicConfig }),
      getUserConfig: () => ({ json: this.data.userConfig }),
      getAdminConfig: () => ({ json: this.data.adminConfig }),
      getServerFeatures: () => ({ json: this.data.serverFeatures }),
      getAboutInfo: () => ({ json: this.data.aboutInfo }),
      getStorage: () => ({ json: this.data.storage }),
      getVersionHistory: () => ({ json: this.data.versionHistory }),
      getSupportedMediaTypes: () => ({ json: this.data.mediaTypes }),
      getMyUser: () => ({ json: this.data.user }),
      getMyPreferences: () => ({ json: this.data.getPreferences() }),
      getNotifications: () => ({ json: this.data.notifications }),
      searchUsersAdmin: ({ params = {} }) => ({ json: this.data.userList(params) }),
      createUserAdmin: ({ body }) => ({ status: 201, json: this.data.createUser(body) }),
      updateUserAdmin: ({ params, body }) => {
        const user = this.data.updateUser(params.id, body);
        return user ? { json: user } : notFound;
      },
      getUserStatisticsAdmin: () => ({ json: { images: 0, videos: 0, total: 0 } }),
      getUserSessionsAdmin: () => ({ json: [] }),
      getUserCalendarHeatmapAdmin: ({ params }) => ({
        json: { from: params.$from ?? '', to: params.to ?? '', series: [], totalCount: 0 },
      }),
      getUserPreferencesAdmin: () => ({ json: factory.preferences() }),
      getServerVersion: () => ({ json: this.data.serverVersion }),
      listDatabaseBackups: () => ({ json: this.data.backups }),
      getQueuesLegacy: () => ({ json: this.data.queues }),
      getIntegrityReportSummary: () => ({ json: this.data.getIntegrityReport() }),
      createJob: () => ({ status: 201 }),

      getTimeBuckets: ({ params = {} }) => ({ json: this.data.timeBuckets(params) }),
      getTimeBucket: ({ params }) => ({ json: this.data.timeBucket(params.timeBucket, params) }),

      getAssetInfo: ({ params }) => {
        const asset = this.data.getAsset(params.id);
        return asset ? { json: this.data.assetForSharedLink(asset, params.key) } : notFound;
      },
      updateAsset: ({ params, body }) => {
        const asset = this.data.updateAsset(params.id, body);
        return asset ? { json: asset } : notFound;
      },
      updateAssets: ({ body }) => {
        this.data.updateAssets(body);
        return { status: 204 };
      },
      deleteAssets: ({ body }) => {
        this.data.deleteAssets(body.ids, body.force);
        return { status: 204 };
      },
      restoreAssets: ({ body }) => ({ json: { count: this.data.restoreAssets(body.ids) } }),
      getAssetOcr: ({ params }) => ({ json: this.data.getOcr(params.id) }),
      getAssetDuplicates: () => ({ json: this.data.duplicateList() }),

      getFaces: () => ({ json: [] }),
      createFace: () => ({ status: 201 }),
      getAllPeople: () => {
        const people = this.data.getPeople();
        return { json: { hasNextPage: false, hidden: 0, people, total: people.length } };
      },
      getPersonThumbnail: ({ params }) => ({
        body: placeholderImage(undefined, params.id),
        contentType: 'image/svg+xml',
      }),

      getStack: ({ params }) => {
        const stack = this.data.getStack(params.id);
        return stack ? { json: stack } : notFound;
      },

      getAllAlbums: ({ params = {} }) => ({ json: this.data.albumList(params.assetId) }),
      createAlbum: ({ body }) => ({ status: 201, json: this.data.createAlbum(body) }),
      deleteAlbum: ({ params }) => {
        this.data.deleteAlbum(params.id);
        return { status: 204 };
      },
      getAlbumMapMarkers: ({ params }) => ({ json: this.data.mapMarkers(params.id) }),
      getAlbumInfo: ({ params }) => {
        const album = this.data.getAlbum(params.id);
        return album ? { json: album } : notFound;
      },
      addAssetsToAlbum: ({ params, body }) => {
        this.data.addToAlbum(params.id, ...body.ids);
        return { json: body.ids.map((id) => ({ id, success: true })) };
      },

      searchMemories: ({ params = {} }) => ({ json: this.data.memoryList(params) }),
      memoriesStatistics: () => ({ json: { total: this.data.memoryList().length } }),
      getMemory: ({ params }) => {
        const memory = this.data.getMemory(params.id);
        return memory ? { json: memory } : notFound;
      },
      updateMemory: ({ params, body }) => {
        const memory = this.data.updateMemory(params.id, body);
        return memory ? { json: memory } : notFound;
      },
      deleteMemory: ({ params }) => {
        this.data.deleteMemory(params.id);
        return { status: 204 };
      },

      searchAssets: ({ body }) => ({ json: this.data.searchAssets(body) }),

      getMySharedLink: ({ params = {} }) => {
        const link = this.data.getSharedLink(params);
        if (!link) {
          return notFound;
        }
        return link.password ? passwordRequired : { json: link };
      },
      sharedLinkLogin: ({ params = {}, body }) => {
        const link = this.data.getSharedLink(params);
        if (!link) {
          return notFound;
        }
        return link.password === body.password ? { json: link } : invalidPassword;
      },
      removeSharedLinkAssets: ({ params, body }) => {
        this.data.removeSharedLinkAssets(params.id, body.assetIds);
        return { json: body.assetIds.map((assetId) => ({ assetId, success: true })) };
      },
      getDownloadInfo: ({ body }) => ({ json: this.data.downloadInfo(body) }),
      downloadArchive: () => ({
        body: emptyZip,
        contentType: 'application/zip',
        headers: { 'Content-Disposition': 'attachment; filename="immich.zip"' },
      }),

      playAssetVideo: () => ({ body: minimalMp4, contentType: 'video/mp4' }),
      viewAsset: ({ params }) => this.media(params.id),
      downloadAsset: ({ params }) => this.media(params.id),
    });
  }

  async install(page?: Page) {
    this.page = page;
    await this.api.install();
    if (page) {
      this.logger.attach(page);
      page.on('download', this.onDownload);
    }
  }

  async uninstall() {
    await this.page?.goto('about:blank');
    this.page?.off('download', this.onDownload);
    this.logger.detach();
    await this.api.uninstall();
  }

  assertClean() {
    const problems = [
      ...this.api.failures.map((line) => `handler threw: ${line}`),
      ...this.api.unhandled.map((line) => `unhandled request: ${line}`),
      ...this.api.unexpectedCalls().map((line) => `unexpected request: ${line}`),
      ...this.logger.error.unexpected().map((line) => `browser error: ${line}`),
    ];
    if (problems.length > 0) {
      throw new Error(`Mock is not clean:\n${[...new Set(problems)].map((line) => `  ${line}`).join('\n')}`);
    }
  }

  private media(assetId: string) {
    if (this.data.isBroken(assetId)) {
      return { status: 404 };
    }
    return { body: placeholderImage(this.data.getAsset(assetId), assetId), contentType: 'image/svg+xml' };
  }
}
