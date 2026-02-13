<script lang="ts">
  import AlbumCard from '$lib/components/album-page/album-card.svelte';
  import { Route } from '$lib/route';
  import { createSubAlbumAndRedirect } from '$lib/utils/album-utils';
  import { getChildAlbums, type AlbumResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiPlus, mdiFolderMultipleOutline } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    album: AlbumResponseDto;
    isOwned: boolean;
  }

  let { album, isOwned }: Props = $props();

  let childAlbums = $state<AlbumResponseDto[]>([]);
  let isLoading = $state(true);

  const loadChildAlbums = async () => {
    try {
      childAlbums = await getChildAlbums({ id: album.id });
    } catch {
      childAlbums = [];
    } finally {
      isLoading = false;
    }
  };

  onMount(() => {
    loadChildAlbums();
  });

  // Reload when album changes
  $effect(() => {
    album.id;
    loadChildAlbums();
  });
</script>

{#if !isLoading && (childAlbums.length > 0 || isOwned)}
  <section class="my-6">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <Icon icon={mdiFolderMultipleOutline} size="20" class="text-immich-primary dark:text-immich-dark-primary" />
        <h2 class="text-lg font-semibold dark:text-white">{$t('sub_albums') ?? 'Sub-Albums'}</h2>
        {#if childAlbums.length > 0}
          <span class="text-sm text-gray-500 dark:text-gray-400">({childAlbums.length})</span>
        {/if}
      </div>
      {#if isOwned}
        <button
          type="button"
          class="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-immich-primary hover:bg-immich-primary/10 dark:text-immich-dark-primary dark:hover:bg-immich-dark-primary/10 transition-colors"
          onclick={() => createSubAlbumAndRedirect(album.id)}
        >
          <Icon icon={mdiPlus} size="18" />
          {$t('create_sub_album') ?? 'Create Sub-Album'}
        </button>
      {/if}
    </div>

    {#if childAlbums.length > 0}
      <div class="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))]">
        {#each childAlbums as childAlbum (childAlbum.id)}
          <a href={Route.viewAlbum(childAlbum)} data-sveltekit-preload-data="hover">
            <AlbumCard album={childAlbum} showItemCount />
          </a>
        {/each}
      </div>
    {:else if isOwned}
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {$t('no_sub_albums') ?? 'No sub-albums yet. Create one to organize your photos.'}
      </p>
    {/if}
  </section>
{/if}
