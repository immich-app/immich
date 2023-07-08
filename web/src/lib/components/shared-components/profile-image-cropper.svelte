<script lang="ts">
  import { AssetResponseDto, api } from '@api';
  import { createEventDispatcher } from 'svelte';
  import PhotoViewer from '../asset-viewer/photo-viewer.svelte';
  import BaseModal from './base-modal.svelte';
  import Button from '../elements/buttons/button.svelte';
  const dispatch = createEventDispatcher();
  export let asset: AssetResponseDto;
  export let publicSharedKey = '';
  import domtoimage from 'dom-to-image';
  import { notificationController, NotificationType } from './notification/notification';
  import { handleError } from '$lib/utils/handle-error';

  let profilePicture: HTMLDivElement;

  const handleSetProfilePicture = async () => {
    const div = profilePicture.childNodes[0];
    const blob = await domtoimage.toBlob(div);
    const file = new File([blob], 'profile-picture.png', { type: 'image/png' });
    try {
      await api.userApi.createProfileImage({ file });
      dispatch('close');
      notificationController.show({
        type: NotificationType.Info,
        message: 'Profile picture set.',
        timeout: 3000,
      });
    } catch (err) {
      handleError(err, 'Error setting profile picture.');
    }
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
      bind:this={profilePicture}
      class="w-1/2 aspect-square rounded-full overflow-hidden relative flex border-immich-primary border-4"
    >
      <PhotoViewer {publicSharedKey} {asset} />
    </div>
  </div>
  <span class="p-4 flex justify-end">
    <Button on:click={handleSetProfilePicture}>
      <p>Set as profile picture</p>
    </Button>
  </span>

  <div class="max-h-[400px] flex flex-col mb-2" />
</BaseModal>
