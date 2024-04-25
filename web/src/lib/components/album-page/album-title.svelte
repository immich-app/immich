<script lang="ts">
  import { updateAlbumInfo } from '@immich/sdk';
  import { handleError } from '$lib/utils/handle-error';
  import ContentEditableDiv from '$lib/components/elements/content-editable-div.svelte';

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
      albumName = newAlbumName;
    } catch (error) {
      handleError(error, 'Failed to update album name');
    }
  };
</script>

<ContentEditableDiv
  className="w-full mt-2.5 mb-4 pb-2.5 text-4xl md:text-6xl border-b-2 border-transparent break-words
  outline-none focus:outline-none transition-all text-immich-primary dark:text-immich-dark-primary
  {isOwned ? 'hover:border-gray-400' : ''} focus:border-b-2 focus:border-immich-primary
  dark:focus:border-immich-dark-primary"
  on:blur={handleUpdateName}
  bind:textContent={newAlbumName}
  title="Edit album title"
  spellcheck={false}
  placeholder={isOwned ? 'Add a Title' : 'Untitled Album'}
  disabled={!isOwned}
  nowrap
/>
