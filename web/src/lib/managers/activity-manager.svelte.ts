import { user } from '$lib/stores/user.store';
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
import { get } from 'svelte/store';

class ActivityManager {
  #albumId = $state<string | undefined>();
  #assetId = $state<string | undefined>();
  #activities = $state<ActivityResponseDto[]>([]);
  #commentCount = $state(0);
  #isLiked = $state<ActivityResponseDto | null>(null);

  get activities() {
    return this.#activities;
  }

  get commentCount() {
    return this.#commentCount;
  }

  get isLiked() {
    return this.#isLiked;
  }

  init(albumId: string, assetId?: string) {
    this.#albumId = albumId;
    this.#assetId = assetId;
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

    handlePromiseError(this.refreshActivities(this.#albumId, this.#assetId));
    return activity;
  }

  async deleteActivity(activity: ActivityResponseDto, index?: number) {
    if (!this.#albumId) {
      return;
    }

    if (activity.type === ReactionType.Comment) {
      this.#commentCount--;
    }

    this.#activities = index
      ? this.#activities.splice(index, 1)
      : this.#activities.filter(({ id }) => id !== activity.id);

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
    } else {
      this.#isLiked = (await this.addActivity({
        albumId: this.#albumId,
        assetId: this.#assetId,
        type: ReactionType.Like,
      }))!;
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

    const { comments } = await getActivityStatistics({ albumId, assetId });
    this.#commentCount = comments;
  }

  reset() {
    this.#albumId = undefined;
    this.#assetId = undefined;
    this.#activities = [];
    this.#commentCount = 0;
  }
}

export const activityManager = new ActivityManager();
