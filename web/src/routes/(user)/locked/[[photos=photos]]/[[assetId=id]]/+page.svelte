<script lang="ts">
  import { goto } from '$app/navigation';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import ChangeDate from '$lib/components/photos-page/actions/change-date-action.svelte';
  import ChangeLocation from '$lib/components/photos-page/actions/change-location-action.svelte';
  import DeleteAssets from '$lib/components/photos-page/actions/delete-assets.svelte';
  import DownloadAction from '$lib/components/photos-page/actions/download-action.svelte';
  import SelectAllAssets from '$lib/components/photos-page/actions/select-all-assets.svelte';
  import SetVisibilityAction from '$lib/components/photos-page/actions/set-visibility-action.svelte';
  import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
  import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import { AppRoute, AssetAction } from '$lib/constants';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { AssetStore } from '$lib/stores/assets-store.svelte';
  import { AssetVisibility, lockAuthSession } from '@immich/sdk';
  import { Button } from '@immich/ui';
  import { mdiDotsVertical, mdiLockOutline } from '@mdi/js';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const assetStore = new AssetStore();
  void assetStore.updateOptions({ visibility: AssetVisibility.Locked });
  onDestroy(() => assetStore.destroy());

  const assetInteraction = new AssetInteraction();

  const handleEscape = () => {
    if (assetInteraction.selectionActive) {
      assetInteraction.clearMultiselect();
      return;
    }
  };

  const handleMoveOffLockedFolder = (assetIds: string[]) => {
    assetInteraction.clearMultiselect();
    assetStore.removeAssets(assetIds);
  };

  const handleLock = async () => {
    await lockAuthSession();
    await goto(AppRoute.PHOTOS);
  };
</script>

<!-- Multi-selection mode app bar -->
{#if assetInteraction.selectionActive}
  <AssetSelectControlBar
    assets={assetInteraction.selectedAssets}
    clearSelect={() => assetInteraction.clearMultiselect()}
  >
    <SelectAllAssets withText {assetStore} {assetInteraction} />
    <SetVisibilityAction unlock onVisibilitySet={handleMoveOffLockedFolder} />
    <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')}>
      <DownloadAction menuItem />
      <ChangeDate menuItem />
      <ChangeLocation menuItem />
      <DeleteAssets menuItem force onAssetDelete={(assetIds) => assetStore.removeAssets(assetIds)} />
    </ButtonContextMenu>
  </AssetSelectControlBar>
{/if}

<UserPageLayout hideNavbar={assetInteraction.selectionActive} title={data.meta.title} scrollbar={false}>
  {#snippet buttons()}
    <Button size="small" variant="filled" color="warning" leadingIcon={mdiLockOutline} onclick={handleLock}>
      {$t('lock')}
    </Button>
  {/snippet}

  <AssetGrid
    enableRouting={true}
    {assetStore}
    {assetInteraction}
    onEscape={handleEscape}
    removeAction={AssetAction.SET_VISIBILITY_TIMELINE}
  >
    {#snippet empty()}
      <EmptyPlaceholder text={$t('no_locked_photos_message')} title={$t('nothing_here_yet')} />
    {/snippet}
  </AssetGrid>
</UserPageLayout>
