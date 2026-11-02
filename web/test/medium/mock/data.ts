import { adminUserId, factory, type TimelineConfig } from '#test/medium/mock/factories.ts';
import { SeededRandom } from '#test/medium/mock/helpers.ts';
import { payload } from '#test/medium/mock/payloads.ts';
import type { ResponseOf } from '#test/medium/mock/types.ts';
import {
  AssetOrder,
  AssetTypeEnum,
  AssetVisibility,
  type AlbumResponseDto,
  type AssetBulkUpdateDto,
  type AssetOcrResponseDto,
  type AssetResponseDto,
  type CreateAlbumDto,
  type DownloadInfoDto,
  type DuplicateResponseDto,
  type MapMarkerResponseDto,
  type MemoryResponseDto,
  type MemoryUpdateDto,
  type MetadataSearchDto,
  type PersonResponseDto,
  type SearchResponseDto,
  type SharedLinkResponseDto,
  type StackResponseDto,
  type TimeBucketAssetResponseDto,
  type TimeBucketsResponseDto,
  type UpdateAssetDto,
  type UserAdminCreateDto,
  type UserAdminResponseDto,
  type UserAdminUpdateDto,
  type UserPreferencesResponseDto,
} from '@immich/sdk';
import { randomUUID } from 'node:crypto';

export type TimelineFilter = {
  albumId?: string;
  isFavorite?: boolean;
  isTrashed?: boolean;
  visibility?: AssetVisibility;
  order?: AssetOrder;
};

export type MemoryFilter = {
  id?: string;
  page?: number;
  size?: number;
};

const monthKey = (iso: string) => {
  const date = new Date(iso);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
};

const hiddenVisibilities = new Set<AssetVisibility>([AssetVisibility.Hidden, AssetVisibility.Locked]);

export class MockData {
  readonly user = factory.user({ id: adminUserId });
  readonly serverConfig = payload.serverConfig();
  readonly publicConfig = payload.publicConfig();
  readonly userConfig = payload.userConfig();
  readonly serverFeatures = payload.serverFeatures();
  readonly aboutInfo = payload.aboutInfo();
  readonly storage = payload.storage();
  readonly versionHistory = payload.versionHistory();
  readonly mediaTypes = payload.mediaTypes();
  readonly adminConfig = payload.adminConfig();
  readonly serverVersion = payload.serverVersion();
  readonly queues = payload.queues();
  readonly notifications = payload.notifications();
  readonly backups = payload.backups();

  private preferences = factory.preferences();
  private integrityReport = payload.integrityReport();
  private readonly users = new Map<string, UserAdminResponseDto>([[this.user.id, this.user]]);
  private readonly assets = new Map<string, AssetResponseDto>();
  private readonly albums = new Map<string, AlbumResponseDto>();
  private readonly albumAssets = new Map<string, Set<string>>();
  private readonly memories = new Map<string, MemoryResponseDto>();
  private readonly people = new Map<string, PersonResponseDto>();
  private readonly stacks = new Map<string, StackResponseDto>();
  private readonly ocr = new Map<string, AssetOcrResponseDto[]>();
  private readonly brokenAssetIds = new Set<string>();
  private readonly sharedLinks = new Map<string, SharedLinkResponseDto>();

  getPreferences() {
    return this.preferences;
  }

  getIntegrityReport() {
    return this.integrityReport;
  }

  updateIntegrityReport(report: Partial<ResponseOf<'getIntegrityReportSummary'>>) {
    this.integrityReport = { ...this.integrityReport, ...report };
  }

  setPreferences(preferences: UserPreferencesResponseDto) {
    this.preferences = preferences;
    return this;
  }

  getAsset(id: string) {
    return this.assets.get(id);
  }

  getStack(id: string) {
    return this.stacks.get(id);
  }

  getMemory(id: string) {
    return this.memories.get(id);
  }

  getPeople() {
    return [...this.people.values()];
  }

  getOcr(assetId: string) {
    return this.ocr.get(assetId) ?? [];
  }

  isBroken(assetId: string) {
    return this.brokenAssetIds.has(assetId);
  }

  markBroken(...assets: Array<Pick<AssetResponseDto, 'id'>>) {
    for (const { id } of assets) {
      this.brokenAssetIds.add(id);
    }
    return this;
  }

  addSharedLink(link: SharedLinkResponseDto) {
    this.sharedLinks.set(link.id, link);
    this.addAssets(...link.assets);
    return this;
  }

