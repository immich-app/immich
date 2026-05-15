import {
  createActivity,
  deleteActivity,
  getActivities,
  getActivityStatistics,
  ReactionLevel,
  ReactionType,
  type ActivityCreateDto,
  type ActivityResponseDto,
} from '@immich/sdk';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { websocketStore } from '$lib/stores/websocket';
import { handlePromiseError } from '$lib/utils';
import { handleError } from '$lib/utils/handle-error';

/** Minimum server version that supports paginated activity loading (take + before params). */
const PAGINATION_MIN_VERSION = { major: 3, minor: 0, patch: 0 };
const SERVER_VERSION_TIMEOUT_MS = 3000;

function waitForServerVersion(): Promise<{ major: number; minor: number; patch: number } | undefined> {
  const current = get(websocketStore.serverVersion);
  if (current) {
    return Promise.resolve(current);
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = (version: { major: number; minor: number; patch: number } | undefined) => {
      if (settled) return;
      settled = true;
      try {
        clearTimeout(timer);
        unsubscribe();
      } finally {
        resolve(version);
      }
    };
    const unsubscribe = websocketStore.serverVersion.subscribe((version) => {
      if (version) {
        finish(version);
      }
    });
    const timer = setTimeout(() => finish(undefined), SERVER_VERSION_TIMEOUT_MS);
  });
}

function versionSupportsPagination(version: { major: number; minor: number; patch: number }): boolean {
  if (version.major !== PAGINATION_MIN_VERSION.major) {
    return version.major > PAGINATION_MIN_VERSION.major;
  }
  if (version.minor !== PAGINATION_MIN_VERSION.minor) {
    return version.minor > PAGINATION_MIN_VERSION.minor;
  }
  return version.patch >= PAGINATION_MIN_VERSION.patch;
}

type CacheKey = string;
type ActivityCache = {
  activities: ActivityResponseDto[];
  commentCount: number;
  likeCount: number;
  isLiked: ActivityResponseDto | null;
  hasMore: boolean;
};

class ActivityManager {
  static readonly PAGE_SIZE = 50;

  #albumId = $state<string | undefined>();
  #assetId = $state<string | undefined>();
  #activities = $state<ActivityResponseDto[]>([]);
  #commentCount = $state(0);
  #likeCount = $state(0);
  #isLiked = $state<ActivityResponseDto | null>(null);
  #hasMore = $state(true);

  #cache = new Map<CacheKey, ActivityCache>();

  isLoading = $state(false);
  isLoadingMore = $state(false);

  get assetId() {
    return this.#assetId;
  }

  get activities() {
    return this.#activities;
  }

  get commentCount() {
    return this.#commentCount;
  }

  get likeCount() {
    return this.#likeCount;
  }

  get isLiked() {
    return this.#isLiked;
  }

  get hasMore() {
    return this.#hasMore;
  }

