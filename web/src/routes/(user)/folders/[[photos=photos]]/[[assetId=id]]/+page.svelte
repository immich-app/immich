<script lang="ts">
  import { afterNavigate, goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import SkipLink from '$lib/components/elements/buttons/skip-link.svelte';
  import UserPageLayout, { headerId } from '$lib/components/layouts/user-page-layout.svelte';
  import AddToAlbum from '$lib/components/photos-page/actions/add-to-album.svelte';
  import ArchiveAction from '$lib/components/photos-page/actions/archive-action.svelte';
  import AssetJobActions from '$lib/components/photos-page/actions/asset-job-actions.svelte';
  import ChangeDate from '$lib/components/photos-page/actions/change-date-action.svelte';
  import ChangeDescription from '$lib/components/photos-page/actions/change-description-action.svelte';
  import ChangeLocation from '$lib/components/photos-page/actions/change-location-action.svelte';
  import CreateSharedLink from '$lib/components/photos-page/actions/create-shared-link.svelte';
  import DeleteAssets from '$lib/components/photos-page/actions/delete-assets.svelte';
  import DownloadAction from '$lib/components/photos-page/actions/download-action.svelte';
  import FavoriteAction from '$lib/components/photos-page/actions/favorite-action.svelte';
  import TagAction from '$lib/components/photos-page/actions/tag-action.svelte';
  import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
  import Breadcrumbs from '$lib/components/shared-components/tree/breadcrumbs.svelte';
  import TreeItemThumbnails from '$lib/components/shared-components/tree/tree-item-thumbnails.svelte';
  import TreeItems from '$lib/components/shared-components/tree/tree-items.svelte';
  import Sidebar from '$lib/components/sidebar/sidebar.svelte';
  import { AppRoute, QueryParameter } from '$lib/constants';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import type { Viewport } from '$lib/stores/assets-store.svelte';
  import { foldersStore } from '$lib/stores/folders.svelte';
  import { preferences } from '$lib/stores/user.store';
  import { cancelMultiselect } from '$lib/utils/asset-utils';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { buildTree, normalizeTreePath } from '$lib/utils/tree-utils';
  import { mdiDotsVertical, mdiFolder, mdiFolderHome, mdiFolderOutline, mdiPlus, mdiSelectAll } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const viewport: Viewport = $state({ width: 0, height: 0 });

  let pathSegments = $derived(data.path ? data.path.split('/') : []);
  let tree = $derived(buildTree(foldersStore.uniquePaths));
  let currentPath = $derived($page.url.searchParams.get(QueryParameter.PATH) || '');
  let currentTreeItems = $derived(currentPath ? data.currentFolders : Object.keys(tree).sort());

  const assetInteraction = new AssetInteraction();

  onMount(async function initializeFolders() {
    await foldersStore.fetchUniquePaths();
  });

  const handleNavigateToFolder = async function handleNavigateToFolder(folderName: string) {
    await navigateToView(normalizeTreePath(`${data.path || ''}/${folderName}`));
  };

  const getLinkForPath = function getLinkForPath(path: string) {
    const url = new URL(AppRoute.FOLDERS, globalThis.location.href);
    if (path) {
      url.searchParams.set(QueryParameter.PATH, path);
    }
    return url.href;
  };

  afterNavigate(function clearAssetSelection() {
    // Clear the asset selection when we navigate (like going to another folder)
    cancelMultiselect(assetInteraction);
  });

  const navigateToView = function navigateToView(path: string) {
    return goto(getLinkForPath(path));
  };

  const triggerAssetUpdate = async function updateAssets() {
    cancelMultiselect(assetInteraction);
    await foldersStore.refreshAssetsByPath(data.path);
    await invalidateAll();
  };

  const handleSelectAllAssets = function handleSelectAllAssets() {
    if (!data.pathAssets) {
      return;
    }

    assetInteraction.selectAssets(data.pathAssets.map((asset) => toTimelineAsset(asset)));
  };
</script>

<UserPageLayout title={data.meta.title}>
  {#snippet sidebar()}
    <Sidebar>
      <SkipLink target={`#${headerId}`} text={$t('skip_to_folders')} breakpoint="md" />
      <section>
        <div class="text-xs ps-4 mb-2 dark:text-white">{$t('explorer').toUpperCase()}</div>
        <div class="h-full">
          <TreeItems
            icons={{ default: mdiFolderOutline, active: mdiFolder }}
            items={tree}
            active={currentPath}
            getLink={getLinkForPath}
          />
        </div>
      </section>
    </Sidebar>
  {/snippet}

  <Breadcrumbs {pathSegments} icon={mdiFolderHome} title={$t('folders')} getLink={getLinkForPath} />

  <section class="mt-2 h-[calc(100%-(--spacing(20)))] overflow-auto immich-scrollbar">
    <TreeItemThumbnails items={currentTreeItems} icon={mdiFolder} onClick={handleNavigateToFolder} />

    <!-- Assets -->
    {#if data.pathAssets && data.pathAssets.length > 0}
      <div bind:clientHeight={viewport.height} bind:clientWidth={viewport.width} class="mt-2">
        <GalleryViewer
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
      <CircleIconButton title={$t('select_all')} icon={mdiSelectAll} onclick={handleSelectAllAssets} />
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
        <DeleteAssets menuItem onAssetDelete={triggerAssetUpdate} onUndoDelete={triggerAssetUpdate}/>
        <hr />
        <AssetJobActions />
      </ButtonContextMenu>
    </AssetSelectControlBar>
  </div>
{/if}
