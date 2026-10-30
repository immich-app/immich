<script lang="ts">
  import AlbumCover from '#lib/components/album-page/AlbumCover.svelte';
  import { getAlbumQuery } from '#lib/queries/album.query.ts';
  import { queryClient } from '#lib/queries/client.ts';
  import { IconButton, Text, LoadingSpinner } from '@immich/ui';
  import { mdiTrashCanOutline } from '@mdi/js';
  import { createQuery } from '@tanstack/svelte-query';
  import { t } from 'svelte-i18n';

  interface Props {
    albumId: string;
    onDelete: () => unknown;
  }

  let { albumId, onDelete }: Props = $props();

  const query = createQuery(
    () => getAlbumQuery(albumId),
    () => queryClient,
  );
  const album = $derived(query.data);
</script>

<div>
  {#if query.isPending}
    <LoadingSpinner />
  {:else if album}
    <div class="flex gap-2">
      <AlbumCover {album} class="size-24" />
      <p
        class="line-clamp-2 grow text-lg/6 font-semibold text-black group-hover:text-primary dark:text-white"
        data-testid="album-name"
        title={album.albumName}
      >
        {album.albumName}
      </p>
      {#if album.description}
        <p
          class="line-clamp-2 grow text-lg/6 font-semibold text-black group-hover:text-primary dark:text-white"
          data-testid="album-name"
        >
          {album.description}
        </p>
      {/if}
      <div class="">
        <IconButton
          icon={mdiTrashCanOutline}
          shape="round"
          color="danger"
          variant="ghost"
          onclick={onDelete}
          aria-label={$t('remove')}
        />
      </div>
    </div>
  {:else}
    <div class="flex justify-between gap-2">
      <div class="flex flex-col gap-1">
        <Text>{$t('unknown')}</Text>
        <Text color="muted" size="small" variant="italic">{albumId}</Text>
      </div>
      <div class="">
        <IconButton
          icon={mdiTrashCanOutline}
          shape="round"
          color="danger"
          variant="ghost"
          onclick={onDelete}
          aria-label={$t('remove')}
        />
      </div>
    </div>
  {/if}
</div>