  getSharedLink({ id, key, slug }: { id?: string; key?: string; slug?: string }) {
    for (const link of this.sharedLinks.values()) {
      if (
        (id !== undefined && link.id === id) ||
        (key !== undefined && link.key === key) ||
        (slug !== undefined && link.slug === slug)
      ) {
        return { ...link, album: link.album ? this.getAlbum(link.album.id) : undefined };
      }
    }
  }

  removeSharedLinkAssets(id: string, assetIds: string[]) {
    const link = this.sharedLinks.get(id);
    if (!link) {
      return;
    }
    const updated = { ...link, assets: link.assets.filter((asset) => !assetIds.includes(asset.id)) };
    this.sharedLinks.set(id, updated);
    return updated;
  }

  assetForSharedLink(asset: AssetResponseDto, key?: string) {
    const link = key === undefined ? undefined : this.getSharedLink({ key });
    if (!link || link.showMetadata) {
      return asset;
    }
    return { ...asset, hasMetadata: false, exifInfo: undefined, people: [] };
  }

  downloadInfo({ assetIds, albumId }: DownloadInfoDto) {
    const ids = assetIds ?? (albumId ? this.timelineAssets({ albumId }).map(({ id }) => id) : []);
    const size = ids.reduce((total, id) => total + (this.assets.get(id)?.exifInfo?.fileSizeInByte ?? 0), 0);
    return { archives: [{ assetIds: ids, size }], totalSize: size };
  }

  addUser(user: UserAdminResponseDto) {
    this.users.set(user.id, user);
    return this;
  }

  getUser(id: string) {
    return this.users.get(id);
  }

  userList({ withDeleted = false }: { withDeleted?: boolean } = {}) {
    return [...this.users.values()].filter((user) => withDeleted || !user.deletedAt);
  }

  createUser(dto: UserAdminCreateDto) {
    const user = factory.user({
      email: dto.email,
      name: dto.name,
      isAdmin: dto.isAdmin ?? false,
      shouldChangePassword: dto.shouldChangePassword ?? true,
      quotaSizeInBytes: dto.quotaSizeInBytes ?? null,
      storageLabel: dto.storageLabel ?? null,
    });
    this.addUser(user);
    return user;
  }

  updateUser(id: string, dto: UserAdminUpdateDto) {
    const user = this.users.get(id);
    if (!user) {
      return;
    }
    const updated: UserAdminResponseDto = {
      ...user,
      email: dto.email ?? user.email,
      name: dto.name ?? user.name,
      isAdmin: dto.isAdmin ?? user.isAdmin,
      avatarColor: dto.avatarColor ?? user.avatarColor,
      quotaSizeInBytes: dto.quotaSizeInBytes === undefined ? user.quotaSizeInBytes : dto.quotaSizeInBytes,
      storageLabel: dto.storageLabel === undefined ? user.storageLabel : dto.storageLabel,
      shouldChangePassword: dto.shouldChangePassword ?? user.shouldChangePassword,
      updatedAt: new Date().toISOString(),
    };
    this.users.set(id, updated);
    return updated;
  }

  addAsset(asset: AssetResponseDto) {
    this.assets.set(asset.id, asset);
    return this;
  }

  addAssets(...assets: AssetResponseDto[]) {
    for (const asset of assets) {
      this.addAsset(asset);
    }
    return this;
  }

  addTimeline(config?: TimelineConfig) {
    const assets = factory.timeline(config);
    this.addAssets(...assets);
    return assets;
  }

  createAlbum(dto: CreateAlbumDto) {
    const album = factory.album({ albumName: dto.albumName, description: dto.description ?? '' });
    this.addAlbum(
      album,
      (dto.assetIds ?? []).map((id) => ({ id })),
    );
    return this.getAlbum(album.id)!;
  }

  deleteAlbum(id: string) {
    this.albums.delete(id);
    this.albumAssets.delete(id);
    return this;
  }

  addDuplicates(...assets: AssetResponseDto[]) {
    const duplicateId = randomUUID();
    for (const asset of assets) {
      asset.duplicateId = duplicateId;
    }
    return this.addAssets(...assets);
  }

  duplicateList(): DuplicateResponseDto[] {
    const groups = new Map<string, AssetResponseDto[]>();
    for (const asset of this.assets.values()) {
      if (asset.duplicateId) {
        groups.set(asset.duplicateId, [...(groups.get(asset.duplicateId) ?? []), asset]);
      }
    }
    return [...groups].map(([duplicateId, assets]) => ({ duplicateId, assets, suggestedKeepAssetIds: [assets[0].id] }));
  }

