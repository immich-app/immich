<script lang="ts">
  import AlbumThumbnail from '$lib/components/album-page/AlbumThumbnail.svelte';
  import { Button, Text, Label, modalManager } from '@immich/ui';
  import AlbumPickerModal from '$lib/modals/AlbumPickerModal.svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    label: string;
    description?: string;
    albumIds: string[];
    array?: boolean;
  };

  let { array, label, description, albumIds = $bindable([]) }: Props = $props();

  const onAlbums = async () => {
    const albums = await modalManager.show(AlbumPickerModal);
    if (!albums || albums.length === 0) {
      return;
    }

    albumIds = array ? [...albumIds, ...albums.map((album) => album.id)] : [albums[0].id];
  };
</script>

{#snippet button()}
  <Button size="small" shape="round" color="secondary" onclick={() => onAlbums()}>{$t('choose')}</Button>
{/snippet}

<div class="flex flex-col gap-2">
  <div class="flex flex-col gap-0.5">
    <Label for="album-picker" size="small" class="font-medium" {label} />
    {#if description}
      <Text color="muted" size="small">{description}</Text>
    {/if}
  </div>

  {#if array}
    <div class="flex flex-col gap-2">
      {#each albumIds as albumId, i (i)}
        <AlbumThumbnail
          {albumId}
          onDelete={() => {
            albumIds.splice(i, 1);
            albumIds = [...albumIds];
          }}
        />
      {/each}
      {@render button()}
    </div>
  {:else}
    {@const albumId = albumIds[0]}
    {#if albumId}
      <AlbumThumbnail {albumId} onDelete={() => (albumIds = [])} />
    {:else}
      {@render button()}
    {/if}
  {/if}
</div>
