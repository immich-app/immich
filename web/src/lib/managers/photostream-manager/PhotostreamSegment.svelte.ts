import type { PhotostreamManager } from '$lib/managers/photostream-manager/PhotostreamManager.svelte';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import type { ViewerAsset } from '$lib/managers/timeline-manager/viewer-asset.svelte';
import { CancellableTask, TaskStatus } from '$lib/utils/cancellable-task';
import { handleError } from '$lib/utils/handle-error';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';

export type SegmentIdentifier = {
  id(): string;
  matches(segment: PhotostreamSegment): boolean;
};
export abstract class PhotostreamSegment {
  #intersecting = $state(false);
  actuallyIntersecting = $state(false);
  #isLoaded = $state(false);

  #height = $state(0);
  #top = $state(0);
  #assets = $derived.by(() => this.viewerAssets.map((viewerAsset) => viewerAsset.asset));

  initialCount = $state(0);
  percent = $state(0);

  assetsCount = $derived.by(() => (this.loaded ? this.viewerAssets.length : this.initialCount));
  loader = new CancellableTask(
    () => (this.loaded = true),
    () => (this.loaded = false),
    () => this.handleLoadError,
  );
  isHeightActual = $state(false);

  abstract get timelineManager(): PhotostreamManager;

  abstract get identifier(): SegmentIdentifier;

  abstract get viewerAssets(): ViewerAsset[];

  abstract findAssetAbsolutePosition(assetId: string): number;

  protected abstract fetch(signal: AbortSignal): Promise<void>;

  get loaded() {
    return this.#isLoaded;
  }

  protected set loaded(newValue: boolean) {
    this.#isLoaded = newValue;
  }

  set intersecting(newValue: boolean) {
    const old = this.#intersecting;
    if (old === newValue) {
      return;
    }
    this.#intersecting = newValue;
    if (newValue) {
      void this.load(true);
    } else {
      this.cancel();
    }
  }

  get intersecting() {
    return this.#intersecting;
  }

  get assets(): TimelineAsset[] {
    return this.#assets;
  }

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

  async load(cancelable: boolean): Promise<TaskStatus> {
    return await this.loader?.execute(async (signal: AbortSignal) => {
      await this.fetch(signal);
    }, cancelable);
  }

  protected handleLoadError(error: unknown) {
    const _$t = get(t);
    handleError(error, _$t('errors.failed_to_load_assets'));
  }

  cancel() {
    this.loader?.cancel();
  }

  layout(_: boolean) {}

  updateIntersection({ intersecting, actuallyIntersecting }: { intersecting: boolean; actuallyIntersecting: boolean }) {
    this.intersecting = intersecting;
    this.actuallyIntersecting = actuallyIntersecting;
  }
}
