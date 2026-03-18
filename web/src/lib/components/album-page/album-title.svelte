<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAlbumInfo } from '@immich/sdk';
  import { t } from 'svelte-i18n';
  import { tv } from 'tailwind-variants';

  interface Props {
    id: string;
    albumName: string;
    isOwned: boolean;
    onUpdate: (albumName: string) => void;
  }

  let { id, albumName = $bindable(), isOwned, onUpdate }: Props = $props();

  let newAlbumName = $derived(albumName);

  const handleUpdateName = async () => {
    if (newAlbumName === albumName) {
      return;
    }

    try {
      const response = await updateAlbumInfo({
        id,
        updateAlbumDto: {
          albumName: newAlbumName,
        },
      });
      ({ albumName } = response);
      eventManager.emit('AlbumUpdate', response);
      onUpdate(albumName);
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_album'));
      return;
    }
  };

  const styles = tv({
    base: 'w-[99%] mb-2 border-b-2 border-transparent text-2xl md:text-4xl lg:text-6xl text-primary outline-none transition-all focus:border-b-2 focus:border-immich-primary focus:outline-none bg-light dark:focus:border-immich-dark-primary dark:focus:bg-immich-dark-gray placeholder:text-primary/90',
    variants: {
      isOwned: {
        true: 'hover:border-gray-400',
        false: 'hover:border-transparent',
      },
    },
  });
</script>

<input
  use:shortcut={{ shortcut: { key: 'Enter' }, onShortcut: (e) => e.currentTarget.blur() }}
  onblur={handleUpdateName}
  class={styles({ isOwned })}
  type="text"
  bind:value={newAlbumName}
  disabled={!isOwned}
  title={$t('edit_title')}
  placeholder={$t('add_a_title')}
/>
