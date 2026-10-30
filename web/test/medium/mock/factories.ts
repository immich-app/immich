import { SeededRandom } from '#test/medium/mock/helpers.ts';
import {
  AlbumUserRole,
  AssetOrder,
  AssetTypeEnum,
  AssetVisibility,
  MemoryType,
  SharedLinkType,
  PersonUpdateStrategy,
  UserAvatarColor,
  UserStatus,
  type AlbumResponseDto,
  type AssetOcrResponseDto,
  type AssetResponseDto,
  type MemoryResponseDto,
  type PersonResponseDto,
  type SharedLinkResponseDto,
  type StackResponseDto,
  type TagResponseDto,
  type UserAdminResponseDto,
  type UserPreferencesResponseDto,
} from '@immich/sdk';
import { DateTime } from 'luxon';
import { randomUUID } from 'node:crypto';

export const adminUserId = '0d9a7a2e-0000-4000-8000-00000000ad01';

let assetIndex = 0;
let personIndex = 0;
let tagIndex = 0;
const random = new SeededRandom(7);

const names = ['Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince', 'Eve Adams', 'Frank Castle'];
const alphanumeric = (length: number) =>
  Array.from({ length }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[random.nextInt(0, 36)]).join('');
const pastDate = (maxDaysAgo: number) =>
  new Date(Date.UTC(2025, 9, 29) - random.nextInt(1, maxDaysAgo) * 86_400_000).toISOString();

export const validThumbhash = '1QcSHQRnh493V4dIh4eXh1h4kJUI';

const user = (overrides: Partial<UserAdminResponseDto> = {}): UserAdminResponseDto => {
  const createdAt = pastDate(730);
  return {
    id: randomUUID(),
    clusterGroupId: randomUUID(),
    email: 'admin@immich.cloud',
    name: 'Immich Admin',
    profileImagePath: '',
    avatarColor: UserAvatarColor.Primary,
    isAdmin: true,
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    oauthId: '',
    quotaUsageInBytes: 20_849_000_159,
    quotaSizeInBytes: null,
    shouldChangePassword: false,
    status: UserStatus.Active,
    storageLabel: 'admin',
    license: null,
    profileChangedAt: createdAt,
    ...overrides,
  };
};

const preferences = (overrides: Partial<UserPreferencesResponseDto> = {}): UserPreferencesResponseDto => ({
  albums: { defaultAssetOrder: AssetOrder.Desc },
  cast: { gCastEnabled: false },
  download: { archiveSize: 4_294_967_296, includeEmbeddedVideos: false },
  emailNotifications: { albumInvite: true, albumUpdate: true, enabled: true },
  folders: { enabled: false, sidebarWeb: false },
  memories: { enabled: true, duration: 5, sidebarWeb: false },
  people: { enabled: true, sidebarWeb: false, updateStrategy: PersonUpdateStrategy.Everyone },
  purchase: { hideBuyButtonUntil: '2100-02-12T00:00:00.000Z', showSupportBadge: false },
  ratings: { enabled: false },
  sharedLinks: { enabled: true, sidebarWeb: false },
  tags: { enabled: false, sidebarWeb: false },
  recentlyAdded: { sidebarWeb: false },
  ...overrides,
});

