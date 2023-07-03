<script lang="ts">
  import { AssetResponseDto, api } from '@api';
  import { createEventDispatcher, onMount } from 'svelte';
  import Plus from 'svelte-material-icons/Plus.svelte';
  import PhotoViewer from '../asset-viewer/photo-viewer.svelte';
  import BaseModal from './base-modal.svelte';
  import { stringify } from 'postcss';
  import Button from '../elements/buttons/button.svelte';
  const dispatch = createEventDispatcher();
  export let asset: AssetResponseDto;
  export let publicSharedKey = '';
  import domtoimage from 'dom-to-image';
  import type { UserResponseDto } from '@api';
  import { notificationController, NotificationType } from './notification/notification';
  import { isUpdateProfilePicture } from '$lib/stores/preferences.store';
  onMount(() => {
    console.log(asset);
  });

  let user: UserResponseDto;

  const handleSetProfilePicture = async () => {
    const div: HTMLElement | null = document.getElementById('profile-picture')?.childNodes[0] as HTMLElement;
    if (!div) {
      return;
    }
    domtoimage.toBlob(div).then(function (blob: Blob) {
      const file: File = new File([blob], 'profile-picture.png', { type: 'image/png' });
      try {
        api.userApi.createProfileImage({ file });
        //set store to update profile picture
        isUpdateProfilePicture.set(true);
        dispatch('close');
        notificationController.show({
          type: NotificationType.Info,
          message: 'Profile picture set.',
          timeout: 3000,
        });
      } catch (err) {
        console.error('Error [profile-image-cropper]:', err);
        notificationController.show({
          type: NotificationType.Error,
          message: 'Error setting profile picture.',
          timeout: 3000,
        });
      }
    });
  };
</script>

<BaseModal on:close={() => dispatch('close')}>
  <svelte:fragment slot="title">
    <span class="flex gap-2 place-items-center">
      <p class="font-medium">Set profile picture</p>
    </span>
  </svelte:fragment>
  <div class="flex justify-center place-items-center items-center">
    <div
      id="profile-picture"
      class="w-1/2 aspect-square rounded-full overflow-hidden relative flex border-immich-primary border-4"
    >
      <PhotoViewer {publicSharedKey} {asset} on:close={() => console.log('close')} />
    </div>
  </div>
  <div id="output" />
  <span class="p-4 flex justify-end">
    <Button on:click={handleSetProfilePicture}>
      <p class="">Set as profile picture</p>
    </Button>
  </span>

  <div class="max-h-[400px] flex flex-col mb-2" />
</BaseModal>
