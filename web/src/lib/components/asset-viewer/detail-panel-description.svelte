<script lang="ts">
  import { autoGrowHeight } from '$lib/actions/autogrow';
  import { clickOutside } from '$lib/actions/click-outside';
  import { shortcut } from '$lib/actions/shortcut';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAsset, type AssetResponseDto } from '@immich/sdk';
  import { tick } from 'svelte';

  export let asset: AssetResponseDto;
  export let isOwner: boolean;

  let textarea: HTMLTextAreaElement;
  $: description = asset.exifInfo?.description || '';
  $: newDescription = description;

  $: if (textarea) {
    newDescription;
    void tick().then(() => autoGrowHeight(textarea));
  }

  const handleFocusOut = async () => {
    if (description === newDescription) {
      return;
    }

    try {
      await updateAsset({ id: asset.id, updateAssetDto: { description: newDescription } });
      notificationController.show({
        type: NotificationType.Info,
        message: 'Asset description has been updated',
      });
    } catch (error) {
      handleError(error, 'Cannot update the description');
    }
  };
</script>

{#if isOwner}
  <section class="px-4 mt-10">
    <textarea
      bind:this={textarea}
      class="max-h-[500px] w-full resize-none border-b border-gray-500 bg-transparent text-base text-black outline-none transition-all focus:border-b-2 focus:border-immich-primary disabled:border-none dark:text-white dark:focus:border-immich-dark-primary immich-scrollbar"
      placeholder="Add a description"
      on:focusout={handleFocusOut}
      on:input={(e) => (newDescription = e.currentTarget.value)}
      value={description}
      use:clickOutside={{ onOutclick: void handleFocusOut }}
      use:shortcut={{
        shortcut: { key: 'Enter', ctrl: true },
        onShortcut: (e) => e.currentTarget.blur(),
      }}
    />
  </section>
{:else if description}
  <section class="px-4 mt-6">
    <p class="break-words whitespace-pre-line w-full text-black dark:text-white text-base">{description}</p>
  </section>
{/if}
