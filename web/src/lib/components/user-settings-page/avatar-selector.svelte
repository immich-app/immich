<script lang="ts">
  import { mdiClose } from '@mdi/js';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import { createEventDispatcher } from 'svelte';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';
  import UserAvatar from '../shared-components/user-avatar.svelte';
  import { UserDtoAvatarColorEnum, UserResponseDto } from '@api';

  export let user: UserResponseDto;

  const dispatch = createEventDispatcher();
  const colors: Array<UserDtoAvatarColorEnum> = Object.values(UserDtoAvatarColorEnum);
</script>

<FullScreenModal on:clickOutside={() => dispatch('close')} on:escape={() => dispatch('close')}>
  <div class="flex h-full w-full place-content-center place-items-center overflow-hidden">
    <div
      class=" rounded-3xl border bg-immich-bg shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg"
    >
      <div class="flex px-2 pt-2 items-center">
        <h1 class="px-4 w-full self-center font-medium text-immich-primary dark:text-immich-dark-primary">
          Select avatar color
        </h1>
        <div>
          <CircleIconButton icon={mdiClose} on:click={() => dispatch('close')} />
        </div>
      </div>
      <div class="flex items-center justify-center p-4">
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          {#each colors as color}
            <div>
              <button on:click={() => dispatch('choose', color)}>
                <UserAvatar {user} {color} size="xl" showProfileImage={false} />
              </button>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</FullScreenModal>
