<script lang="ts">
  import { autoGrowHeight } from '$lib/actions/autogrow';
  import { updateAlbumInfo } from '@immich/sdk';
  import { handleError } from '$lib/utils/handle-error';
  import { shortcut } from '$lib/actions/shortcut';

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

{#if isOwned}
  <textarea
    class="w-full mt-2 resize-none text-black dark:text-white border-b-2 border-transparent border-gray-500 bg-transparent text-base outline-none transition-all focus:border-b-2 focus:border-immich-primary disabled:border-none dark:focus:border-immich-dark-primary hover:border-gray-400"
    bind:value={newDescription}
    on:input={(e) => autoGrowHeight(e.currentTarget)}
    on:focusout={handleUpdateDescription}
    use:autoGrowHeight
    placeholder="Add a description"
    use:shortcut={{
      shortcut: { key: 'Enter', ctrl: true },
      onShortcut: (e) => e.currentTarget.blur(),
    }}
  />
{:else if description}
  <p class="break-words whitespace-pre-line w-full text-black dark:text-white text-base">
    {description}
  </p>
{/if}
