<script lang="ts">
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAsset, type AssetResponseDto } from '@immich/sdk';
  import AutogrowTextarea from '$lib/components/shared-components/autogrow-textarea.svelte';

  export let asset: AssetResponseDto;
  export let isOwner: boolean;

  $: description = asset.exifInfo?.description || '';

  const handleFocusOut = async (newDescription: string) => {
    try {
      await updateAsset({ id: asset.id, updateAssetDto: { description: newDescription } });
      notificationController.show({
        type: NotificationType.Info,
        message: 'Asset description has been updated',
      });
    } catch (error) {
      handleError(error, 'Cannot update the description');
    }
    description = newDescription;
  };
</script>

{#if isOwner}
  <section class="px-4 mt-10">
    <AutogrowTextarea
      content={description}
      class="max-h-[500px] w-full border-b border-gray-500 bg-transparent text-base text-black outline-none transition-all focus:border-b-2 focus:border-immich-primary disabled:border-none dark:text-white dark:focus:border-immich-dark-primary immich-scrollbar"
      onContentUpdate={handleFocusOut}
      placeholder="Add a description"
    />
  </section>
{:else if description}
  <section class="px-4 mt-6">
    <p class="break-words whitespace-pre-line w-full text-black dark:text-white text-base">{description}</p>
  </section>
{/if}
