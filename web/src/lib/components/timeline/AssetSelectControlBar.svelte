<script lang="ts" module>
  import { createContext } from '$lib/utils/context';
  import { t } from 'svelte-i18n';

  export interface AssetControlContext {
    // Wrap assets in a function, because context isn't reactive.
    getAssets: () => TimelineAsset[]; // All assets includes partners' assets
    getOwnedAssets: () => TimelineAsset[]; // Only assets owned by the user
    clearSelect: () => void;
  }

  const { get: getAssetControlContext, set: setContext } = createContext<AssetControlContext>();
  export { getAssetControlContext };
</script>

<script lang="ts">
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { mdiClose } from '@mdi/js';
  import type { Snippet } from 'svelte';
  import ControlAppBar from '../shared-components/control-app-bar.svelte';

  interface Props {
    assets: TimelineAsset[];
    clearSelect: () => void;
    ownerId?: string | undefined;
    children?: Snippet;
    forceDark?: boolean;
  }

  let { assets, clearSelect, ownerId = undefined, children, forceDark }: Props = $props();

  setContext({
    getAssets: () => assets,
    getOwnedAssets: () => (ownerId === undefined ? assets : assets.filter((asset) => asset.ownerId === ownerId)),
    clearSelect,
  });
</script>

<ControlAppBar onClose={clearSelect} {forceDark} backIcon={mdiClose} tailwindClasses="bg-white shadow-md">
  {#snippet leading()}
    <div class="font-medium {forceDark ? 'text-immich-dark-primary' : 'text-primary'}">
      <p class="block sm:hidden">{assets.length}</p>
      <p class="hidden sm:block">{$t('selected_count', { values: { count: assets.length } })}</p>
    </div>
  {/snippet}
  {#snippet trailing()}
    {@render children?.()}
  {/snippet}
</ControlAppBar>
