<script lang="ts">
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import { setAssetControlContext } from '$lib/utils/context';
  import { mdiClose } from '@mdi/js';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    children?: Snippet;
    forceDark?: boolean;
  };

  let { children, forceDark }: Props = $props();

  setAssetControlContext(assetMultiSelectManager.asControlContext());

  const onClose = () => assetMultiSelectManager.clear();

  const assets = $derived(assetMultiSelectManager.assets);
</script>

<ControlAppBar {onClose} {forceDark} backIcon={mdiClose} tailwindClasses="bg-white shadow-md">
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
