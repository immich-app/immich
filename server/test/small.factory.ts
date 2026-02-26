import {
  Activity,
  Album,
  ApiKey,
  AssetFace,
  AssetFile,
  AuthApiKey,
  AuthSharedLink,
  AuthUser,
  Exif,
  Library,
  Memory,
  Partner,
  Person,
  Session,
  Stack,
  Tag,
  User,
  UserAdmin,
} from 'src/database';
import { MapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetEditAction, AssetEditActionItem, MirrorAxis } from 'src/dtos/editing.dto';
import { QueueStatisticsDto } from 'src/dtos/queue.dto';
import {
  AssetFileType,
  AssetOrder,
  AssetStatus,
  AssetType,
  AssetVisibility,
  MemoryType,
  Permission,
  SourceType,
  UserMetadataKey,
  UserStatus,
} from 'src/enum';
import { DeepPartial, OnThisDayData, UserMetadataItem } from 'src/types';
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
    allowUpload = false,
    allowDownload = true,
    password = null,
  } = sharedLink;

  return { id, expiresAt, userId, showExif, allowUpload, allowDownload, password };
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

const partnerFactory = (partner: Partial<Partner> = {}) => {
  const sharedBy = userFactory(partner.sharedBy || {});
  const sharedWith = userFactory(partner.sharedWith || {});

  return {
    sharedById: sharedBy.id,
    sharedBy,
    sharedWithId: sharedWith.id,
    sharedWith,
    createId: newUuidV7(),
    createdAt: newDate(),
    updatedAt: newDate(),
    updateId: newUuidV7(),
    inTimeline: true,
    ...partner,
  };
};

const sessionFactory = (session: Partial<Session> = {}) => ({
  id: newUuid(),
  createdAt: newDate(),
  updatedAt: newDate(),
  updateId: newUuidV7(),
  deviceOS: 'android',
  deviceType: 'mobile',
  token: Buffer.from('abc123'),
  parentId: null,
  expiresAt: null,
  userId: newUuid(),
  pinExpiresAt: newDate(),
  isPendingSyncReset: false,
  appVersion: session.appVersion ?? null,
  ...session,
});

const queueStatisticsFactory = (dto?: Partial<QueueStatisticsDto>) => ({
  active: 0,
  completed: 0,
  failed: 0,
  delayed: 0,
  waiting: 0,
  paused: 0,
  ...dto,
});

const stackFactory = ({ owner, assets, ...stack }: DeepPartial<Stack> = {}): Stack => {
  const ownerId = newUuid();

  return {
    id: newUuid(),
    primaryAssetId: assets?.[0].id ?? newUuid(),
    ownerId,
    owner: userFactory(owner ?? { id: ownerId }),
    assets: assets?.map((asset) => assetFactory(asset)) ?? [],
    ...stack,
  };
};

