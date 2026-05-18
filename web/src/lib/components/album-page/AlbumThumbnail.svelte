<script lang="ts">
  import AlbumCover from '$lib/components/album-page/AlbumCover.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { getAlbumInfo } from '@immich/sdk';
  import { IconButton, LoadingSpinner } from '@immich/ui';
  import { mdiTrashCanOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    albumId: string;
    onDelete: () => unknown;
  }

  let { albumId, onDelete }: Props = $props();
</script>

<div>
  {#await getAlbumInfo({ ...authManager.params, id: albumId })}
    <LoadingSpinner />
  {:then album}
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
  {/await}
</div>
