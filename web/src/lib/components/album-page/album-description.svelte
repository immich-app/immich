<script lang="ts">
  import { updateAlbumInfo } from '@immich/sdk';
  import { handleError } from '$lib/utils/handle-error';
  import ContentEditableDiv from '$lib/components/elements/content-editable-div.svelte';

  export let id: string;
  export let description: string;
  export let isOwned: boolean;

  $: newDescription = description;

  const handleUpdateDescription = async () => {
    if (newDescription === description) {
      return;
    }

    try {
      await updateAlbumInfo({
        id,
        updateAlbumDto: {
          description: newDescription,
        },
      });
    } catch (error) {
      handleError(error, 'Error updating album description');
      return;
    }
    description = newDescription;
  };
</script>

{#if isOwned || description}
  <ContentEditableDiv
    className="w-full mt-6 mb-7 pb-1 text-black dark:text-white border-b-2 border-transparent text-base outline-none
    transition-all focus:border-b-2 focus:border-immich-primary dark:focus:border-immich-dark-primary
    hover:border-gray-400 {isOwned ? '' : '!border-transparent'}"
    on:blur={handleUpdateDescription}
    bind:textContent={newDescription}
    title="Edit album description"
    placeholder="Add a description"
    disabled={!isOwned}
  />
{:else}
  <div class="mb-7" />
{/if}
