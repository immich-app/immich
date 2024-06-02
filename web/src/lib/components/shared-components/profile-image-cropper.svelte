<script lang="ts">
  import { user } from '$lib/stores/user.store';
  import { handleError } from '$lib/utils/handle-error';
  import { createProfileImage, type AssetResponseDto } from '@immich/sdk';
  import domtoimage from 'dom-to-image';
  import { onMount } from 'svelte';
  import PhotoViewer from '../asset-viewer/photo-viewer.svelte';
  import Button from '../elements/buttons/button.svelte';
  import { NotificationType, notificationController } from './notification/notification';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';

  export let asset: AssetResponseDto;
  export let onClose: () => void;

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
      const { profileImagePath } = await createProfileImage({ createProfileImageDto: { file } });
      notificationController.show({
        type: NotificationType.Info,
        message: 'Profile picture set.',
        timeout: 3000,
      });
      $user.profileImagePath = profileImagePath;
    } catch (error) {
      handleError(error, 'Error setting profile picture.');
    }
    onClose();
  };
</script>

<FullScreenModal title="Set profile picture" width="auto" {onClose}>
  <div class="flex place-items-center items-center justify-center">
    <div
      class="relative flex aspect-square w-[250px] overflow-hidden rounded-full border-4 border-immich-primary bg-immich-dark-primary dark:border-immich-dark-primary dark:bg-immich-primary"
    >
      <PhotoViewer bind:element={imgElement} {asset} />
    </div>
  </div>
  <svelte:fragment slot="sticky-bottom">
    <Button fullwidth on:click={handleSetProfilePicture}>Set as profile picture</Button>
  </svelte:fragment>
</FullScreenModal>
