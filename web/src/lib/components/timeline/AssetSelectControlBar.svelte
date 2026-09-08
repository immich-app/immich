<script lang="ts">
  import ControlAppBar from '$lib/components/shared-components/ControlAppBar.svelte';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import { mdiClose } from '@mdi/js';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    children?: Snippet;
  };

  let { children }: Props = $props();

  const onClose = () => assetMultiSelectManager.clear();

  const assets = $derived(assetMultiSelectManager.assets);
</script>

<ControlAppBar {onClose} backIcon={mdiClose}>
  {#snippet leading()}
    <div class="font-medium text-primary">
      <p class="block sm:hidden">{assets.length}</p>
      <p class="hidden sm:block">
        {#if assetMultiSelectManager.hasMoreAssets}
          {$t('selected_count_with_more', { values: { count: assets.length } })}
        {:else}
          {$t('selected_count', { values: { count: assets.length } })}
        {/if}
      </p>
    </div>
  {/snippet}
  {#snippet trailing()}
    {@render children?.()}
  {/snippet}
</ControlAppBar>
