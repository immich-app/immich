<script lang="ts">
  import { afterNavigate, goto, invalidateAll } from '$app/navigation';
  import UserPageLayout, { headerId } from '$lib/components/layouts/user-page-layout.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
  import Breadcrumbs from '$lib/components/shared-components/tree/breadcrumbs.svelte';
  import TreeItemThumbnails from '$lib/components/shared-components/tree/tree-item-thumbnails.svelte';
  import TreeItems from '$lib/components/shared-components/tree/tree-items.svelte';
  import Sidebar from '$lib/components/sidebar/sidebar.svelte';
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
  import { AppRoute, QueryParameter } from '$lib/constants';
  import SkipLink from '$lib/elements/SkipLink.svelte';
  import type { Viewport } from '$lib/managers/timeline-manager/types';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { foldersStore } from '$lib/stores/folders.svelte';
  import { preferences } from '$lib/stores/user.store';
  import { cancelMultiselect } from '$lib/utils/asset-utils';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { joinPaths } from '$lib/utils/tree-utils';
  import { IconButton } from '@immich/ui';
  import { mdiDotsVertical, mdiFolder, mdiFolderHome, mdiFolderOutline, mdiPlus, mdiSelectAll } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const viewport: Viewport = $state({ width: 0, height: 0 });
  const assetInteraction = new AssetInteraction();

  const handleNavigateToFolder = (folderName: string) => navigateToView(joinPaths(data.tree.path, folderName));

  function getLinkForPath(path: string) {
    const url = new URL(AppRoute.FOLDERS, globalThis.location.href);
    url.searchParams.set(QueryParameter.PATH, path);
    return url.href;
  }

  afterNavigate(function clearAssetSelection() {
    // Clear the asset selection when we navigate (like going to another folder)
    cancelMultiselect(assetInteraction);
  });

  function navigateToView(path: string) {
    return goto(getLinkForPath(path), { keepFocus: true, noScroll: true });
  }

  async function triggerAssetUpdate() {
    cancelMultiselect(assetInteraction);
    if (data.tree.path) {
      await foldersStore.refreshAssetsByPath(data.tree.path);
    }
    await invalidateAll();
  }

  function handleSelectAllAssets() {
    if (!data.pathAssets) {
      return;
    }

    assetInteraction.selectAssets(data.pathAssets.map((asset) => toTimelineAsset(asset)));
  }
</script>

<UserPageLayout title={data.meta.title}>
  {#snippet sidebar()}
    <Sidebar>
      <SkipLink target={`#${headerId}`} text={$t('skip_to_folders')} breakpoint="md" />
      <section>
        <div class="uppercase text-xs ps-4 mb-2 dark:text-white">{$t('explorer')}</div>
        <div class="h-full">
          <TreeItems
            icons={{ default: mdiFolderOutline, active: mdiFolder }}
            tree={foldersStore.folders!}
            active={data.tree.path}
            getLink={getLinkForPath}
          />
        </div>
      </section>
    </Sidebar>
  {/snippet}

  <Breadcrumbs node={data.tree} icon={mdiFolderHome} title={$t('folders')} getLink={getLinkForPath} />

  <section class="mt-2 h-[calc(100%-(--spacing(20)))] overflow-auto immich-scrollbar">
    <TreeItemThumbnails items={data.tree.children} icon={mdiFolder} onClick={handleNavigateToFolder} />

    <!-- Assets -->
    {#if data.pathAssets && data.pathAssets.length > 0}
      <div bind:clientHeight={viewport.height} bind:clientWidth={viewport.width} class="mt-2">
        <GalleryViewer
          initialAssetId={data.asset?.id}
          assets={data.pathAssets}
          {assetInteraction}
          {viewport}
          showAssetName={true}
          pageHeaderOffset={54}
          onReload={triggerAssetUpdate}
        />
      </div>
    {/if}
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
        onFavorite={function handleFavoriteUpdate(ids, isFavorite) {
          if (data.pathAssets && data.pathAssets.length > 0) {
            for (const id of ids) {
              const asset = data.pathAssets.find((asset) => asset.id === id);
              if (asset) {
                asset.isFavorite = isFavorite;
              }
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
