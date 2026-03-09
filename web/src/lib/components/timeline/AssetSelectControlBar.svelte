<script lang="ts" module>
  import { setAssetControlContext } from '$lib/utils/context';
  import { t } from 'svelte-i18n';
</script>

<script lang="ts">
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { mdiClose } from '@mdi/js';
  import type { Snippet } from 'svelte';
  import ControlAppBar from '../shared-components/control-app-bar.svelte';

  type Props = {
    assets: TimelineAsset[];
    clearSelect: () => void;
    ownerId?: string | undefined;
    children?: Snippet;
    forceDark?: boolean;
  };

  let { assets, clearSelect, ownerId = undefined, children, forceDark }: Props = $props();

  setAssetControlContext({
    getAssets: () => assets,
    getOwnedAssets: () => (ownerId === undefined ? assets : assets.filter((asset) => asset.ownerId === ownerId)),
    clearSelect: () => clearSelect(),
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
