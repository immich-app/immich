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
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error("Impossible d'obtenir le contexte du canevas.");
    }
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData?.data;
    if (!data) {
      throw new Error("Impossible d'obtenir les données de l'image.");
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
          message: "Les photos de profil ne peuvent pas contenir de pixels transparents. Veuillez zoomer et/ou déplacer l'image.",
          timeout: 3000,
        });
        return;
      }
      const file = new File([blob], 'profile-picture.png', { type: 'image/png' });
      await api.userApi.createProfileImage({ file });
      notificationController.show({
        type: NotificationType.Info,
        message: "Photo de profil définie.",
        timeout: 3000,
      });
    } catch (err) {
      handleError(err, "Erreur lors de la définition de la photo de profil.");
    }
    dispatch('close');
  };
</script>

<BaseModal on:close>
  <svelte:fragment slot="title">
    <span class="flex place-items-center gap-2">
      <p class="font-medium">Définir la photo de profil</p>
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
      <p>Définir comme photo de profil</p>
    </Button>
  </span>
  <div class="mb-2 flex max-h-[400px] flex-col" />
</BaseModal>
