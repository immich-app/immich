<script lang="ts">
  import { UserAvatarColor, type UserResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';
  import FullScreenModal from '../full-screen-modal.svelte';
  import UserAvatar from '../user-avatar.svelte';

  export let user: UserResponseDto;
  export let onClose: () => void;
  export let onChoose: (color: UserAvatarColor) => void;

  const colors: UserAvatarColor[] = Object.values(UserAvatarColor);
</script>

<FullScreenModal title={$t('select_avatar_color')} width="auto" {onClose}>
  <div class="flex items-center justify-center mt-4">
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      {#each colors as color}
        <button type="button" on:click={() => onChoose(color)}>
          <UserAvatar label={color} {user} {color} size="xl" showProfileImage={false} />
        </button>
      {/each}
    </div>
  </div>
</FullScreenModal>
