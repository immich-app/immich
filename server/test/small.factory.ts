import { AuthApiKey, AuthSharedLink, AuthUser, Exif, Library, UserAdmin } from 'src/database';
import { AuthDto } from 'src/dtos/auth.dto';
import { QueueStatisticsDto } from 'src/dtos/queue.dto';
import { AssetFileType, Permission, UserStatus } from 'src/enum';
import { v4, v7 } from 'uuid';

export const newUuid = () => v4();
export const newUuids = () =>
  Array.from({ length: 100 })
    .fill(0)
    .map(() => newUuid());
export const newDate = () => new Date();
export const newUuidV7 = () => v7();
export const newSha1 = () => Buffer.from('this is a fake hash');
export const newEmbedding = () => {
  const embedding = Array.from({ length: 512 })
    .fill(0)
    .map(() => Math.random());
  return '[' + embedding + ']';
};

const authFactory = ({
  apiKey,
  session,
  sharedLink,
  user,
}: {
  apiKey?: Partial<AuthApiKey>;
  session?: { id: string };
  user?: Omit<
    Partial<UserAdmin>,
    'createdAt' | 'updatedAt' | 'deletedAt' | 'fileCreatedAt' | 'fileModifiedAt' | 'localDateTime' | 'profileChangedAt'
  >;
  sharedLink?: Partial<AuthSharedLink>;
} = {}) => {
  const auth: AuthDto = {
    user: authUserFactory(userAdminFactory(user ?? {})),
  };

  const userId = auth.user.id;

  if (apiKey) {
    auth.apiKey = authApiKeyFactory(apiKey);
  }

  if (session) {
    auth.session = {
      id: session.id,
      hasElevatedPermission: false,
    };
  }

  if (sharedLink) {
    auth.sharedLink = authSharedLinkFactory({ ...sharedLink, userId });
  }

  return auth;
};

const authSharedLinkFactory = (sharedLink: Partial<AuthSharedLink> = {}) => {
  const {
    id = newUuid(),
    expiresAt = null,
    userId = newUuid(),
    showExif = true,
    albumId = null,
    allowUpload = false,
    allowDownload = true,
    password = null,
  } = sharedLink;

  return {
    id,
    albumId,
    expiresAt,
    userId,
    showExif,
    allowUpload,
    allowDownload,
    password,
  };
};

const authApiKeyFactory = (apiKey: Partial<AuthApiKey> = {}) => ({
  id: newUuid(),
  permissions: [Permission.All],
  ...apiKey,
});

const authUserFactory = (authUser: Partial<AuthUser> = {}) => {
  const {
    id = newUuid(),
    isAdmin = false,
    name = 'Test User',
    email = 'test@immich.cloud',
    quotaUsageInBytes = 0,
    quotaSizeInBytes = null,
  } = authUser;

  return { id, isAdmin, name, email, quotaUsageInBytes, quotaSizeInBytes };
};

const queueStatisticsFactory = (dto?: Partial<QueueStatisticsDto>) => ({
  active: 0,
  completed: 0,
  failed: 0,
  delayed: 0,
  waiting: 0,
  paused: 0,
  ...dto,
});

const userAdminFactory = (user: Partial<UserAdmin> = {}) => {
  const {
    id = newUuid(),
    name = 'Test User',
    email = 'test@immich.cloud',
    profileImagePath = '',
    profileChangedAt = newDate(),
    storageLabel = null,
    shouldChangePassword = false,
    isAdmin = false,
    avatarColor = null,
    createdAt = newDate(),
    updatedAt = newDate(),
    deletedAt = null,
    oauthId = '',
    quotaSizeInBytes = null,
    quotaUsageInBytes = 0,
    status = UserStatus.Active,
    metadata = [],
  } = user;
  return {
    id,
    name,
    email,
    profileImagePath,
    profileChangedAt,
    storageLabel,
    shouldChangePassword,
    isAdmin,
    avatarColor,
    createdAt,
    updatedAt,
    deletedAt,
    oauthId,
    quotaSizeInBytes,
    quotaUsageInBytes,
    status,
    metadata,
  };
};

const libraryFactory = (library: Partial<Library> = {}) => ({
  id: newUuid(),
  createdAt: newDate(),
  updatedAt: newDate(),
  updateId: newUuidV7(),
  deletedAt: null,
  refreshedAt: null,
  name: 'Library',
  assets: [],
  ownerId: newUuid(),
  importPaths: [],
  exclusionPatterns: [],
  ...library,
});

const versionHistoryFactory = () => ({
  id: newUuid(),
  createdAt: newDate(),
  version: '1.123.45',
});

const assetSidecarWriteFactory = () => {
  const id = newUuid();
  return {
    id,
    originalPath: '/path/to/original-path.jpg.xmp',
    tags: [],
    files: [
      {
        id: newUuid(),
        path: '/path/to/original-path.jpg.xmp',
        type: AssetFileType.Sidecar,
        isEdited: false,
      },
    ],
    exifInfo: {
      assetId: id,
      description: 'this is a description',
      latitude: 12,
      longitude: 12,
      dateTimeOriginal: '2023-11-22T04:56:12.196Z',
      timeZone: 'UTC-6',
    } as unknown as Exif,
  };
};

const assetOcrFactory = (
  ocr: {
    id?: string;
    assetId?: string;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    x3?: number;
    y3?: number;
    x4?: number;
    y4?: number;
    boxScore?: number;
    textScore?: number;
    text?: string;
    isVisible?: boolean;
  } = {},
) => ({
  id: newUuid(),
  assetId: newUuid(),
  x1: 0.1,
  y1: 0.2,
  x2: 0.3,
  y2: 0.2,
  x3: 0.3,
  y3: 0.4,
  x4: 0.1,
  y4: 0.4,
  boxScore: 0.95,
  textScore: 0.92,
  text: 'Sample Text',
  isVisible: true,
  ...ocr,
});

export const factory = {
  assetOcr: assetOcrFactory,
  auth: authFactory,
  library: libraryFactory,
  queueStatistics: queueStatisticsFactory,
  versionHistory: versionHistoryFactory,
  jobAssets: {
    sidecarWrite: assetSidecarWriteFactory,
  },
  uuid: newUuid,
  buffer: () => Buffer.from('this is a fake buffer'),
  date: newDate,
  responses: {
    badRequest: (message: any = null) => ({
      error: 'Bad Request',
      statusCode: 400,
      message: message ?? expect.anything(),
    }),
  },
};
