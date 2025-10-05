<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
  import AddToAlbum from '$lib/components/timeline/actions/AddToAlbumAction.svelte';
  import ArchiveAction from '$lib/components/timeline/actions/ArchiveAction.svelte';
  import AssetJobActions from '$lib/components/timeline/actions/AssetJobActions.svelte';
  import ChangeDate from '$lib/components/timeline/actions/ChangeDateAction.svelte';
  import ChangeDescription from '$lib/components/timeline/actions/ChangeDescriptionAction.svelte';
  import ChangeLocation from '$lib/components/timeline/actions/ChangeLocationAction.svelte';
  import CreateSharedLink from '$lib/components/timeline/actions/CreateSharedLinkAction.svelte';
  import DeleteAssets from '$lib/components/timeline/actions/DeleteAssetsAction.svelte';
  import DownloadAction from '$lib/components/timeline/actions/DownloadAction.svelte';
  import FavoriteAction from '$lib/components/timeline/actions/FavoriteAction.svelte';
  import TagAction from '$lib/components/timeline/actions/TagAction.svelte';
  import AssetSelectControlBar from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import type { TimelineAsset, Viewport } from '$lib/managers/timeline-manager/types';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { preferences } from '$lib/stores/user.store';
  import { cancelMultiselect } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { Icon, IconButton, LoadingSpinner } from '@immich/ui';
  import { AssetOrderBy, searchAssets } from '@immich/sdk';
  import { mdiImageOffOutline, mdiDotsVertical, mdiPlus, mdiSelectAll } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';
  import { onMount } from 'svelte';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const viewport: Viewport = $state({ width: 0, height: 0 });
  const assetInteraction = new AssetInteraction();

  let recentlyAddedElement: HTMLElement | undefined = $state();
  let nextPage = $state(1);
  let recentlyAddedAssets: TimelineAsset[] = $state([]);
  let isLoading = $state(true);

  const triggerAssetUpdate = async () => {
    nextPage = 1;
    recentlyAddedAssets = [];

    await loadNextPage(true);
  };

  const handleSelectAllAssets = () => {
    assetInteraction.selectAssets(recentlyAddedAssets.map((asset) => toTimelineAsset(asset)));
  };

  // eslint-disable-next-line svelte/valid-prop-names-in-kit-pages
  export const loadNextPage = async (force?: boolean) => {
    if (!nextPage || (isLoading && !force)) {
      return;
    }

    isLoading = true;

    try {
      const { assets } = await searchAssets({
        metadataSearchDto: {
          page: nextPage,
          withExif: true,
          orderBy: AssetOrderBy.DateAdded,
        },
      });

      recentlyAddedAssets.push(...assets.items.map((asset) => toTimelineAsset(asset)));

      nextPage = Number(assets.nextPage) || 0;
    } catch (error) {
      handleError(error, $t('errors.failed_to_load_recently_added_assets'));
    } finally {
      isLoading = false;
    }
  };

  onMount(async () => {
    await loadNextPage(true);
  });
</script>

<UserPageLayout title={data.meta.title}>
  <section
    class="mb-12 bg-immich-bg dark:bg-immich-dark-bg m-4 max-h-screen"
    bind:clientHeight={viewport.height}
    bind:clientWidth={viewport.width}
    bind:this={recentlyAddedElement}
  >
    <section>
      {#if recentlyAddedAssets.length > 0}
        <GalleryViewer
          assets={recentlyAddedAssets}
          {assetInteraction}
          onIntersected={loadNextPage}
          {viewport}
          onReload={triggerAssetUpdate}
          slidingWindowOffset={recentlyAddedElement.offsetTop}
        />
      {:else if !isLoading}
        <div class="flex min-h-[calc(66vh-11rem)] w-full place-content-center items-center dark:text-white">
          <div class="flex flex-col content-center items-center text-center">
            <Icon icon={mdiImageOffOutline} size="3.5em" />
            <p class="mt-5 text-3xl font-medium">{$t('no_results')}</p>
            <p class="text-base font-normal">{$t('no_results_description')}</p>
          </div>
        </div>
      {/if}

      {#if isLoading}
        <div class="flex justify-center py-16 items-center">
          <LoadingSpinner size="giant" />
        </div>
      {/if}
    </section>
  </section>
</UserPageLayout>

{#if assetInteraction.selectionActive}
  <div class="fixed top-0 start-0 w-full">
    <AssetSelectControlBar
      assets={assetInteraction.selectedAssets}
      clearSelect={() => cancelMultiselect(assetInteraction)}
    >
      <CreateSharedLink />
      <IconButton
        shape="round"
        color="secondary"
        variant="ghost"
        aria-label={$t('select_all')}
        icon={mdiSelectAll}
        onclick={handleSelectAllAssets}
      />
      <ButtonContextMenu icon={mdiPlus} title={$t('add_to')}>
        <AddToAlbum onAddToAlbum={() => cancelMultiselect(assetInteraction)} />
        <AddToAlbum onAddToAlbum={() => cancelMultiselect(assetInteraction)} shared />
      </ButtonContextMenu>
      <FavoriteAction
        removeFavorite={assetInteraction.isAllFavorite}
        onFavorite={(assetIds, isFavorite) => {
          for (const assetId of assetIds) {
            const asset = recentlyAddedAssets.find((recentAsset) => recentAsset.id === assetId);
            if (asset) {
              asset.isFavorite = isFavorite;
            }
          }
        }}
      />
      <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')}>
        <DownloadAction menuItem />
        <ChangeDate menuItem />
        <ChangeDescription menuItem />
        <ChangeLocation menuItem />
        <ArchiveAction menuItem unarchive={assetInteraction.isAllArchived} onArchive={triggerAssetUpdate} />
        {#if $preferences.tags.enabled && assetInteraction.isAllUserOwned}
          <TagAction menuItem />
        {/if}
        <DeleteAssets menuItem onAssetDelete={triggerAssetUpdate} onUndoDelete={triggerAssetUpdate} />
        <hr />
        <AssetJobActions />
      </ButtonContextMenu>
    </AssetSelectControlBar>
  </div>
{/if}
