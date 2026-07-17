<script lang="ts">
  import { updateAlbumInfo, type AlbumResponseDto } from '@immich/sdk';
  import { Textarea } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fromAction } from 'svelte/attachments';
  import { shortcut } from '$lib/actions/shortcut';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { redirectIfLockedAndNotElevated } from '$lib/services/album.service';
  import { handleError } from '$lib/utils/handle-error';

  type Props = {
    album: AlbumResponseDto;
    albumName: string;
    isOwned: boolean;
    onUpdate: (albumName: string) => void;
  };

  let { album, albumName = $bindable(), isOwned, onUpdate }: Props = $props();
  const id = $derived(album.id);

  let newAlbumName = $derived(albumName);

  const handleUpdate = async () => {
    newAlbumName = newAlbumName.replaceAll('\n', ' ').trim();

    if (newAlbumName === albumName) {
      return;
    }

    if (await redirectIfLockedAndNotElevated(album)) {
      return;
    }

    try {
      const response = await updateAlbumInfo({ id, updateAlbumDto: { albumName: newAlbumName } });
      ({ albumName } = response);
      eventManager.emit('AlbumUpdate', response);
      onUpdate(albumName);
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_album'));
    }
  };

  const textClasses = 'text-2xl lg:text-6xl text-primary';
</script>

<div class="mb-2">
  {#if isOwned}
    <Textarea
      bind:value={newAlbumName}
      variant="ghost"
      title={$t('edit_title')}
      onblur={handleUpdate}
      placeholder={$t('add_a_title')}
      class={textClasses}
      {@attach fromAction(shortcut, () => ({
        shortcut: { key: 'Enter' },
        onShortcut: (event) => event.currentTarget.blur(),
      }))}
    />
  {:else}
    <div class={textClasses}>{newAlbumName}</div>
  {/if}
</div>
