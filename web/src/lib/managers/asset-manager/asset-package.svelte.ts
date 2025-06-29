import { CancellableTask } from '$lib/utils/cancellable-task';
import { handleError } from '$lib/utils/handle-error';
import type { AlbumResponseDto, AssetResponseDto, StackResponseDto } from '@immich/sdk';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import type { AssetManager, AssetManagerOptions } from './asset-manager.svelte';

export class AssetPackage {
  isLoaded: boolean = $state(false);
  asset: AssetResponseDto | undefined = $state();
  albums: AlbumResponseDto[] = $state([]);
  stack: StackResponseDto | undefined = $state();
  readonly assetId: string;
  readonly assetManager: AssetManager;

  // To ensure albums and stack is need to reloading.
  options: AssetManagerOptions | undefined = $state();

  loader: CancellableTask | undefined;

  constructor(store: AssetManager, assetId: string) {
    this.assetManager = store;
    this.assetId = assetId;

    this.loader = new CancellableTask(
      () => {
        this.isLoaded = true;
      },
      () => {
        this.asset = undefined;
        this.albums = [];
        this.stack = undefined;
        this.isLoaded = false;
      },
      this.#handleLoadError,
    );
  }

  // TODO: Add error message to translation.
  #handleLoadError(error: unknown) {
    const _$t = get(t);
    handleError(error, _$t('errors.failed_to_load_asset'));
  }

  cancel() {
    this.loader?.cancel();
  }
}
