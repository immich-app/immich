<script lang="ts">
  import { Route } from '$lib/route';
  import { getAlbumInfo, type AlbumResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiChevronRight } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    album: AlbumResponseDto;
  }

  let { album }: Props = $props();

  let breadcrumbs = $state<{ id: string; name: string }[]>([]);

  const buildBreadcrumbs = async () => {
    const crumbs: { id: string; name: string }[] = [];
    let currentAlbum: AlbumResponseDto | null = album;

    // Walk up the parent chain
    while (currentAlbum?.parentId) {
      try {
        const parent = await getAlbumInfo({ id: currentAlbum.parentId, withoutAssets: true });
        crumbs.unshift({ id: parent.id, name: parent.albumName || 'Untitled Album' });
        currentAlbum = parent;
      } catch {
        break;
      }
    }

    breadcrumbs = crumbs;
  };

  onMount(() => {
    buildBreadcrumbs();
  });

  // Rebuild when album changes
  $effect(() => {
    album.parentId;
    buildBreadcrumbs();
  });
</script>

{#if breadcrumbs.length > 0}
  <nav class="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-2" aria-label="Breadcrumb">
    <a
      href={Route.albums()}
      class="hover:text-immich-primary dark:hover:text-immich-dark-primary transition-colors"
    >
      {$t('albums') ?? 'Albums'}
    </a>

    {#each breadcrumbs as crumb (crumb.id)}
      <Icon icon={mdiChevronRight} size="16" />
      <a
        href={Route.viewAlbum({ id: crumb.id })}
        class="hover:text-immich-primary dark:hover:text-immich-dark-primary transition-colors truncate max-w-[200px]"
        title={crumb.name}
      >
        {crumb.name}
      </a>
    {/each}

    <Icon icon={mdiChevronRight} size="16" />
    <span class="text-primary font-medium truncate max-w-[200px]" title={album.albumName}>
      {album.albumName || 'Untitled Album'}
    </span>
  </nav>
{/if}
