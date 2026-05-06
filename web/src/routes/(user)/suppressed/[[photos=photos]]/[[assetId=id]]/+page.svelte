<script lang="ts">
  import { goto } from '$app/navigation';
  import Albums from '$lib/components/album-page/AlbumsList.svelte';
  import UserPageLayout from '$lib/components/layouts/UserPageLayout.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/ButtonContextMenu.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/EmptyPlaceholder.svelte';
  import DownloadAction from '$lib/components/timeline/actions/DownloadAction.svelte';
  import SelectAllAssets from '$lib/components/timeline/actions/SelectAllAction.svelte';
  import TagAction from '$lib/components/timeline/actions/TagAction.svelte';
  import AssetSelectControlBar from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import Timeline from '$lib/components/timeline/Timeline.svelte';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import { Route } from '$lib/route';
  import { albumViewSettings } from '$lib/stores/preferences.store';
  import { AssetVisibility } from '@immich/sdk';
  import { mdiDotsVertical } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let timelineManager = $state<TimelineManager>() as TimelineManager;
  let pendingTab: 'timeline' | 'albums' | undefined = $state();
  let activeTab: 'timeline' | 'albums' = $derived(pendingTab ?? (data.tab === 'albums' ? 'albums' : 'timeline'));
  let searchQuery = $state('');
  let albumGroups: string[] = $state([]);

  const options = {
    visibility: AssetVisibility.Timeline,
    withStacked: true,
    withPartners: true,
    suppressedOnly: true,
  };

  const setTab = async (tab: 'timeline' | 'albums') => {
    pendingTab = tab;
    try {
      await goto(Route.suppressed({ tab }), { keepFocus: true, noScroll: true, replaceState: true });
    } finally {
      pendingTab = undefined;
    }
  };

  const handleEscape = () => {
    if (assetMultiSelectManager.selectionActive) {
      assetMultiSelectManager.clear();
    }
  };
</script>

<UserPageLayout title={data.meta.title} hideNavbar={assetMultiSelectManager.selectionActive} scrollbar={false}>
  {#snippet buttons()}
    <div class="inline-flex rounded-full border border-gray-300 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-900">
      <button
        type="button"
        class="rounded-full px-4 py-1.5 text-sm transition-colors"
        class:bg-primary={activeTab === 'timeline'}
        class:text-white={activeTab === 'timeline'}
        class:dark:text-immich-dark-gray={activeTab === 'timeline'}
        onclick={() => setTab('timeline')}
      >
        {$t('timeline')}
      </button>
      <button
        type="button"
        class="rounded-full px-4 py-1.5 text-sm transition-colors"
        class:bg-primary={activeTab === 'albums'}
        class:text-white={activeTab === 'albums'}
        class:dark:text-immich-dark-gray={activeTab === 'albums'}
        onclick={() => setTab('albums')}
      >
        {$t('albums')}
      </button>
    </div>
  {/snippet}

  {#if activeTab === 'timeline'}
    <Timeline
      enableRouting={true}
      bind:timelineManager
      {options}
      assetInteraction={assetMultiSelectManager}
      onEscape={handleEscape}
      withStacked
    >
      {#snippet empty()}
        <EmptyPlaceholder
          text={$t('no_suppressed_content_message')}
          title={$t('nothing_here_yet')}
          class="mx-auto mt-10"
        />
      {/snippet}
    </Timeline>
  {:else}
    <div class="h-full overflow-y-auto p-4 md:px-6">
      <Albums
        ownedAlbums={data.ownedAlbums}
        sharedAlbums={data.sharedAlbums}
        userSettings={$albumViewSettings}
        showOwner
        showContextMenu={false}
        {searchQuery}
        getAlbumHref={Route.suppressedAlbum}
        bind:albumGroupIds={albumGroups}
      >
        {#snippet empty()}
          <EmptyPlaceholder
            text={$t('no_suppressed_albums_message')}
            title={$t('nothing_here_yet')}
            class="mx-auto mt-10"
          />
        {/snippet}
      </Albums>
    </div>
  {/if}
</UserPageLayout>

{#if assetMultiSelectManager.selectionActive}
  <AssetSelectControlBar>
    <SelectAllAssets {timelineManager} assetInteraction={assetMultiSelectManager} />
    <DownloadAction />
    {#if authManager.preferences.tags.enabled && assetMultiSelectManager.isAllUserOwned}
      <TagAction />
    {/if}
    <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')}>
      <DownloadAction menuItem />
      {#if authManager.preferences.tags.enabled && assetMultiSelectManager.isAllUserOwned}
        <TagAction menuItem />
      {/if}
    </ButtonContextMenu>
  </AssetSelectControlBar>
{/if}
