<script lang="ts" context="module">
  import { createContext } from '$lib/utils/context';
  import { t } from 'svelte-i18n';

  export interface AssetControlContext {
    // Wrap assets in a function, because context isn't reactive.
    getAssets: () => Set<AssetResponseDto>; // All assets includes partners' assets
    getOwnedAssets: () => Set<AssetResponseDto>; // Only assets owned by the user
    clearSelect: () => void;
  }

  const { get: getAssetControlContext, set: setContext } = createContext<AssetControlContext>();
  export { getAssetControlContext };
</script>

<script lang="ts">
  import type { AssetResponseDto } from '@immich/sdk';
  import { mdiClose } from '@mdi/js';
  import ControlAppBar from '../shared-components/control-app-bar.svelte';

  export let assets: Set<AssetResponseDto>;
  export let clearSelect: () => void;
  export let ownerId: string | undefined = undefined;

  setContext({
    getAssets: () => assets,
    getOwnedAssets: () =>
      ownerId === undefined ? assets : new Set([...assets].filter((asset) => asset.ownerId === ownerId)),
    clearSelect,
  });
</script>

<ControlAppBar onClose={clearSelect} backIcon={mdiClose} tailwindClasses="bg-white shadow-md">
  <div class="font-medium text-immich-primary dark:text-immich-dark-primary" slot="leading">
    <p class="block sm:hidden">{assets.size}</p>
    <p class="hidden sm:block">{$t('selected_count', { values: { count: assets.size } })}</p>
  </div>
  <slot slot="trailing" />
</ControlAppBar>
