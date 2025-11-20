import { BrowserContext } from '@playwright/test';
import { playwrightHost } from 'playwright.config';

export const setupBaseMockApiRoutes = async (context: BrowserContext, adminUserId: string) => {
  await context.addCookies([
    {
      name: 'immich_is_authenticated',
      value: 'true',
      domain: playwrightHost,
      path: '/',
    },
  ]);
  await context.route('**/api/users/me', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        id: adminUserId,
        email: 'admin@immich.cloud',
        name: 'Immich Admin',
        profileImagePath: '',
        avatarColor: 'orange',
        profileChangedAt: '2025-01-22T21:31:23.996Z',
        storageLabel: 'admin',
        shouldChangePassword: true,
        isAdmin: true,
        createdAt: '2025-01-22T21:31:23.996Z',
        deletedAt: null,
        updatedAt: '2025-11-14T00:00:00.369Z',
        oauthId: '',
        quotaSizeInBytes: null,
        quotaUsageInBytes: 20_849_000_159,
        status: 'active',
        license: null,
      },
    });
  });
  await context.route('**/users/me/preferences', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        albums: {
          defaultAssetOrder: 'desc',
        },
        folders: {
          enabled: false,
          sidebarWeb: false,
        },
        memories: {
          enabled: true,
          duration: 5,
        },
        people: {
          enabled: true,
          sidebarWeb: false,
        },
        sharedLinks: {
          enabled: true,
          sidebarWeb: false,
        },
        ratings: {
          enabled: false,
        },
        tags: {
          enabled: false,
          sidebarWeb: false,
        },
        emailNotifications: {
          enabled: true,
          albumInvite: true,
          albumUpdate: true,
        },
        download: {
          archiveSize: 4_294_967_296,
          includeEmbeddedVideos: false,
        },
        purchase: {
          showSupportBadge: true,
          hideBuyButtonUntil: '2100-02-12T00:00:00.000Z',
        },
        cast: {
          gCastEnabled: false,
        },
      },
    });
  });
  await context.route('**/server/about', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        version: 'v2.2.3',
        versionUrl: 'https://github.com/immich-app/immich/releases/tag/v2.2.3',
        licensed: false,
        build: '1234567890',
        buildUrl: 'https://github.com/immich-app/immich/actions/runs/1234567890',
        buildImage: 'e2e',
        buildImageUrl: 'https://github.com/immich-app/immich/pkgs/container/immich-server',
        repository: 'immich-app/immich',
        repositoryUrl: 'https://github.com/immich-app/immich',
        sourceRef: 'e2e',
        sourceCommit: 'e2eeeeeeeeeeeeeeeeee',
        sourceUrl: 'https://github.com/immich-app/immich/commit/e2eeeeeeeeeeeeeeeeee',
        nodejs: 'v22.18.0',
        exiftool: '13.41',
        ffmpeg: '7.1.1-6',
        libvips: '8.17.2',
        imagemagick: '7.1.2-2',
      },
    });
  });
  await context.route('**/api/server/features', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        smartSearch: false,
        facialRecognition: false,
        duplicateDetection: false,
        map: true,
        reverseGeocoding: true,
        importFaces: false,
        sidecar: true,
        search: true,
        trash: true,
        oauth: false,
        oauthAutoLaunch: false,
        ocr: false,
        passwordLogin: true,
        configFile: false,
        email: false,
      },
    });
  });
  await context.route('**/api/server/config', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        loginPageMessage: '',
        trashDays: 30,
        userDeleteDelay: 7,
        oauthButtonText: 'Login with OAuth',
        isInitialized: true,
        isOnboarded: true,
        externalDomain: '',
        publicUsers: true,
        mapDarkStyleUrl: 'https://tiles.immich.cloud/v1/style/dark.json',
        mapLightStyleUrl: 'https://tiles.immich.cloud/v1/style/light.json',
        maintenanceMode: false,
      },
    });
  });
  await context.route('**/api/server/media-types', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        video: [
          '.3gp',
          '.3gpp',
          '.avi',
          '.flv',
          '.insv',
          '.m2t',
          '.m2ts',
          '.m4v',
          '.mkv',
          '.mov',
          '.mp4',
          '.mpe',
          '.mpeg',
          '.mpg',
          '.mts',
          '.vob',
          '.webm',
          '.wmv',
        ],
        image: [
          '.3fr',
          '.ari',
          '.arw',
          '.cap',
          '.cin',
          '.cr2',
          '.cr3',
          '.crw',
          '.dcr',
          '.dng',
          '.erf',
          '.fff',
          '.iiq',
          '.k25',
          '.kdc',
          '.mrw',
          '.nef',
          '.nrw',
          '.orf',
          '.ori',
          '.pef',
          '.psd',
          '.raf',
          '.raw',
          '.rw2',
          '.rwl',
          '.sr2',
          '.srf',
          '.srw',
          '.x3f',
          '.avif',
          '.gif',
          '.jpeg',
          '.jpg',
          '.png',
          '.webp',
          '.bmp',
          '.heic',
          '.heif',
          '.hif',
          '.insp',
          '.jp2',
          '.jpe',
          '.jxl',
          '.svg',
          '.tif',
          '.tiff',
        ],
        sidecar: ['.xmp'],
      },
    });
  });
  await context.route('**/api/notifications*', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: [],
    });
  });
  await context.route('**/api/albums*', async (route, request) => {
    if (request.url().endsWith('albums?shared=true') || request.url().endsWith('albums')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: [],
      });
    }
    await route.fallback();
  });
  await context.route('**/api/memories*', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: [],
    });
  });
  await context.route('**/api/server/storage', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        diskSize: '100.0 GiB',
        diskUse: '74.4 GiB',
        diskAvailable: '25.6 GiB',
        diskSizeRaw: 107_374_182_400,
        diskUseRaw: 79_891_660_800,
        diskAvailableRaw: 27_482_521_600,
        diskUsagePercentage: 74.4,
      },
    });
  });
  await context.route('**/api/server/version-history', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: [
        {
          id: 'd1fbeadc-cb4f-4db3-8d19-8c6a921d5d8e',
          createdAt: '2025-11-15T20:14:01.935Z',
          version: '2.2.3',
        },
      ],
    });
  });
};