  addAlbum(album: AlbumResponseDto, assets: Array<Pick<AssetResponseDto, 'id'>> = []) {
    this.albums.set(album.id, album);
    this.albumAssets.set(album.id, new Set(assets.map(({ id }) => id)));
    return this.getAlbum(album.id)!;
  }

  addToAlbum(albumId: string, ...assetIds: string[]) {
    const members = this.albumAssets.get(albumId);
    if (!members) {
      throw new Error(`Unknown album: ${albumId}`);
    }
    for (const id of assetIds) {
      members.add(id);
    }
    return this;
  }

  addMemory(memory: MemoryResponseDto) {
    this.memories.set(memory.id, memory);
    return this;
  }

  addMemories(...memories: MemoryResponseDto[]) {
    for (const memory of memories) {
      this.addMemory(memory);
    }
    return this;
  }

  addPerson(person: PersonResponseDto) {
    this.people.set(person.id, person);
    return this;
  }

  addPeople(...people: PersonResponseDto[]) {
    for (const person of people) {
      this.addPerson(person);
    }
    return this;
  }

  addStack(stack: StackResponseDto) {
    this.stacks.set(stack.id, stack);
    for (const asset of stack.assets) {
      asset.stack = { id: stack.id, assetCount: stack.assets.length, primaryAssetId: stack.primaryAssetId };
      this.assets.set(asset.id, asset);
    }
    return this;
  }

  addOcr(...results: AssetOcrResponseDto[]) {
    for (const result of results) {
      const existing = this.ocr.get(result.assetId) ?? [];
      this.ocr.set(result.assetId, [...existing, result]);
    }
    return this;
  }

  mapMarkers(albumId?: string): MapMarkerResponseDto[] {
    return this.timelineAssets({ albumId })
      .filter((asset) => typeof asset.exifInfo?.latitude === 'number' && typeof asset.exifInfo.longitude === 'number')
      .map((asset) => ({
        id: asset.id,
        lat: asset.exifInfo!.latitude!,
        lon: asset.exifInfo!.longitude!,
        city: asset.exifInfo?.city ?? null,
        state: asset.exifInfo?.state ?? null,
        country: asset.exifInfo?.country ?? null,
      }));
  }

  albumList(assetId?: string) {
    return [...this.albums.keys()]
      .filter((albumId) => assetId === undefined || this.albumAssets.get(albumId)?.has(assetId))
      .map((albumId) => this.getAlbum(albumId)!);
  }

  getAlbum(albumId: string): AlbumResponseDto | undefined {
    const album = this.albums.get(albumId);
    if (!album) {
      return;
    }
    const assets = this.timelineAssets({ albumId });
    return {
      ...album,
      assetCount: assets.length,
      albumThumbnailAssetId: album.albumThumbnailAssetId ?? assets[0]?.id ?? null,
      startDate: assets.at(-1)?.fileCreatedAt,
      endDate: assets[0]?.fileCreatedAt,
      lastModifiedAssetTimestamp: assets[0]?.fileCreatedAt,
    };
  }

  sampleAssets(count: number, seed = 1) {
    return new SeededRandom(seed)
      .pickMany(this.timelineAssets(), count)
      .sort((a, b) => b.fileCreatedAt.localeCompare(a.fileCreatedAt));
  }

  timelineAssets(filter: TimelineFilter = {}) {
    const members = filter.albumId === undefined ? undefined : (this.albumAssets.get(filter.albumId) ?? new Set());
    const isTrashed = filter.isTrashed ?? false;
    const direction = filter.order === AssetOrder.Asc ? 1 : -1;

    return [...this.assets.values()]
      .filter(
        (asset) =>
          (members === undefined || members.has(asset.id)) &&
          (filter.visibility === undefined
            ? !hiddenVisibilities.has(asset.visibility)
            : asset.visibility === filter.visibility) &&
          asset.isTrashed === isTrashed &&
          (filter.isFavorite === undefined || asset.isFavorite === filter.isFavorite),
      )
      .sort((a, b) => direction * a.fileCreatedAt.localeCompare(b.fileCreatedAt));
  }

  timeBuckets(filter: TimelineFilter = {}): TimeBucketsResponseDto[] {
    const counts = new Map<string, number>();
    for (const asset of this.timelineAssets(filter)) {
      const key = monthKey(asset.fileCreatedAt);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts, ([key, count]) => ({ timeBucket: `${key}-01T00:00:00.000Z`, count }));
  }

