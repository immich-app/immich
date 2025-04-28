<script lang="ts">
  import { afterNavigate, goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import UserPageLayout, { headerId } from '$lib/components/layouts/user-page-layout.svelte';
  import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
  import SideBarSection from '$lib/components/shared-components/side-bar/side-bar-section.svelte';
  import TreeItemThumbnails from '$lib/components/shared-components/tree/tree-item-thumbnails.svelte';
  import TreeItems from '$lib/components/shared-components/tree/tree-items.svelte';
  import { AppRoute, QueryParameter } from '$lib/constants';
  import type { Viewport } from '$lib/stores/assets-store.svelte';
  import { foldersStore } from '$lib/stores/folders.svelte';
  import { buildTree, normalizeTreePath } from '$lib/utils/tree-utils';
  import { mdiDotsVertical, mdiFolder, mdiFolderHome, mdiFolderOutline, mdiPlus, mdiSelectAll } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';
  import Breadcrumbs from '$lib/components/shared-components/tree/breadcrumbs.svelte';
  import SkipLink from '$lib/components/elements/buttons/skip-link.svelte';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import CreateSharedLink from '$lib/components/photos-page/actions/create-shared-link.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import AddToAlbum from '$lib/components/photos-page/actions/add-to-album.svelte';
  import AssetJobActions from '$lib/components/photos-page/actions/asset-job-actions.svelte';
  import DeleteAssets from '$lib/components/photos-page/actions/delete-assets.svelte';
  import TagAction from '$lib/components/photos-page/actions/tag-action.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import { preferences } from '$lib/stores/user.store';
  import { cancelMultiselect } from '$lib/utils/asset-utils';
  import DownloadAction from '$lib/components/photos-page/actions/download-action.svelte';
  import FavoriteAction from '$lib/components/photos-page/actions/favorite-action.svelte';
  import ArchiveAction from '$lib/components/photos-page/actions/archive-action.svelte';
  import ChangeDate from '$lib/components/photos-page/actions/change-date-action.svelte';
  import ChangeLocation from '$lib/components/photos-page/actions/change-location-action.svelte';

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

  onMount(async () => {
    await foldersStore.fetchUniquePaths();
  });

  const handleNavigation = async (folderName: string) => {
    await navigateToView(normalizeTreePath(`${data.path || ''}/${folderName}`));
  };

  const getLink = (path: string) => {
    const url = new URL(AppRoute.FOLDERS, globalThis.location.href);
    if (path) {
      url.searchParams.set(QueryParameter.PATH, path);
    }
    return url.href;
  };

  afterNavigate(() => {
    // Clear the asset selection when we navigate (like going to another folder)
    cancelMultiselect(assetInteraction);
  });

  const navigateToView = (path: string) => goto(getLink(path));

  const triggerAssetUpdate = async () => {
    cancelMultiselect(assetInteraction);
    await foldersStore.refreshAssetsByPath(data.path);
    await invalidateAll();
  };

  const handleSelectAll = () => {
    if (!data.pathAssets) {
      return;
    }

    assetInteraction.selectAssets(data.pathAssets);
  };
</script>

{#if assetInteraction.selectionActive}
  <div class="fixed z-[910] top-0 start-0 w-full">
    <AssetSelectControlBar
      assets={assetInteraction.selectedAssets}
      clearSelect={() => cancelMultiselect(assetInteraction)}
    >
      <CreateSharedLink />
      <CircleIconButton title={$t('select_all')} icon={mdiSelectAll} onclick={handleSelectAll} />
      <ButtonContextMenu icon={mdiPlus} title={$t('add_to')}>
        <AddToAlbum onAddToAlbum={() => cancelMultiselect(assetInteraction)} />
        <AddToAlbum onAddToAlbum={() => cancelMultiselect(assetInteraction)} shared />
      </ButtonContextMenu>
      <FavoriteAction
        removeFavorite={assetInteraction.isAllFavorite}
        onFavorite={(ids, isFavorite) => {
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
        <ChangeLocation menuItem />
        <ArchiveAction menuItem unarchive={assetInteraction.isAllArchived} onArchive={triggerAssetUpdate} />
        {#if $preferences.tags.enabled && assetInteraction.isAllUserOwned}
          <TagAction menuItem />
        {/if}
        <DeleteAssets menuItem onAssetDelete={triggerAssetUpdate} />
        <hr />
        <AssetJobActions />
      </ButtonContextMenu>
    </AssetSelectControlBar>
  </div>
{/if}

<UserPageLayout title={data.meta.title}>
  {#snippet sidebar()}
    <SideBarSection>
      <SkipLink target={`#${headerId}`} text={$t('skip_to_folders')} breakpoint="md" />
      <section>
        <div class="text-xs ps-4 mb-2 dark:text-white">{$t('explorer').toUpperCase()}</div>
        <div class="h-full">
          <TreeItems
            icons={{ default: mdiFolderOutline, active: mdiFolder }}
            items={tree}
            active={currentPath}
            {getLink}
          />
        </div>
      </section>
    </SideBarSection>
  {/snippet}

  <Breadcrumbs {pathSegments} icon={mdiFolderHome} title={$t('folders')} {getLink} />

  <section class="mt-2 h-[calc(100%-theme(spacing.20))] overflow-auto immich-scrollbar">
    <TreeItemThumbnails items={currentTreeItems} icon={mdiFolder} onClick={handleNavigation} />

    <!-- Assets -->
    {#if data.pathAssets && data.pathAssets.length > 0}
      <div bind:clientHeight={viewport.height} bind:clientWidth={viewport.width} class="mt-2">
        <GalleryViewer
          assets={data.pathAssets}
          {assetInteraction}
          {viewport}
          showAssetName={true}
          pageHeaderOffset={54}
        />
      </div>
    {/if}
  </section>
</UserPageLayout>