  #getCacheKey(albumId: string, assetId?: string) {
    return `${albumId}:${assetId ?? ''}`;
  }

  async init(albumId: string, assetId?: string) {
    if (assetId && assetId === this.#assetId) {
      return;
    }

    this.#albumId = albumId;
    this.#assetId = assetId;
    try {
      await activityManager.refreshActivities(albumId, assetId);
    } catch (error) {
      handleError(error, get(t)('errors.unable_to_get_comments_number'));
    }
  }

  #invalidateCache(albumId: string, assetId?: string) {
    this.#cache.delete(this.#getCacheKey(albumId));
    this.#cache.delete(this.#getCacheKey(albumId, assetId));
  }

  async addActivity(dto: ActivityCreateDto) {
    if (this.#albumId === undefined) {
      return;
    }

    const activity = await createActivity({ activityCreateDto: dto });
    this.#activities = [...this.#activities, activity];

    if (activity.type === ReactionType.Comment) {
      this.#commentCount++;
    }

    if (activity.type === ReactionType.Like) {
      this.#likeCount++;
    }

    this.#invalidateCache(this.#albumId, this.#assetId);
    handlePromiseError(this.refreshActivities(this.#albumId, this.#assetId, { preserveDepth: true }));
    return activity;
  }

  async deleteActivity(activity: ActivityResponseDto, index?: number) {
    if (!this.#albumId) {
      return;
    }

    if (activity.type === ReactionType.Comment) {
      this.#commentCount--;
    }

    if (activity.type === ReactionType.Like) {
      this.#likeCount--;
    }

    this.#activities = this.#activities.filter(({ id }) => id !== activity.id);

    await deleteActivity({ id: activity.id });
    this.#invalidateCache(this.#albumId, this.#assetId);
    handlePromiseError(this.refreshActivities(this.#albumId, this.#assetId, { preserveDepth: true }));
  }

  async toggleLike() {
    if (!this.#albumId) {
      return;
    }

    if (this.#isLiked) {
      await this.deleteActivity(this.#isLiked);
      this.#isLiked = null;
    } else {
      this.#isLiked = (await this.addActivity({
        albumId: this.#albumId,
        assetId: this.#assetId,
        type: ReactionType.Like,
      }))!;
    }
  }

  async refreshActivities(albumId: string, assetId?: string, options?: { preserveDepth?: boolean }) {
    this.isLoading = true;

    const cacheKey = this.#getCacheKey(albumId, assetId);

    if (this.#cache.has(cacheKey)) {
      const cached = this.#cache.get(cacheKey)!;
      this.#activities = cached.activities;
      this.#commentCount = cached.commentCount;
      this.#likeCount = cached.likeCount;
      this.#isLiked = cached.isLiked ?? null;
      this.#hasMore = cached.hasMore;
      this.isLoading = false;
      return;
    }

    const serverVersion = await waitForServerVersion();
    const paginationSupported = serverVersion !== undefined && versionSupportsPagination(serverVersion);
    const targetCount = options?.preserveDepth
      ? Math.max(
          ActivityManager.PAGE_SIZE,
          Math.ceil(this.#activities.length / ActivityManager.PAGE_SIZE) * ActivityManager.PAGE_SIZE,
        )
      : ActivityManager.PAGE_SIZE;
    this.#activities = await getActivities({
      albumId,
      assetId,
      take: paginationSupported ? targetCount : undefined,
    });
    this.#hasMore = paginationSupported && this.#activities.length >= targetCount;

    const [liked] = await getActivities({
      albumId,
      assetId,
      userId: authManager.user.id,
      $type: ReactionType.Like,
      level: assetId ? undefined : ReactionLevel.Album,
    });
    this.#isLiked = liked ?? null;

    const { comments, likes } = await getActivityStatistics({ albumId, assetId });
    this.#commentCount = comments;
    this.#likeCount = likes;

    this.#cache.set(cacheKey, {
      activities: this.#activities,
      commentCount: this.#commentCount,
      likeCount: this.#likeCount,
      isLiked: this.#isLiked,
      hasMore: this.#hasMore,
    });

    this.isLoading = false;
  }

  async loadMore() {
    if (!this.#albumId || !this.#hasMore || this.isLoadingMore || this.#activities.length === 0) {
      return;
    }

    this.isLoadingMore = true;
    try {
      const older = await getActivities({
        albumId: this.#albumId,
        assetId: this.#assetId,
        take: ActivityManager.PAGE_SIZE,
        before: this.#activities[0].createdAt,
      });
      this.#activities = [...older, ...this.#activities];
      this.#hasMore = older.length >= ActivityManager.PAGE_SIZE;

      const cacheKey = this.#getCacheKey(this.#albumId, this.#assetId);
      const cached = this.#cache.get(cacheKey);
      if (cached) {
        this.#cache.set(cacheKey, { ...cached, activities: this.#activities, hasMore: this.#hasMore });
      }
    } finally {
      this.isLoadingMore = false;
    }
  }

  reset() {
    this.#albumId = undefined;
    this.#assetId = undefined;
    this.#activities = [];
    this.#commentCount = 0;
    this.#likeCount = 0;
    this.#hasMore = true;
  }
}

export const activityManager = new ActivityManager();
