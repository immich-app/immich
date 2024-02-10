<script lang="ts">
  import { type AssetResponseDto, api } from '@api';
  import { createEventDispatcher, onMount } from 'svelte';
  import { notificationController, NotificationType } from './notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import domtoimage from 'dom-to-image';
  import PhotoViewer from '../asset-viewer/photo-viewer.svelte';
  import BaseModal from './base-modal.svelte';
  import Button from '../elements/buttons/button.svelte';

  export let asset: AssetResponseDto;

  const dispatch = createEventDispatcher<{
    close: void;
  }>();
  let imgElement: HTMLDivElement;

  onMount(() => {
    imgElement.style.width = '100%';
  });

  const hasTransparentPixels = async (blob: Blob) => {
    const img = new Image();
    img.src = URL.createObjectURL(blob);
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get canvas context.');
    }
    context.drawImage(img, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData?.data;
    if (!data) {
      throw new Error('Could not get image data.');
    }
    for (let index = 0; index < data.length; index += 4) {
      if (data[index + 3] < 255) {
        return true;
      }
    }
    return false;
  };

  const handleSetProfilePicture = async () => {
    try {
      const blob = await domtoimage.toBlob(imgElement);
      if (await hasTransparentPixels(blob)) {
        notificationController.show({
          type: NotificationType.Error,
          message: 'Profile pictures cannot have transparent pixels. Please zoom in and/or move the image.',
          timeout: 3000,
        });
        return;
      }
      const file = new File([blob], 'profile-picture.png', { type: 'image/png' });
      await api.userApi.createProfileImage({ file });
      notificationController.show({
        type: NotificationType.Info,
        message: 'Profile picture set.',
        timeout: 3000,
      });
    } catch (error) {
      handleError(error, 'Error setting profile picture.');
    }
    dispatch('close');
  };
</script>

<BaseModal on:close>
  <svelte:fragment slot="title">
    <span class="flex place-items-center gap-2">
      <p class="font-medium">Set profile picture</p>
    </span>
  </svelte:fragment>
  <div class="flex place-items-center items-center justify-center">
    <div
      class="relative flex aspect-square w-1/2 overflow-hidden rounded-full border-4 border-immich-primary bg-immich-dark-primary dark:border-immich-dark-primary dark:bg-immich-primary"
    >
      <PhotoViewer bind:element={imgElement} {asset} />
    </div>
  </div>
  <span class="flex justify-end p-4">
    <Button on:click={handleSetProfilePicture}>
      <p>Set as profile picture</p>
    </Button>
  </span>
  <div class="mb-2 flex max-h-[400px] flex-col" />
</BaseModal>
