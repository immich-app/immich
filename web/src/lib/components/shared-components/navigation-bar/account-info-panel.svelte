<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import { AppRoute } from '$lib/constants';
  import type { UserResponseDto } from '@api';
  import { createEventDispatcher } from 'svelte';
  import Cog from 'svelte-material-icons/Cog.svelte';
  import Logout from 'svelte-material-icons/Logout.svelte';
  import { fade } from 'svelte/transition';
  import UserAvatar from '../user-avatar.svelte';

  export let user: UserResponseDto;

  const dispatch = createEventDispatcher();
</script>

<div
  in:fade={{ duration: 100 }}
  out:fade={{ duration: 100 }}
  id="account-info-panel"
  class="absolute right-[25px] top-[75px] z-[100] w-[360px] rounded-3xl bg-gray-200 shadow-lg dark:border dark:border-immich-dark-gray dark:bg-immich-dark-gray"
>
  <div
    class="mx-4 mt-4 flex flex-col items-center justify-center gap-4 rounded-3xl bg-white p-4 dark:bg-immich-dark-primary/10"
  >
    <UserAvatar size="xl" {user} />

    <div>
      <p class="text-center text-lg font-medium text-immich-primary dark:text-immich-dark-primary">
        {user.firstName}
        {user.lastName}
      </p>
      <p class="text-sm text-gray-500 dark:text-immich-dark-fg">{user.email}</p>
    </div>

    <a href={AppRoute.USER_SETTINGS} on:click={() => dispatch('close')}>
      <Button color="dark-gray" size="sm" shadow={false} border>
        <div class="flex place-content-center place-items-center gap-2 px-2">
          <Cog size="18" />
          Account Settings
        </div>
      </Button>
    </a>
  </div>

  <div class="mb-4 flex flex-col">
    <button
      class="flex w-full place-content-center place-items-center gap-2 py-3 font-medium text-gray-500 hover:bg-immich-primary/10 dark:text-gray-300"
      on:click={() => dispatch('logout')}
    >
      <Logout size={24} />
      Sign Out</button
    >
  </div>
</div>
