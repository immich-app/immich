import { CancellableTask } from '$lib/utils/cancellable-task';
import { handleError } from '$lib/utils/handle-error';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';

import type { PhotostreamManager } from '$lib/managers/timeline-manager/PhotostreamManager.svelte';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';

export type SegmentIdentifier = {
  matches(segment: PhotostreamSegment): boolean;
};
export abstract class PhotostreamSegment {
  #intersecting = $state(false);
  actuallyIntersecting = $state(false);
  #isLoaded = $state(false);

  #height = $state(0);
  #top = $state(0);

  initialCount = $state(0);
  percent = $state(0);
  assetsCount = $derived(this.isLoaded ? this.getAssets().length : this.initialCount);
  loader = new CancellableTask(
    () => this.markLoaded(),
    () => this.markCanceled,
    () => this.handleLoadError,
  );
  isHeightActual = $state(false);

  abstract get timelineManager(): PhotostreamManager;

  abstract get identifier(): SegmentIdentifier;

  get isLoaded() {
    return this.#isLoaded;
  }

  protected markLoaded() {
    this.#isLoaded = true;
  }

  protected markCanceled() {
    this.#isLoaded = false;
  }

  set intersecting(newValue: boolean) {
    const old = this.#intersecting;
    if (old === newValue) {
      return;
    }
    this.#intersecting = newValue;
    if (newValue) {
      this.load();
    } else {
      this.cancel();
    }
  }

  get intersecting() {
    return this.#intersecting;
  }

  abstract load(): Promise<void>;

  abstract getAssets(): TimelineAsset[];

  set height(height: number) {
    if (this.#height === height) {
      return;
    }
    const { timelineManager: store, percent } = this;
    const index = store.months.indexOf(this);
    const heightDelta = height - this.#height;
    this.#height = height;
    const prevMonthGroup = store.months[index - 1];
    if (prevMonthGroup) {
      const newTop = prevMonthGroup.#top + prevMonthGroup.#height;
      if (this.#top !== newTop) {
        this.#top = newTop;
      }
    }
    for (let cursor = index + 1; cursor < store.months.length; cursor++) {
      const monthGroup = this.timelineManager.months[cursor];
      const newTop = monthGroup.#top + heightDelta;
      if (monthGroup.#top !== newTop) {
        monthGroup.#top = newTop;
      }
    }
    if (store.topIntersectingMonthGroup) {
      const currentIndex = store.months.indexOf(store.topIntersectingMonthGroup);
      if (currentIndex > 0) {
        if (index < currentIndex) {
          store.scrollCompensation = {
            heightDelta,
            scrollTop: undefined,
            monthGroup: this,
          };
        } else if (percent > 0) {
          const top = this.top + height * percent;
          store.scrollCompensation = {
            heightDelta: undefined,
            scrollTop: top,
            monthGroup: this,
          };
        }
      }
    }
  }

  get height() {
    return this.#height;
  }

  get top(): number {
    return this.#top + this.timelineManager.topSectionHeight;
  }

  protected handleLoadError(error: unknown) {
    const _$t = get(t);
    handleError(error, _$t('errors.failed_to_load_assets'));
  }

  cancel() {
    this.loader?.cancel();
  }

  layout(_noDefer: boolean) {}

  updateIntersection({ intersecting, actuallyIntersecting }: { intersecting: boolean; actuallyIntersecting: boolean }) {
    this.intersecting = intersecting;
    this.actuallyIntersecting = actuallyIntersecting;
  }
}