<script lang="ts">
  import { updateAlbumInfo } from '@immich/sdk';
  import { handleError } from '$lib/utils/handle-error';
  import { shortcut } from '$lib/actions/shortcut';

  export let id: string;
  export let albumName: string;
  export let isOwned: boolean;

  $: newAlbumName = albumName;

  const handleUpdateName = async () => {
    if (newAlbumName === albumName) {
      return;
    }

    try {
      await updateAlbumInfo({
        id,
        updateAlbumDto: {
          albumName: newAlbumName,
        },
      });
    } catch (error) {
      handleError(error, 'Unable to update album name');
      return;
    }
    albumName = newAlbumName;
  };
</script>

<input
  use:shortcut={{ shortcut: { key: 'Enter' }, onShortcut: (e) => e.currentTarget.blur() }}
  on:blur={handleUpdateName}
  class="w-[99%] mb-2 border-b-2 border-transparent text-6xl text-immich-primary outline-none transition-all dark:text-immich-dark-primary {isOwned
    ? 'hover:border-gray-400'
    : 'hover:border-transparent'} bg-immich-bg focus:border-b-2 focus:border-immich-primary focus:outline-none dark:bg-immich-dark-bg dark:focus:border-immich-dark-primary dark:focus:bg-immich-dark-gray"
  type="text"
  bind:value={newAlbumName}
  disabled={!isOwned}
  title="Edit Title"
  placeholder="Add a title"
/>
