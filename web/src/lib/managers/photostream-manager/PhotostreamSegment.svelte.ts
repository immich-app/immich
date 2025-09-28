import { CancellableTask } from '$lib/utils/cancellable-task';
import { handleError } from '$lib/utils/handle-error';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';

import type { PhotostreamManager } from '$lib/managers/photostream-manager/PhotostreamManager.svelte';
import { getTestHook } from '$lib/managers/photostream-manager/TestHooks.svelte';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import type { ViewerAsset } from '$lib/managers/timeline-manager/viewer-asset.svelte';

export type SegmentIdentifier = {
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

  assetsCount = $derived.by(() => (this.isLoaded ? this.viewerAssets.length : this.initialCount));
  loader = new CancellableTask(
    () => this.markLoaded(),
    () => this.markCanceled,
    () => this.handleLoadError,
  );
  isHeightActual = $state(false);

  constructor() {
    getTestHook()?.hookSegment(this);
  }

  abstract get timelineManager(): PhotostreamManager;

  abstract get identifier(): SegmentIdentifier;

  abstract get id(): string;

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
      void this.load(true);
    } else {
      this.cancel();
    }
  }

  get intersecting() {
    return this.#intersecting;
  }

  async load(cancelable: boolean): Promise<'DONE' | 'WAITED' | 'CANCELED' | 'LOADED' | 'ERRORED'> {
    const executionStatus = await this.loader.execute(async (signal: AbortSignal) => {
      await this.fetch(signal);
    }, cancelable);
    if (executionStatus === 'LOADED') {
      this.layout();
    }
    return executionStatus;
  }

  protected abstract fetch(signal: AbortSignal): Promise<void>;

  async reload(cancelable: boolean): Promise<'DONE' | 'WAITED' | 'CANCELED' | 'LOADED' | 'ERRORED'> {
    await this.loader.reset();
    return await this.load(cancelable);
  }

  get assets(): TimelineAsset[] {
    return this.#assets;
  }

  abstract get viewerAssets(): ViewerAsset[];

  set height(height: number) {
    if (this.#height === height) {
      return;
    }

    let needsIntersectionUpdate = false;
    const timelineManager = this.timelineManager;
    const index = timelineManager.months.indexOf(this);
    const heightDelta = height - this.#height;
    this.#height = height;
    const prevMonthGroup = timelineManager.months[index - 1];
    if (prevMonthGroup) {
      const newTop = prevMonthGroup.#top + prevMonthGroup.#height;
      if (this.#top !== newTop) {
        this.#top = newTop;
      }
    }
    if (heightDelta === 0) {
      return;
    }

    for (let cursor = index + 1; cursor < timelineManager.months.length; cursor++) {
      const monthGroup = timelineManager.months[cursor];
      const newTop = monthGroup.#top + heightDelta;
      if (monthGroup.#top !== newTop) {
        monthGroup.#top = newTop;
        needsIntersectionUpdate = true;
      }
    }

    if (needsIntersectionUpdate) {
      timelineManager.updateIntersections();
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

  layout(_?: boolean) {}

  updateIntersection({ intersecting, actuallyIntersecting }: { intersecting: boolean; actuallyIntersecting: boolean }) {
    this.intersecting = intersecting;
    this.actuallyIntersecting = actuallyIntersecting;
  }

  abstract findAssetAbsolutePosition(assetId: string): number;
}