const asset = (overrides: Partial<AssetResponseDto> = {}): AssetResponseDto => {
  const index = assetIndex++;
  const width = overrides.width ?? random.nextInt(800, 4001);
  const height = overrides.height ?? random.nextInt(600, 3001);
  const fileCreatedAt = overrides.fileCreatedAt ?? pastDate(1000);
  const isVideo = overrides.type === AssetTypeEnum.Video;
  const originalFileName =
    overrides.originalFileName ?? `IMG_${String(index).padStart(4, '0')}.${isVideo ? 'mp4' : 'jpg'}`;

  return {
    id: randomUUID(),
    ownerId: adminUserId,
    libraryId: null,
    type: AssetTypeEnum.Image,
    originalPath: `/photos/${originalFileName}`,
    originalFileName,
    originalMimeType: isVideo ? 'video/mp4' : 'image/jpeg',
    thumbhash: validThumbhash,
    checksum: alphanumeric(28),
    createdAt: fileCreatedAt,
    updatedAt: fileCreatedAt,
    fileCreatedAt,
    fileModifiedAt: fileCreatedAt,
    localDateTime: fileCreatedAt,
    isFavorite: false,
    isArchived: false,
    isTrashed: false,
    isOffline: false,
    isEdited: false,
    hasMetadata: true,
    duration: null,
    visibility: AssetVisibility.Timeline,
    width,
    height,
    livePhotoVideoId: null,
    duplicateId: null,
    stack: null,
    people: [],
    tags: [],
    ...overrides,
    exifInfo: {
      make: 'Canon',
      model: 'EOS R5',
      exifImageWidth: width,
      exifImageHeight: height,
      fileSizeInByte: random.nextInt(100_000, 10_000_001),
      orientation: '1',
      dateTimeOriginal: fileCreatedAt,
      modifyDate: fileCreatedAt,
      timeZone: 'UTC',
      lensModel: 'RF24-70mm F2.8 L IS USM',
      fNumber: 2.8,
      focalLength: 50,
      iso: 100,
      exposureTime: '1/250',
      latitude: null,
      longitude: null,
      city: null,
      state: null,
      country: null,
      description: '',
      projectionType: null,
      rating: null,
      ...overrides.exifInfo,
    },
  };
};

const album = (overrides: Partial<AlbumResponseDto> = {}): AlbumResponseDto => {
  const createdAt = pastDate(365);
  return {
    id: randomUUID(),
    albumName: 'Test Album',
    description: '',
    albumThumbnailAssetId: null,
    albumUsers: [{ role: AlbumUserRole.Owner, user: user({ id: adminUserId }) }],
    assetCount: 0,
    createdAt,
    updatedAt: createdAt,
    hasSharedLink: false,
    isActivityEnabled: true,
    shared: false,
    order: AssetOrder.Desc,
    ...overrides,
  };
};

const memory = (overrides: Partial<MemoryResponseDto> = {}): MemoryResponseDto => {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    ownerId: adminUserId,
    type: MemoryType.OnThisDay,
    data: { year: 2024 },
    memoryAt: now,
    createdAt: now,
    updatedAt: now,
    isSaved: false,
    assets: [],
    ...overrides,
  };
};

const person = (overrides: Partial<PersonResponseDto> = {}): PersonResponseDto => {
  const id = overrides.id ?? randomUUID();
  return {
    id,
    name: names[personIndex++ % names.length],
    birthDate: null,
    isHidden: false,
    isFavorite: false,
    thumbnailPath: `/upload/thumbs/${id}.jpeg`,
    updatedAt: '2025-01-01T00:00:00.000Z',
    otherPeople: [],
    sharedBy: [],
    sharedWith: [],
    ...overrides,
  };
};

const stack = (overrides: Partial<StackResponseDto> & Pick<StackResponseDto, 'assets'>): StackResponseDto => ({
  id: randomUUID(),
  primaryAssetId: overrides.assets[0].id,
  ...overrides,
});

const ocr = (overrides: Partial<AssetOcrResponseDto> & Pick<AssetOcrResponseDto, 'assetId'>): AssetOcrResponseDto => ({
  id: randomUUID(),
  text: 'Sample text',
  boxScore: 0.95,
  textScore: 0.9,
  x1: 0.1,
  y1: 0.1,
  x2: 0.4,
  y2: 0.1,
  x3: 0.4,
  y3: 0.15,
  x4: 0.1,
  y4: 0.15,
  ...overrides,
});

