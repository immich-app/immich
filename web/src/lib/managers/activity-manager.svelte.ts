import { user } from '$lib/stores/user.store';
import { websocketEvents } from '$lib/stores/websocket';
import { handlePromiseError } from '$lib/utils';
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
import { createSubscriber } from 'svelte/reactivity';
import { get } from 'svelte/store';

class ActivityManager {
  #albumId = $state<string | undefined>();
  #assetId = $state<string | undefined>();
  #activities = $state<ActivityResponseDto[]>([]);
  #commentCount = $state(0);
  #likeCount = $state(0);
  #isLiked = $state<ActivityResponseDto | null>(null);

  #subscribe;

  constructor() {
    this.#subscribe = createSubscriber((update) => {
      const unsubscribe = websocketEvents.on('on_activity_change', ({ albumId, assetId }) => {
        if (this.#albumId === albumId || this.#assetId === assetId) {
          handlePromiseError(this.refreshActivities(this.#albumId!, this.#assetId));
          update();
        }
      });

      return () => {
        unsubscribe();
      };
    });
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

  init(albumId: string, assetId?: string) {
    this.#albumId = albumId;
    this.#assetId = assetId;
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
