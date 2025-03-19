<script lang="ts" module>
  import { createContext } from '$lib/utils/context';
  import { t } from 'svelte-i18n';

  export interface AssetControlContext {
    // Wrap assets in a function, because context isn't reactive.
    getAssets: () => AssetResponseDto[]; // All assets includes partners' assets
    getOwnedAssets: () => AssetResponseDto[]; // Only assets owned by the user
    clearSelect: () => void;
  }

  const { get: getAssetControlContext, set: setContext } = createContext<AssetControlContext>();
  export { getAssetControlContext };
</script>

<script lang="ts">
  import type { AssetResponseDto } from '@immich/sdk';
  import { mdiClose } from '@mdi/js';
  import ControlAppBar from '../shared-components/control-app-bar.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    assets: AssetResponseDto[];
    clearSelect: () => void;
    ownerId?: string | undefined;
    children?: Snippet;
  }

  let { assets, clearSelect, ownerId = undefined, children }: Props = $props();

  setContext({
    getAssets: () => assets,
    getOwnedAssets: () => (ownerId === undefined ? assets : [...assets].filter((asset) => asset.ownerId === ownerId)),
    clearSelect,
  });
</script>

<ControlAppBar onClose={clearSelect} backIcon={mdiClose} tailwindClasses="bg-white shadow-md">
  {#snippet leading()}
    <div class="font-medium text-immich-primary dark:text-immich-dark-primary">
      <p class="block sm:hidden">{assets.length}</p>
      <p class="hidden sm:block">{$t('selected_count', { values: { count: assets.length } })}</p>
    </div>
  {/snippet}
  {#snippet trailing()}
    {@render children?.()}
  {/snippet}
</ControlAppBar>