  timeBucket(timeBucket: string, filter: TimelineFilter = {}): TimeBucketAssetResponseDto {
    const key = monthKey(timeBucket);
    const bucket = this.timelineAssets(filter).filter((asset) => monthKey(asset.fileCreatedAt) === key);
    return {
      id: bucket.map((asset) => asset.id),
      ownerId: bucket.map((asset) => asset.ownerId),
      ratio: bucket.map((asset) => (asset.width && asset.height ? asset.width / asset.height : 1)),
      thumbhash: bucket.map((asset) => asset.thumbhash),
      createdAt: bucket.map((asset) => asset.createdAt),
      fileCreatedAt: bucket.map((asset) => asset.fileCreatedAt),
      localOffsetHours: bucket.map(() => 0),
      isFavorite: bucket.map((asset) => asset.isFavorite),
      isTrashed: bucket.map((asset) => asset.isTrashed),
      isImage: bucket.map((asset) => asset.type === AssetTypeEnum.Image),
      duration: bucket.map((asset) => asset.duration),
      projectionType: bucket.map((asset) => asset.exifInfo?.projectionType ?? null),
      livePhotoVideoId: bucket.map((asset) => asset.livePhotoVideoId ?? null),
      city: bucket.map((asset) => asset.exifInfo?.city ?? null),
      country: bucket.map((asset) => asset.exifInfo?.country ?? null),
      visibility: bucket.map((asset) => asset.visibility),
      stack: bucket.map((asset) => (asset.stack ? [asset.stack.id, String(asset.stack.assetCount)] : null)),
    };
  }

  updateAsset(id: string, dto: UpdateAssetDto) {
    const asset = this.assets.get(id);
    if (!asset) {
      return;
    }

    const visibility = dto.visibility ?? asset.visibility;
    const updated: AssetResponseDto = {
      ...asset,
      isFavorite: dto.isFavorite ?? asset.isFavorite,
      visibility,
      isArchived: visibility === AssetVisibility.Archive,
      livePhotoVideoId: dto.livePhotoVideoId === undefined ? asset.livePhotoVideoId : dto.livePhotoVideoId,
      updatedAt: new Date().toISOString(),
      exifInfo: {
        ...asset.exifInfo,
        description: dto.description ?? asset.exifInfo?.description,
        rating: dto.rating === undefined ? asset.exifInfo?.rating : dto.rating,
        latitude: dto.latitude ?? asset.exifInfo?.latitude,
        longitude: dto.longitude ?? asset.exifInfo?.longitude,
        dateTimeOriginal: dto.dateTimeOriginal ?? asset.exifInfo?.dateTimeOriginal,
      },
    };

    this.assets.set(id, updated);
    return updated;
  }

  updateAssets({ ids, ...dto }: AssetBulkUpdateDto) {
    for (const id of ids) {
      this.updateAsset(id, dto);
    }
    return this;
  }

  deleteAssets(ids: string[], force = false) {
    for (const id of ids) {
      const asset = this.assets.get(id);
      if (!asset) {
        continue;
      }
      if (force) {
        this.assets.delete(id);
      } else {
        this.assets.set(id, { ...asset, isTrashed: true });
      }
    }
    return this;
  }

  restoreAssets(ids: string[]) {
    let count = 0;
    for (const id of ids) {
      const asset = this.assets.get(id);
      if (!asset?.isTrashed) {
        continue;
      }
      this.assets.set(id, { ...asset, isTrashed: false });
      count++;
    }
    return count;
  }

  memoryList({ id, page = 1, size = 250 }: MemoryFilter = {}) {
    const memories = [...this.memories.values()]
      .filter((memory) => id === undefined || memory.id === id)
      .sort((a, b) => b.memoryAt.localeCompare(a.memoryAt));
    return memories.slice((page - 1) * size, page * size);
  }

  deleteMemory(id: string) {
    this.memories.delete(id);
    return this;
  }

  updateMemory(id: string, dto: MemoryUpdateDto) {
    const memory = this.memories.get(id);
    if (!memory) {
      return;
    }
    const updated: MemoryResponseDto = {
      ...memory,
      isSaved: dto.isSaved ?? memory.isSaved,
      memoryAt: dto.memoryAt ?? memory.memoryAt,
      seenAt: dto.seenAt ?? memory.seenAt,
      updatedAt: new Date().toISOString(),
    };
    this.memories.set(id, updated);
    return updated;
  }

  searchAssets(dto: MetadataSearchDto): SearchResponseDto {
    const items = this.timelineAssets({ visibility: dto.visibility, isFavorite: dto.isFavorite ?? undefined }).slice(
      0,
      dto.size ?? 250,
    );
    return {
      albums: { total: 0, count: 0, items: [], facets: [] },
      assets: { total: items.length, count: items.length, items, facets: [], nextPage: null, nextCursor: null },
    };
  }
}
