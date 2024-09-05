<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import UserPageLayout, { headerId } from '$lib/components/layouts/user-page-layout.svelte';
  import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
  import SideBarSection from '$lib/components/shared-components/side-bar/side-bar-section.svelte';
  import TreeItemThumbnails from '$lib/components/shared-components/tree/tree-item-thumbnails.svelte';
  import TreeItems from '$lib/components/shared-components/tree/tree-items.svelte';
  import { AppRoute, QueryParameter } from '$lib/constants';
  import type { Viewport } from '$lib/stores/assets.store';
  import { foldersStore } from '$lib/stores/folders.store';
  import { buildTree, normalizeTreePath } from '$lib/utils/tree-utils';
  import { type AssetResponseDto } from '@immich/sdk';
  import { mdiFolder, mdiFolderHome, mdiFolderOutline } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';
  import Breadcrumbs from '$lib/components/shared-components/tree/breadcrumbs.svelte';
  import SkipLink from '$lib/components/elements/buttons/skip-link.svelte';

  export let data: PageData;

  let selectedAssets: Set<AssetResponseDto> = new Set();
  const viewport: Viewport = { width: 0, height: 0 };

  $: pathSegments = data.path ? data.path.split('/') : [];
  $: tree = buildTree($foldersStore?.uniquePaths || []);
  $: currentPath = $page.url.searchParams.get(QueryParameter.PATH) || '';
  $: currentTreeItems = currentPath ? data.currentFolders : Object.keys(tree);

  onMount(async () => {
    await foldersStore.fetchUniquePaths();
  });

  const handleNavigation = async (folderName: string) => {
    await navigateToView(normalizeTreePath(`${data.path || ''}/${folderName}`));
  };

  const getLink = (path: string) => {
    const url = new URL(AppRoute.FOLDERS, window.location.href);
    if (path) {
      url.searchParams.set(QueryParameter.PATH, path);
    }
    return url.href;
  };

  const navigateToView = (path: string) => goto(getLink(path));
</script>

<UserPageLayout title={data.meta.title}>
  <SideBarSection slot="sidebar">
    <SkipLink target={`#${headerId}`} text={$t('skip_to_folders')} />
    <section>
      <div class="text-xs pl-4 mb-2 dark:text-white">{$t('explorer').toUpperCase()}</div>
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

  <Breadcrumbs {pathSegments} icon={mdiFolderHome} title={$t('folders')} {getLink} />

  <section class="mt-2">
    <TreeItemThumbnails items={currentTreeItems} icon={mdiFolder} onClick={handleNavigation} />

    <!-- Assets -->
    {#if data.pathAssets && data.pathAssets.length > 0}
      <div bind:clientHeight={viewport.height} bind:clientWidth={viewport.width} class="mt-2">
        <GalleryViewer
          assets={data.pathAssets}
          bind:selectedAssets
          {viewport}
          disableAssetSelect={true}
          showAssetName={true}
        />
      </div>
    {/if}
  </section>
</UserPageLayout>
