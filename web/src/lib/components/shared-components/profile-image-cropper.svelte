<script lang="ts">
  import { AssetResponseDto, api } from '@api';
  import { createEventDispatcher } from 'svelte';
  import { notificationController, NotificationType } from './notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import domtoimage from 'dom-to-image';
  import PhotoViewer from '../asset-viewer/photo-viewer.svelte';
  import BaseModal from './base-modal.svelte';
  import Button from '../elements/buttons/button.svelte';

  export let asset: AssetResponseDto;

  const dispatch = createEventDispatcher();
  let imgElement: HTMLDivElement;

  const hasTransparentPixels = async (blob: Blob) => {
    const img = new Image();
    img.src = URL.createObjectURL(blob);
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context.');
    }
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData?.data;
    if (!data) {
      throw new Error('Could not get image data.');
    }
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 255) {
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
    } catch (err) {
      handleError(err, 'Error setting profile picture.');
    }
    dispatch('close');
  };
</script>

<BaseModal on:close>
  <svelte:fragment slot="title">
    <span class="flex gap-2 place-items-center">
      <p class="font-medium">Set profile picture</p>
    </span>
  </svelte:fragment>
  <div class="flex justify-center place-items-center items-center">
    <div
      class="w-1/2 aspect-square rounded-full overflow-hidden relative flex border-immich-primary dark:border-immich-dark-primary border-4 bg-immich-dark-primary dark:bg-immich-primary"
    >
      <PhotoViewer bind:element={imgElement} {asset} />
    </div>
  </div>
  <span class="p-4 flex justify-end">
    <Button on:click={handleSetProfilePicture}>
      <p>Set as profile picture</p>
    </Button>
  </span>
  <div class="max-h-[400px] flex flex-col mb-2" />
</BaseModal>
