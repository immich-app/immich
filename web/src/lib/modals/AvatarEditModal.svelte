<script lang="ts">
  import UserAvatar from '#lib/components/shared-components/UserAvatar.svelte';
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import { executeMutation } from '#lib/queries/client.ts';
  import { deleteProfileImageMutation, updateMyUserMutation } from '#lib/queries/user.query.ts';
  import { UserAvatarColor } from '@immich/sdk';
  import { Modal, ModalBody } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  const colors: UserAvatarColor[] = Object.values(UserAvatarColor);

  const onSave = (color: UserAvatarColor) => {
    if (authManager.user.profileImagePath === '') {
      return setAvatarColor(color);
    }

    return executeMutation(deleteProfileImageMutation, [], { onSuccess: () => void setAvatarColor(color) });
  };

  const setAvatarColor = (avatarColor: UserAvatarColor) =>
    executeMutation(updateMyUserMutation, [{ userUpdateMeDto: { avatarColor } }], { onSuccess: () => onClose() });
</script>

<Modal title={$t('select_avatar_color')} size="small" {onClose}>
  <ModalBody>
    <div class="grid grid-cols-2 place-items-center gap-4 sm:grid-cols-5">
      {#each colors as color (color)}
        <button type="button" onclick={() => onSave(color)}>
          <UserAvatar
            label={color}
            user={{ ...authManager.user, profileImagePath: '', avatarColor: color }}
            size="xl"
          />
        </button>
      {/each}
    </div>
  </ModalBody>
</Modal>