const tag = (overrides: Partial<TagResponseDto> = {}): TagResponseDto => {
  const now = new Date().toISOString();
  const name = overrides.name ?? `tag-${tagIndex++}`;
  return {
    id: randomUUID(),
    name,
    value: name,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

const sharedLink = (overrides: Partial<SharedLinkResponseDto> = {}): SharedLinkResponseDto => ({
  id: randomUUID(),
  key: alphanumeric(64),
  slug: null,
  type: SharedLinkType.Individual,
  userId: adminUserId,
  description: null,
  password: null,
  expiresAt: null,
  allowDownload: true,
  allowUpload: false,
  showMetadata: true,
  assets: [],
  createdAt: new Date().toISOString(),
  ...overrides,
});

const many = <T>(count: number, build: (index: number) => T): T[] =>
  Array.from({ length: count }, (_, index) => build(index));

export type MemoryYearSpec = { year: number; assetCount: number };

const memories = (assets: AssetResponseDto[], years: MemoryYearSpec[], seed = 42): MemoryResponseDto[] => {
  const rng = new SeededRandom(seed);
  const used = new Set<string>();
  const memories: MemoryResponseDto[] = [];

  for (const { year, assetCount } of years) {
    const candidates = assets.filter(
      (asset) => DateTime.fromISO(asset.fileCreatedAt, { zone: 'utc' }).year === year && !used.has(asset.id),
    );
    if (candidates.length === 0) {
      continue;
    }
    const selected = rng
      .pickMany(candidates, Math.min(assetCount, candidates.length))
      .sort((a, b) => b.fileCreatedAt.localeCompare(a.fileCreatedAt));
    for (const asset of selected) {
      used.add(asset.id);
    }
    memories.push(memory({ assets: selected, data: { year }, memoryAt: DateTime.utc().set({ year }).toISO()! }));
  }

  return memories.sort((a, b) => b.memoryAt.localeCompare(a.memoryAt));
};

export type MonthDistribution = 'empty' | 'sparse' | 'medium' | 'dense' | 'very-dense';

export type DayPattern =
  | 'single-day'
  | 'consecutive-large'
  | 'consecutive-small'
  | 'alternating'
  | 'sparse-scattered'
  | 'start-heavy'
  | 'end-heavy'
  | 'mid-heavy';

export type MonthSpec = { year: number; month: number; distribution: MonthDistribution; pattern: DayPattern };

export type TimelineConfig = { ownerId?: string; months?: MonthSpec[]; years?: number; seed?: number };

type DayCount = { day: number; count: number };

const monthAssetCount: Record<MonthDistribution, (rng: SeededRandom) => number> = {
  empty: () => 0,
  sparse: (rng) => rng.nextInt(3, 9),
  medium: (rng) => rng.nextInt(15, 31),
  dense: (rng) => rng.nextInt(50, 81),
  'very-dense': (rng) => rng.nextInt(80, 151),
};

const aspectRatios: Array<[ratio: number, weight: number]> = [
  [4 / 3, 0.35],
  [3 / 2, 0.25],
  [16 / 9, 0.2],
  [2 / 3, 0.1],
  [1, 0.09],
  [3, 0.01],
];

const spread = (startDay: number, numDays: number, total: number): DayCount[] => {
  const perDay = Math.floor(total / numDays);
  return Array.from({ length: numDays }, (_, index) => ({
    day: startDay + index,
    count: index === numDays - 1 ? total - perDay * (numDays - 1) : perDay,
  }));
};

const randomDays = (daysInMonth: number, numDays: number, rng: SeededRandom) => {
  const days = new Set<number>();
  for (let attempt = 0; days.size < numDays && attempt < numDays * 10; attempt++) {
    days.add(rng.nextInt(1, daysInMonth + 1));
  }
  for (let day = 1; days.size < numDays; day++) {
    days.add(day);
  }
  return [...days].sort((a, b) => b - a);
};

const dayPatterns: Record<DayPattern, (daysInMonth: number, total: number, rng: SeededRandom) => DayCount[]> = {
  'single-day': (daysInMonth, total) => [{ day: Math.floor(daysInMonth / 2), count: total }],

  'consecutive-large': (daysInMonth, total, rng) => {
    const numDays = Math.max(1, Math.min(5, Math.floor(total / 15)));
    return spread(rng.nextInt(1, daysInMonth - numDays + 2), numDays, total);
  },

  'consecutive-small': (daysInMonth, total, rng) => {
    const numDays = Math.min(total, Math.floor(daysInMonth / 2));
    const startDay = rng.nextInt(1, daysInMonth - numDays + 2);
    const days: DayCount[] = [];
    let remaining = total;
    for (let index = 0; index < numDays && remaining > 0; index++) {
      const count = Math.min(rng.nextInt(1, 4), remaining);
      days.push({ day: startDay + index, count });
      remaining -= count;
    }
    return days;
  },

  alternating: (daysInMonth, total, rng) => {
    const days: DayCount[] = [];
    let remaining = total;
    let large = true;
    for (let day = 1; day <= daysInMonth && remaining > 0; day++) {
      const count = Math.min(large ? rng.nextInt(15, 26) : rng.nextInt(1, 4), remaining);
      days.push({ day, count });
      remaining -= count;
      large = !large;
    }
    return days;
  },

  'sparse-scattered': (daysInMonth, total, rng) => {
    const numDays = Math.max(1, Math.min(total, Math.floor(daysInMonth * 0.4)));
    const perDay = Math.floor(total / numDays);
    return randomDays(daysInMonth, numDays, rng).map((day, index) => ({
      day,
      count: perDay + (index === numDays - 1 ? total % numDays : 0),
    }));
  },

  'start-heavy': (daysInMonth, total) => {
    const firstWeek = Math.floor(total * 0.7);
    const rest = total - firstWeek;
    return [...spread(1, 7, firstWeek), ...(rest > 0 ? [{ day: Math.floor(daysInMonth / 2), count: rest }] : [])];
  },

  'end-heavy': (daysInMonth, total) => {
    const lastWeek = Math.floor(total * 0.7);
    const rest = total - lastWeek;
    return [...(rest > 0 ? [{ day: 2, count: rest }] : []), ...spread(daysInMonth - 6, 7, lastWeek)];
  },

  'mid-heavy': (daysInMonth, total) => {
    const middle = Math.floor(total * 0.7);
    const side = Math.floor((total - middle) / 2);
    const end = total - middle - side;
    return [
      ...(side > 0 ? [{ day: 2, count: side }] : []),
      ...spread(Math.floor(daysInMonth / 2) - 3, 7, middle),
      ...(end > 0 ? [{ day: daysInMonth - 1, count: end }] : []),
    ];
  },
};

const pickAspectRatio = (rng: SeededRandom) => {
  const roll = rng.next();
  let cumulative = 0;
  for (const [ratio, weight] of aspectRatios) {
    cumulative += weight;
    if (roll < cumulative) {
      return ratio;
    }
  }
  return 16 / 9;
};

const generateAsset = (date: DateTime, ownerId: string, rng: SeededRandom): AssetResponseDto => {
  const iso = date.toISO()!;
  const isVideo = rng.next() < 0.15;
  const ratio = pickAspectRatio(rng);
  const width = ratio >= 1 ? 4000 : 3000;
  const height = Math.round(width / ratio);
  return asset({
    ownerId,
    type: isVideo ? AssetTypeEnum.Video : AssetTypeEnum.Image,
    duration: isVideo ? rng.nextInt(5, 300) * 1000 : null,
    width,
    height,
    fileCreatedAt: iso,
    isFavorite: rng.next() < 0.1,
  });
};

const generateMonth = ({ year, month, distribution, pattern }: MonthSpec, ownerId: string, rng: SeededRandom) => {
  const daysInMonth = DateTime.utc(year, month).daysInMonth!;
  const total = monthAssetCount[distribution](rng);
  if (total === 0) {
    return [];
  }
  const assets: AssetResponseDto[] = [];
  for (const { day, count } of dayPatterns[pattern](daysInMonth, total, rng)) {
    const start = DateTime.utc(year, month, Math.min(Math.max(day, 1), daysInMonth));
    for (let index = 0; index < count; index++) {
      assets.push(generateAsset(start.plus({ seconds: rng.nextInt(0, 86_400) }), ownerId, rng));
    }
  }
  return assets;
};

const defaultMonths = (): MonthSpec[] => {
  const months: MonthSpec[] = [
    { year: 2024, month: 12, distribution: 'very-dense', pattern: 'alternating' },
    { year: 2024, month: 11, distribution: 'dense', pattern: 'consecutive-large' },
    { year: 2024, month: 10, distribution: 'medium', pattern: 'mid-heavy' },
    { year: 2024, month: 9, distribution: 'sparse', pattern: 'consecutive-small' },
    { year: 2024, month: 8, distribution: 'empty', pattern: 'single-day' },
    { year: 2024, month: 7, distribution: 'dense', pattern: 'start-heavy' },
    { year: 2024, month: 6, distribution: 'medium', pattern: 'sparse-scattered' },
    { year: 2024, month: 5, distribution: 'sparse', pattern: 'single-day' },
    { year: 2024, month: 4, distribution: 'very-dense', pattern: 'consecutive-large' },
    { year: 2024, month: 3, distribution: 'empty', pattern: 'single-day' },
    { year: 2024, month: 2, distribution: 'medium', pattern: 'end-heavy' },
    { year: 2024, month: 1, distribution: 'dense', pattern: 'alternating' },
    { year: 2023, month: 12, distribution: 'very-dense', pattern: 'end-heavy' },
    { year: 2023, month: 11, distribution: 'sparse', pattern: 'consecutive-small' },
    { year: 2023, month: 10, distribution: 'empty', pattern: 'single-day' },
    { year: 2023, month: 9, distribution: 'medium', pattern: 'alternating' },
    { year: 2023, month: 8, distribution: 'dense', pattern: 'mid-heavy' },
    { year: 2023, month: 7, distribution: 'sparse', pattern: 'sparse-scattered' },
    { year: 2023, month: 6, distribution: 'medium', pattern: 'consecutive-large' },
    { year: 2023, month: 5, distribution: 'empty', pattern: 'single-day' },
    { year: 2023, month: 4, distribution: 'sparse', pattern: 'single-day' },
    { year: 2023, month: 3, distribution: 'dense', pattern: 'start-heavy' },
    { year: 2023, month: 2, distribution: 'medium', pattern: 'alternating' },
    { year: 2023, month: 1, distribution: 'very-dense', pattern: 'consecutive-large' },
  ];

  for (let year = 2022; year >= 2000; year--) {
    for (let month = 12; month >= 1; month--) {
      months.push({ year, month, distribution: 'medium', pattern: 'sparse-scattered' });
    }
  }

  return months;
};

const timeline = (config: TimelineConfig = {}): AssetResponseDto[] => {
  const rng = new SeededRandom(config.seed ?? 42);
  const ownerId = config.ownerId ?? adminUserId;
  const months = config.months ?? defaultMonths();
  const newestYear = Math.max(...months.map(({ year }) => year));
  return months
    .filter(({ year }) => config.years === undefined || year > newestYear - config.years)
    .flatMap((spec) => generateMonth(spec, ownerId, new SeededRandom(rng.nextInt(0, 1_000_000))))
    .sort((a, b) => b.fileCreatedAt.localeCompare(a.fileCreatedAt));
};

export const factory = {
  user,
  preferences,
  asset,
  album,
  memory,
  person,
  stack,
  ocr,
  tag,
  sharedLink,
  memories,
  timeline,
  many,
};
