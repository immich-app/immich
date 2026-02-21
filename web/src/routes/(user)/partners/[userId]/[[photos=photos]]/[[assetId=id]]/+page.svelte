<script lang="ts">
  import { goto } from '$app/navigation';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import CreateSharedLink from '$lib/components/timeline/actions/CreateSharedLinkAction.svelte';
  import DownloadAction from '$lib/components/timeline/actions/DownloadAction.svelte';
  import AssetSelectControlBar from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import Timeline from '$lib/components/timeline/Timeline.svelte';
  import { Route } from '$lib/route';
  import { getAssetBulkActions } from '$lib/services/asset.service';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { AssetVisibility } from '@immich/sdk';
  import { ActionButton, CommandPaletteDefaultProvider } from '@immich/ui';
  import { mdiArrowLeft } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const options = $derived({
    userId: data.partner.id,
    visibility: AssetVisibility.Timeline,
    withStacked: true,
  });

  const assetInteraction = new AssetInteraction();

  const handleEscape = () => {
    if (assetInteraction.selectionActive) {
      assetInteraction.clearMultiselect();
      return;
    }
  };
</script>

<main class="relative h-dvh overflow-hidden px-2 md:px-6 max-md:pt-(--navbar-height-md) pt-(--navbar-height)">
  <Timeline enableRouting={true} {options} {assetInteraction} onEscape={handleEscape} />
</main>

{#if assetInteraction.selectionActive}
  <AssetSelectControlBar
    assets={assetInteraction.selectedAssets}
    clearSelect={() => assetInteraction.clearMultiselect()}
  >
    {@const Actions = getAssetBulkActions($t, assetInteraction.asControlContext())}
    <CommandPaletteDefaultProvider name={$t('assets')} actions={Object.values(Actions)} />
    <CreateSharedLink />
    <ActionButton action={Actions.AddToAlbum} />
    <DownloadAction />
  </AssetSelectControlBar>
{:else}
  <ControlAppBar showBackButton backIcon={mdiArrowLeft} onClose={() => goto(Route.sharing())}>
    {#snippet leading()}
      <p class="whitespace-nowrap text-immich-fg dark:text-immich-dark-fg">
        {$t('partner_list_user_photos', { values: { user: data.partner.name } })}
      </p>
    {/snippet}
  </ControlAppBar>
{/if}
