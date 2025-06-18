<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import { user } from '$lib/stores/user.store';
  import { handleError } from '$lib/utils/handle-error';
  import { deleteProfileImage, updateMyUser, UserAvatarColor } from '@immich/sdk';
  import { Modal, ModalBody } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  const colors: UserAvatarColor[] = Object.values(UserAvatarColor);

  const onSave = async (color: UserAvatarColor) => {
    try {
      if ($user.profileImagePath !== '') {
        await deleteProfileImage();
      }

      notificationController.show({ message: $t('saved_profile'), type: NotificationType.Info });

      $user = await updateMyUser({ userUpdateMeDto: { avatarColor: color } });
      onClose();
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_profile'));
    }
  };
</script>

<Modal title={$t('select_avatar_color')} size="small" {onClose}>
  <ModalBody>
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-4 place-items-center">
      {#each colors as color (color)}
        <button type="button" onclick={() => onSave(color)}>
          <UserAvatar label={color} user={{ ...$user, profileImagePath: '', avatarColor: color }} size="xl" />
        </button>
      {/each}
    </div>
  </ModalBody>
</Modal>