const userFactory = (user: Partial<User> = {}) => ({
  id: newUuid(),
  name: 'Test User',
  email: 'test@immich.cloud',
  avatarColor: null,
  profileImagePath: '',
  profileChangedAt: newDate(),
  metadata: [
    {
      key: UserMetadataKey.Onboarding,
      value: 'true',
    },
  ] as UserMetadataItem[],
  ...user,
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

const assetFactory = (
  asset: Omit<DeepPartial<MapAsset>, 'exifInfo' | 'owner' | 'stack' | 'tags' | 'faces' | 'files' | 'edits'> = {},
) => {
  return {
    id: newUuid(),
    createdAt: newDate(),
    updatedAt: newDate(),
    deletedAt: null,
    updateId: newUuidV7(),
    status: AssetStatus.Active,
    checksum: newSha1(),
    deviceAssetId: '',
    deviceId: '',
    duplicateId: null,
    duration: null,
    encodedVideoPath: null,
    fileCreatedAt: newDate(),
    fileModifiedAt: newDate(),
    isExternal: false,
    isFavorite: false,
    isOffline: false,
    libraryId: null,
    livePhotoVideoId: null,
    localDateTime: newDate(),
    originalFileName: 'IMG_123.jpg',
    originalPath: `/data/12/34/IMG_123.jpg`,
    ownerId: newUuid(),
    stackId: null,
    thumbhash: null,
    type: AssetType.Image,
    visibility: AssetVisibility.Timeline,
    width: null,
    height: null,
    isEdited: false,
    ...asset,
  };
};

const activityFactory = (activity: Partial<Activity> = {}) => {
  const userId = activity.userId || newUuid();
  return {
    id: newUuid(),
    comment: null,
    isLiked: false,
    userId,
    user: userFactory({ id: userId }),
    assetId: newUuid(),
    albumId: newUuid(),
    createdAt: newDate(),
    updatedAt: newDate(),
    updateId: newUuidV7(),
    ...activity,
  };
};

const apiKeyFactory = (apiKey: Partial<ApiKey> = {}) => ({
  id: newUuid(),
  userId: newUuid(),
  createdAt: newDate(),
  updatedAt: newDate(),
  updateId: newUuidV7(),
  name: 'Api Key',
  permissions: [Permission.All],
  ...apiKey,
});

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

const memoryFactory = (memory: Partial<Memory> = {}) => ({
  id: newUuid(),
  createdAt: newDate(),
  updatedAt: newDate(),
  updateId: newUuidV7(),
  deletedAt: null,
  ownerId: newUuid(),
  type: MemoryType.OnThisDay,
  data: { year: 2024 } as OnThisDayData,
  isSaved: false,
  memoryAt: newDate(),
  seenAt: null,
  showAt: newDate(),
  hideAt: newDate(),
  assets: [],
  ...memory,
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

const assetFileFactory = (file: Partial<AssetFile> = {}) => ({
  id: newUuid(),
  type: AssetFileType.Preview,
  path: '/uploads/user-id/thumbs/path.jpg',
  isEdited: false,
  isProgressive: false,
  ...file,
});

const exifFactory = (exif: Partial<Exif> = {}) => ({
  assetId: newUuid(),
  autoStackId: null,
  bitsPerSample: null,
  city: 'Austin',
  colorspace: null,
  country: 'United States of America',
  dateTimeOriginal: newDate(),
  description: '',
  exifImageHeight: 420,
  exifImageWidth: 42,
  exposureTime: null,
  fileSizeInByte: 69,
  fNumber: 1.7,
  focalLength: 4.38,
  fps: null,
  iso: 947,
  latitude: 30.267_334_570_570_195,
  longitude: -97.789_833_534_282_07,
  lensModel: null,
  livePhotoCID: null,
  make: 'Google',
  model: 'Pixel 7',
  modifyDate: newDate(),
  orientation: '1',
  profileDescription: null,
  projectionType: null,
  rating: 4,
  state: 'Texas',
  tags: ['parent/child'],
  timeZone: 'UTC-6',
  ...exif,
});

const tagFactory = (tag: Partial<Tag>): Tag => ({
  id: newUuid(),
  color: null,
  createdAt: newDate(),
  parentId: null,
  updatedAt: newDate(),
  value: `tag-${newUuid()}`,
  ...tag,
});

const faceFactory = ({ person, ...face }: DeepPartial<AssetFace> = {}): AssetFace => ({
  assetId: newUuid(),
  boundingBoxX1: 1,
  boundingBoxX2: 2,
  boundingBoxY1: 1,
  boundingBoxY2: 2,
  deletedAt: null,
  id: newUuid(),
  imageHeight: 420,
  imageWidth: 42,
  isVisible: true,
  personId: null,
  sourceType: SourceType.MachineLearning,
  updatedAt: newDate(),
  updateId: newUuidV7(),
  person: person === null ? null : personFactory(person),
  ...face,
});

const assetEditFactory = (edit?: Partial<AssetEditActionItem>): AssetEditActionItem => {
  switch (edit?.action) {
    case AssetEditAction.Crop: {
      return { action: AssetEditAction.Crop, parameters: { height: 42, width: 42, x: 0, y: 10 }, ...edit };
    }
    case AssetEditAction.Mirror: {
      return { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal }, ...edit };
    }
    case AssetEditAction.Rotate: {
      return { action: AssetEditAction.Rotate, parameters: { angle: 90 }, ...edit };
    }
    default: {
      return { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } };
    }
  }
};

const personFactory = (person?: Partial<Person>): Person => ({
  birthDate: newDate(),
  color: null,
  createdAt: newDate(),
  faceAssetId: null,
  id: newUuid(),
  isFavorite: false,
  isHidden: false,
  name: 'person',
  ownerId: newUuid(),
  thumbnailPath: '/path/to/person/thumbnail.jpg',
  updatedAt: newDate(),
  updateId: newUuidV7(),
  ...person,
});

const albumFactory = (album?: Partial<Omit<Album, 'assets'>>) => ({
  albumName: 'My Album',
  albumThumbnailAssetId: null,
  albumUsers: [],
  assets: [],
  createdAt: newDate(),
  deletedAt: null,
  description: 'Album description',
  id: newUuid(),
  isActivityEnabled: false,
  order: AssetOrder.Desc,
  ownerId: newUuid(),
  sharedLinks: [],
  updatedAt: newDate(),
  updateId: newUuidV7(),
  ...album,
});

export const factory = {
  activity: activityFactory,
  apiKey: apiKeyFactory,
  asset: assetFactory,
  assetFile: assetFileFactory,
  assetOcr: assetOcrFactory,
  auth: authFactory,
  authApiKey: authApiKeyFactory,
  authUser: authUserFactory,
  library: libraryFactory,
  memory: memoryFactory,
  partner: partnerFactory,
  queueStatistics: queueStatisticsFactory,
  session: sessionFactory,
  stack: stackFactory,
  user: userFactory,
  userAdmin: userAdminFactory,
  versionHistory: versionHistoryFactory,
  jobAssets: {
    sidecarWrite: assetSidecarWriteFactory,
  },
  exif: exifFactory,
  face: faceFactory,
  person: personFactory,
  assetEdit: assetEditFactory,
  tag: tagFactory,
  album: albumFactory,
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
