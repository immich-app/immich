<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
  import SideBarSection from '$lib/components/shared-components/side-bar/side-bar-section.svelte';
  import TreeItemThumbnails from '$lib/components/shared-components/tree/tree-item-thumbnails.svelte';
  import TreeItems from '$lib/components/shared-components/tree/tree-items.svelte';
  import { AppRoute, QueryParameter } from '$lib/constants';
  import type { Viewport } from '$lib/stores/assets.store';
  import { foldersStore } from '$lib/stores/folders.store';
  import { buildTree, normalizeTreePath } from '$lib/utils/tree-utils';
  import { type AssetResponseDto } from '@immich/sdk';
  import { mdiArrowUpLeft, mdiChevronRight, mdiFolder, mdiFolderHome, mdiFolderOutline } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  export let data: PageData;

  let selectedAssets: Set<AssetResponseDto> = new Set();
  const viewport: Viewport = { width: 0, height: 0 };

  $: pathSegments = data.path ? data.path.split('/') : [];
  $: tree = buildTree($foldersStore?.uniquePaths || []);
  $: currentPath = $page.url.searchParams.get(QueryParameter.PATH) || '';

  onMount(async () => {
    await foldersStore.fetchUniquePaths();
  });

  const handleNavigation = async (folderName: string) => {
    await navigateToView(normalizeTreePath(`${data.path || ''}/${folderName}`));
  };

  const handleBackNavigation = async () => {
    if (data.path) {
      const parentPath = data.path.split('/').slice(0, -1).join('/');
      await navigateToView(parentPath);
    }
  };

  const handleBreadcrumbNavigation = async (targetPath: string) => {
    await navigateToView(targetPath);
  };

  const getLink = (path: string) => {
    const url = new URL(AppRoute.FOLDERS, window.location.href);
    url.searchParams.set(QueryParameter.PATH, path);
    return url.href;
  };

  const navigateToView = (path: string) => goto(getLink(path));
</script>

<UserPageLayout title={data.meta.title}>
  <SideBarSection slot="sidebar">
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

  <section id="path-summary" class="text-immich-primary dark:text-immich-dark-primary rounded-xl flex">
    {#if data.path}
      <CircleIconButton icon={mdiArrowUpLeft} title="Back" on:click={handleBackNavigation} class="mr-2" padding="2" />
    {/if}

    <div
      class="flex place-items-center gap-2 bg-gray-50 dark:bg-immich-dark-gray/50 w-full py-2 px-4 rounded-2xl border border-gray-100 dark:border-gray-900"
    >
      <a href={`${AppRoute.FOLDERS}`} title={$t('to_root')}>
        <Icon path={mdiFolderHome} class="text-immich-primary dark:text-immich-dark-primary mr-2" size={28} />
      </a>
      {#each pathSegments as segment, index}
        <button
          class="text-sm font-mono underline hover:font-semibold"
          on:click={() => handleBreadcrumbNavigation(pathSegments.slice(0, index + 1).join('/'))}
          type="button"
        >
          {segment}
        </button>
        <p class="text-gray-500">
          {#if index < pathSegments.length - 1}
            <Icon path={mdiChevronRight} class="text-gray-500 dark:text-gray-300" size={16} />
          {/if}
        </p>
      {/each}
    </div>
  </section>

  <section class="mt-2">
    <TreeItemThumbnails items={data.currentFolders} icon={mdiFolder} onClick={handleNavigation} />

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
