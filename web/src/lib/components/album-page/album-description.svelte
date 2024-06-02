<script lang="ts">
  import { updateAlbumInfo } from '@immich/sdk';
  import { handleError } from '$lib/utils/handle-error';
  import AutogrowTextarea from '$lib/components/shared-components/autogrow-textarea.svelte';

  export let id: string;
  export let description: string;
  export let isOwned: boolean;

  const handleUpdateDescription = async (newDescription: string) => {
    try {
      await updateAlbumInfo({
        id,
        updateAlbumDto: {
          description: newDescription,
        },
      });
    } catch (error) {
      handleError(error, 'Error updating album description');
    }
    description = newDescription;
  };
</script>

{#if isOwned}
  <AutogrowTextarea
    content={description}
    class="w-full mt-2 text-black dark:text-white border-b-2 border-transparent border-gray-500 bg-transparent text-base outline-none transition-all focus:border-b-2 focus:border-immich-primary disabled:border-none dark:focus:border-immich-dark-primary hover:border-gray-400"
    onContentUpdate={handleUpdateDescription}
    placeholder="Add a description"
  />
{:else if description}
  <p class="break-words whitespace-pre-line w-full text-black dark:text-white text-base">
    {description}
  </p>
{/if}
