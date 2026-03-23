import {
  Activity,
  Album,
  ApiKey,
  AuthApiKey,
  AuthSharedLink,
  AuthUser,
  Exif,
  Library,
  Partner,
  Person,
  Session,
  SharedSpace,
  SharedSpaceActivity,
  SharedSpaceLibrary,
  SharedSpaceMember,
  SharedSpacePerson,
  SharedSpacePersonAlias,
  SharedSpacePersonFace,
  Tag,
  User,
  UserAdmin,
  UserGroup,
  UserGroupMember,
} from 'src/database';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetEditAction, AssetEditActionItem, MirrorAxis } from 'src/dtos/editing.dto';
import { QueueStatisticsDto } from 'src/dtos/queue.dto';
import { AssetFileType, AssetOrder, Permission, SharedSpaceRole, UserMetadataKey, UserStatus } from 'src/enum';
import { UserMetadataItem } from 'src/types';
import { UserFactory } from 'test/factories/user.factory';
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

const partnerFactory = ({
  sharedBy: sharedByProvided,
  sharedWith: sharedWithProvided,
  ...partner
}: Partial<Partner> = {}) => {
  const sharedBy = UserFactory.create((sharedByProvided as any) ?? {});
  const sharedWith = UserFactory.create((sharedWithProvided as any) ?? {});

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

const activityFactory = (activity: Partial<Activity> = {}) => {
  const userId = activity.userId || newUuid();
  return {
    id: newUuid(),
    comment: null,
    isLiked: false,
    userId,
    user: UserFactory.create({ id: userId }),
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

const tagFactory = (tag: Partial<Tag>): Tag => ({
  id: newUuid(),
  color: null,
  createdAt: newDate(),
  parentId: null,
  updatedAt: newDate(),
  value: `tag-${newUuid()}`,
  ...tag,
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
  species: null,
  thumbnailPath: '/path/to/person/thumbnail.jpg',
  type: 'person',
  updatedAt: newDate(),
  updateId: newUuidV7(),
  ...person,
});

const sharedSpaceFactory = (data: Partial<SharedSpace> = {}): SharedSpace => ({
  id: newUuid(),
  name: 'Test Space',
  description: null,
  createdById: newUuid(),
  thumbnailAssetId: null,
  color: 'primary',
  thumbnailCropY: null,
  faceRecognitionEnabled: true,
  lastActivityAt: null,
  createdAt: newDate(),
  updatedAt: newDate(),
  createId: newUuid(),
  updateId: newUuid(),
  ...data,
});

const sharedSpaceMemberFactory = (data: Partial<SharedSpaceMember> = {}): SharedSpaceMember => ({
  spaceId: newUuid(),
  userId: newUuid(),
  role: SharedSpaceRole.Viewer,
  joinedAt: newDate(),
  showInTimeline: true,
  lastViewedAt: null,
  ...data,
});

const sharedSpaceActivityFactory = (data: Partial<SharedSpaceActivity> = {}): SharedSpaceActivity => ({
  id: newUuid(),
  spaceId: newUuid(),
  userId: newUuid(),
  type: 'asset_add',
  data: {},
  createdAt: newDate(),
  ...data,
});

const sharedSpacePersonFactory = (data: Partial<SharedSpacePerson> = {}): SharedSpacePerson => ({
  id: newUuid(),
  spaceId: newUuid(),
  name: '',
  representativeFaceId: null,
  thumbnailPath: '',
  isHidden: false,
  birthDate: null,
  createdAt: newDate(),
  updatedAt: newDate(),
  updateId: newUuidV7(),
  ...data,
});

const sharedSpacePersonFaceFactory = (data: Partial<SharedSpacePersonFace> = {}): SharedSpacePersonFace => ({
  personId: newUuid(),
  assetFaceId: newUuid(),
  ...data,
});

const sharedSpacePersonAliasFactory = (data: Partial<SharedSpacePersonAlias> = {}): SharedSpacePersonAlias => ({
  personId: newUuid(),
  userId: newUuid(),
  alias: 'Alias Name',
  ...data,
});

const sharedSpaceLibraryFactory = (data: Partial<SharedSpaceLibrary> = {}): SharedSpaceLibrary => ({
  spaceId: newUuid(),
  libraryId: newUuid(),
  addedById: newUuid(),
  createdAt: newDate(),
  ...data,
});

const userGroupFactory = (data: Partial<UserGroup> = {}): UserGroup => ({
  id: newUuid(),
  name: 'Test Group',
  color: null,
  origin: 'manual',
  createdById: newUuid(),
  createdAt: newDate(),
  updatedAt: newDate(),
  createId: newUuid(),
  updateId: newUuid(),
  ...data,
});

const userGroupMemberFactory = (data: Partial<UserGroupMember> = {}): UserGroupMember => ({
  groupId: newUuid(),
  userId: newUuid(),
  addedAt: newDate(),
  ...data,
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
  authUser: authUserFactory,
  authApiKey: authApiKeyFactory,
  assetOcr: assetOcrFactory,
  auth: authFactory,
  library: libraryFactory,
  partner: partnerFactory,
  queueStatistics: queueStatisticsFactory,
  session: sessionFactory,
  user: userFactory,
  userAdmin: userAdminFactory,
  versionHistory: versionHistoryFactory,
  jobAssets: {
    sidecarWrite: assetSidecarWriteFactory,
  },
  person: personFactory,
  assetEdit: assetEditFactory,
  sharedSpace: sharedSpaceFactory,
  sharedSpaceMember: sharedSpaceMemberFactory,
  sharedSpaceActivity: sharedSpaceActivityFactory,
  sharedSpacePerson: sharedSpacePersonFactory,
  sharedSpacePersonFace: sharedSpacePersonFaceFactory,
  sharedSpacePersonAlias: sharedSpacePersonAliasFactory,
  sharedSpaceLibrary: sharedSpaceLibraryFactory,
  userGroup: userGroupFactory,
  userGroupMember: userGroupMemberFactory,
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
