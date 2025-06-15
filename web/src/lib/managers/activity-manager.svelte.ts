import { user } from '$lib/stores/user.store';
import { websocketEvents } from '$lib/stores/websocket';
import { handlePromiseError } from '$lib/utils';
import { handleError } from '$lib/utils/handle-error';
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
import { createSubscriber } from 'svelte/reactivity';
import { get } from 'svelte/store';

type CacheKey = string;
type ActivityCache = {
  activities: ActivityResponseDto[];
  commentCount: number;
  likeCount: number;
  isLiked: ActivityResponseDto | null;
};

class ActivityManager {
  #albumId = $state<string | undefined>();
  #assetId = $state<string | undefined>();
  #activities = $state<ActivityResponseDto[]>([]);
  #commentCount = $state(0);
  #likeCount = $state(0);
  #isLiked = $state<ActivityResponseDto | null>(null);

  #subscribe;

  #cache = new Map<CacheKey, ActivityCache>();
  isLoading = $state(false);

  constructor() {
    this.#subscribe = createSubscriber((update) => {
      const unsubscribe = websocketEvents.on('on_activity_change', ({ albumId, assetId }) => {
        if (this.#albumId === albumId || this.#assetId === assetId) {
          this.#invalidateCache(albumId, this.#assetId);
          handlePromiseError(this.refreshActivities(albumId, this.#assetId));
          update();
        }
      });

      return () => {
        unsubscribe();
      };
    });
  }

  get assetId() {
    return this.#assetId;
  }

  get activities() {
    this.#subscribe();
    return this.#activities;
  }

  get commentCount() {
    this.#subscribe();
    return this.#commentCount;
  }

  get likeCount() {
    this.#subscribe();
    return this.#likeCount;
  }

  get isLiked() {
    this.#subscribe();
    return this.#isLiked;
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
    if (!this.#albumId) {
      return;
    }

    const activity = await createActivity({ activityCreateDto: dto });
    this.#activities = [...this.#activities, activity];

    if (activity.type === ReactionType.Comment) {
      this.#commentCount++;
    } else if (activity.type === ReactionType.Like) {
      this.#likeCount++;
    }

    this.#invalidateCache(this.#albumId, this.#assetId);
    handlePromiseError(this.refreshActivities(this.#albumId, this.#assetId));
    return activity;
  }

  async deleteActivity(activity: ActivityResponseDto, index?: number) {
    if (!this.#albumId) {
      return;
    }

    if (activity.type === ReactionType.Comment) {
      this.#commentCount--;
    } else if (activity.type === ReactionType.Like) {
      this.#likeCount--;
    }

    if (index !== undefined) {
      this.#activities.splice(index, 1);
    } else {
      this.#activities = this.#activities.filter(({ id }) => id !== activity.id);
    }

    await deleteActivity({ id: activity.id });
    this.#invalidateCache(this.#albumId, this.#assetId);
    handlePromiseError(this.refreshActivities(this.#albumId, this.#assetId));
  }

  async toggleLike() {
    if (!this.#albumId) {
      return;
    }

    if (this.#isLiked) {
      await this.deleteActivity(this.#isLiked);
      this.#isLiked = null;
      return;
    }

    const newLike = await this.addActivity({
      albumId: this.#albumId,
      assetId: this.#assetId,
      type: ReactionType.Like,
    });

    if (newLike) {
      this.#isLiked = newLike;
    }
  }

  async refreshActivities(albumId: string, assetId?: string) {
    this.isLoading = true;

    const cacheKey = this.#getCacheKey(albumId, assetId);

    if (this.#cache.has(cacheKey)) {
      const cached = this.#cache.get(cacheKey)!;
      this.#activities = cached.activities;
      this.#commentCount = cached.commentCount;
      this.#likeCount = cached.likeCount;
      this.#isLiked = cached.isLiked ?? null;
      this.isLoading = false;
      return;
    }

    this.#activities = await getActivities({ albumId, assetId });

    const [liked] = await getActivities({
      albumId,
      assetId,
      userId: get(user).id,
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
    });

    this.isLoading = false;
  }

  reset() {
    this.#albumId = undefined;
    this.#assetId = undefined;
    this.#activities = [];
    this.#commentCount = 0;
    this.#likeCount = 0;
  }
}

export const activityManager = new ActivityManager();
