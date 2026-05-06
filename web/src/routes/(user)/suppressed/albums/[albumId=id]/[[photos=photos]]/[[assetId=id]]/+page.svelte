<script lang="ts">
  import { goto, invalidate } from '$app/navigation';
  import AlbumSummary from '$lib/components/album-page/AlbumSummary.svelte';
  import UserPageLayout from '$lib/components/layouts/UserPageLayout.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/ButtonContextMenu.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/EmptyPlaceholder.svelte';
  import ChangeDate from '$lib/components/timeline/actions/ChangeDateAction.svelte';
  import ChangeDescription from '$lib/components/timeline/actions/ChangeDescriptionAction.svelte';
  import ChangeLocation from '$lib/components/timeline/actions/ChangeLocationAction.svelte';
  import DownloadAction from '$lib/components/timeline/actions/DownloadAction.svelte';
  import RemoveFromAlbum from '$lib/components/timeline/actions/RemoveFromAlbumAction.svelte';
  import SelectAllAssets from '$lib/components/timeline/actions/SelectAllAction.svelte';
  import TagAction from '$lib/components/timeline/actions/TagAction.svelte';
  import AssetSelectControlBar from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import Timeline from '$lib/components/timeline/Timeline.svelte';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import { Route } from '$lib/route';
  import { AlbumUserRole, type AlbumResponseDto } from '@immich/sdk';
  import { IconButton } from '@immich/ui';
  import { mdiArrowLeft, mdiDotsVertical } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data = $bindable() }: Props = $props();
  let album: AlbumResponseDto = $derived(data.album);
  let timelineManager = $state<TimelineManager>() as TimelineManager;

  const options = $derived({
    albumId: album.id,
    order: album.order,
    suppressedOnly: true,
  });

  const isOwned = $derived(album.albumUsers[0].user.id === authManager.user.id);
  const isEditor = $derived(
    album.albumUsers.find(({ user: { id } }) => id === authManager.user.id)?.role === AlbumUserRole.Editor || isOwned,
  );

  const handleEscape = async () => {
    if (assetMultiSelectManager.selectionActive) {
      assetMultiSelectManager.clear();
      return;
    }
    await goto(Route.suppressed({ tab: 'albums' }));
  };

  const refreshAlbum = async () => {
    await invalidate('suppressed-album:data');
  };

  const handleRemoveAssets = async (assetIds: string[]) => {
    timelineManager.removeAssets(assetIds);
    assetMultiSelectManager.clear();
    await refreshAlbum();
  };
</script>

<UserPageLayout title={data.meta.title} hideNavbar={assetMultiSelectManager.selectionActive} scrollbar={false}>
  {#snippet buttons()}
    <IconButton
      aria-label={$t('go_back')}
      color="secondary"
      shape="round"
      variant="ghost"
      icon={mdiArrowLeft}
      onclick={() => goto(Route.suppressed({ tab: 'albums' }))}
    />
  {/snippet}

  <Timeline
    enableRouting={true}
    {album}
    bind:timelineManager
    {options}
    assetInteraction={assetMultiSelectManager}
    onEscape={handleEscape}
    withStacked={true}
  >
    <section class="pt-8 md:pt-24">
      <h1 class="line-clamp-2 max-w-5xl text-4xl font-semibold text-immich-fg dark:text-immich-dark-fg">
        {album.albumName}
      </h1>
      {#if album.assetCount > 0}
        <AlbumSummary {album} />
      {/if}
    </section>
    {#snippet empty()}
      <EmptyPlaceholder
        text={$t('no_suppressed_content_message')}
        title={$t('nothing_here_yet')}
        class="mx-auto mt-10"
      />
    {/snippet}
  </Timeline>
</UserPageLayout>

{#if assetMultiSelectManager.selectionActive}
  <AssetSelectControlBar>
    <SelectAllAssets {timelineManager} assetInteraction={assetMultiSelectManager} />
    <DownloadAction filename="{album.albumName}.zip" />
    <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')}>
      <DownloadAction menuItem filename="{album.albumName}.zip" />
      {#if assetMultiSelectManager.isAllUserOwned}
        <ChangeDate menuItem />
        <ChangeDescription menuItem />
        <ChangeLocation menuItem />
      {/if}
      {#if authManager.preferences.tags.enabled && assetMultiSelectManager.isAllUserOwned}
        <TagAction menuItem />
      {/if}
      {#if isEditor || assetMultiSelectManager.isAllUserOwned}
        <RemoveFromAlbum menuItem bind:album onRemove={handleRemoveAssets} />
      {/if}
    </ButtonContextMenu>
  </AssetSelectControlBar>
{/if}
