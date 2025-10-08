import type { AssetStreamManager } from '$lib/managers/AssetStreamManager/AssetStreamManager.svelte';
import type { TimelineAsset, UpdateGeometryOptions } from '$lib/managers/timeline-manager/types';
import type { ViewerAsset } from '$lib/managers/timeline-manager/viewer-asset.svelte';
import { CancellableTask, TaskStatus } from '$lib/utils/cancellable-task';
import { handleError } from '$lib/utils/handle-error';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';

export type SegmentIdentifier = {
  get id(): string;
  matches(segment: AssetStreamSegment): boolean;
};
export abstract class AssetStreamSegment {
  #intersecting = $state(false);
  #actuallyIntersecting = $state(false);
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

  abstract get assetStreamManager(): AssetStreamManager;

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

  get actuallyIntersecting() {
    return this.#actuallyIntersecting;
  }

  get assets(): TimelineAsset[] {
    return this.#assets;
  }

  set height(height: number) {
    if (this.#height === height) {
      return;
    }
    const { assetStreamManager: store, percent } = this;
    const index = store.segments.indexOf(this);
    const heightDelta = height - this.#height;
    this.#height = height;
    const prevSegment = store.segments[index - 1];
    if (prevSegment) {
      const newTop = prevSegment.#top + prevSegment.#height;
      if (this.#top !== newTop) {
        this.#top = newTop;
      }
    }
    for (let cursor = index + 1; cursor < store.segments.length; cursor++) {
      const segment = this.assetStreamManager.segments[cursor];
      const newTop = segment.#top + heightDelta;
      if (segment.#top !== newTop) {
        segment.#top = newTop;
      }
    }
    if (store.topIntersectingSegment) {
      const currentIndex = store.segments.indexOf(store.topIntersectingSegment);
      if (currentIndex > 0) {
        if (index < currentIndex) {
          store.scrollCompensation = {
            heightDelta,
            scrollTop: undefined,
            segment: this,
          };
        } else if (percent > 0) {
          const top = this.top + height * percent;
          store.scrollCompensation = {
            heightDelta: undefined,
            scrollTop: top,
            segment: this,
          };
        }
      }
    }
  }

  get height() {
    return this.#height;
  }

  get top(): number {
    return this.#top + this.assetStreamManager.topSectionHeight;
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
    this.#actuallyIntersecting = actuallyIntersecting;
  }

  updateGeometry(options: UpdateGeometryOptions) {
    const { invalidateHeight, noDefer = false } = options;
    if (invalidateHeight) {
      this.isHeightActual = false;
    }
    if (!this.loaded) {
      const viewportWidth = this.assetStreamManager.viewportWidth;
      if (!this.isHeightActual) {
        const unwrappedWidth = (3 / 2) * this.assetsCount * this.assetStreamManager.rowHeight * (7 / 10);
        const rows = Math.ceil(unwrappedWidth / viewportWidth);
        const height = 51 + Math.max(1, rows) * this.assetStreamManager.rowHeight;
        this.height = height;
      }
      return;
    }
    this.layout(noDefer);
  }
}
