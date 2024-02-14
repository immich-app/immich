<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { UserAvatarColor, type UserResponseDto } from '@immich/sdk';
  import { mdiClose } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import FullScreenModal from '../full-screen-modal.svelte';
  import UserAvatar from '../user-avatar.svelte';

  export let user: UserResponseDto;

  const dispatch = createEventDispatcher<{
    close: void;
    choose: UserAvatarColor;
  }>();
  const colors: UserAvatarColor[] = Object.values(UserAvatarColor);
</script>

<FullScreenModal on:clickOutside={() => dispatch('close')} on:escape={() => dispatch('close')}>
  <div class="flex h-full w-full place-content-center place-items-center overflow-hidden">
    <div
      class=" rounded-3xl border bg-immich-bg shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg p-4"
    >
      <div class="flex items-center">
        <h1 class="px-4 w-full self-center font-medium text-immich-primary dark:text-immich-dark-primary text-sm">
          SELECT AVATAR COLOR
        </h1>
        <div>
          <CircleIconButton icon={mdiClose} on:click={() => dispatch('close')} />
        </div>
      </div>
      <div class="flex items-center justify-center p-4 mt-4">
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          {#each colors as color}
            <button on:click={() => dispatch('choose', color)}>
              <UserAvatar {user} {color} size="xl" showProfileImage={false} />
            </button>
          {/each}
        </div>
      </div>
    </div>
  </div>
</FullScreenModal>
