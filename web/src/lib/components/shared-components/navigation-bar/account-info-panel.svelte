<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { AppRoute, Theme } from '$lib/constants';
  import { user } from '$lib/stores/user.store';
  import { handleError } from '$lib/utils/handle-error';
  import { deleteProfileImage, updateUser, type UserAvatarColor } from '@immich/sdk';
  import { mdiCog, mdiLogout, mdiPencil, mdiWrench } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import { notificationController, NotificationType } from '../notification/notification';
  import UserAvatar from '../user-avatar.svelte';
  import AvatarSelector from './avatar-selector.svelte';
  import AccountPanelButton from './account-panel-button.svelte';
  import FocusTrap from '$lib/components/shared-components/focus-trap.svelte';
  import { colorTheme, handleToggleTheme } from '$lib/stores/preferences.store';
  import { moonPath, moonViewBox, sunPath, sunViewBox } from '$lib/assets/svg-paths';

  let isShowSelectAvatar = false;

  const dispatch = createEventDispatcher<{
    logout: void;
    close: void;
  }>();

  const handleSaveProfile = async (color: UserAvatarColor) => {
    try {
      if ($user.profileImagePath !== '') {
        await deleteProfileImage();
      }

      $user = await updateUser({
        updateUserDto: {
          id: $user.id,
          email: $user.email,
          name: $user.name,
          avatarColor: color,
        },
      });

      isShowSelectAvatar = false;

      notificationController.show({
        message: 'Saved profile',
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to save profile');
    }
  };
</script>

<FocusTrap>
  <div
    in:fade={{ duration: 100 }}
    out:fade={{ duration: 100 }}
    id="account-info-panel"
    class="absolute right-[25px] top-[75px] z-[100] w-[min(360px,100vw-50px)] rounded-3xl bg-gray-200 shadow-lg dark:border
    dark:border-immich-dark-gray dark:bg-immich-dark-gray"
  >
    <div
      class="mx-4 mt-4 flex flex-col items-center justify-center gap-4 rounded-3xl bg-white p-4 dark:bg-immich-dark-primary/10"
    >
      <div class="relative">
        {#key $user}
          <UserAvatar user={$user} size="xl" />
        {/key}
        <div
          class="absolute z-10 bottom-0 right-0 rounded-full w-6 h-6 border dark:border-immich-dark-primary bg-immich-primary"
        >
          <button
            class="flex items-center justify-center w-full h-full text-white"
            on:click={() => (isShowSelectAvatar = true)}
          >
            <Icon path={mdiPencil} />
          </button>
        </div>
      </div>
      <div class="w-full">
        <p class="text-center text-lg font-medium text-immich-primary dark:text-immich-dark-primary">
          {$user.name}
        </p>
        <p class="text-center text-sm text-gray-500 dark:text-immich-dark-fg break-words">
          {$user.email}
        </p>
      </div>

      <div class="flex flex-col gap-2 w-[min(100%,200px)]">
        <div>
          <a href={AppRoute.USER_SETTINGS} on:click={() => dispatch('close')}>
            <AccountPanelButton title="Account Settings" icon={mdiCog} />
          </a>
        </div>

        {#if !$colorTheme.system}
          <div class="sm:hidden">
            <AccountPanelButton on:click={handleToggleTheme}>
              {#if $colorTheme.value === Theme.LIGHT}
                <Icon path={moonPath} viewBox={sunViewBox} size="18" />
                Dark Theme
              {:else}
                <Icon path={sunPath} viewBox={moonViewBox} size="18" />
                Light Theme
              {/if}
            </AccountPanelButton>
          </div>
        {/if}

        <div class="sm:hidden">
          <a href={AppRoute.ADMIN_USER_MANAGEMENT} on:click={() => dispatch('close')}>
            <AccountPanelButton title="Administration" icon={mdiWrench} />
          </a>
        </div>
      </div>
    </div>

    <div class="mb-4 flex flex-col">
      <button
        class="flex w-full place-content-center place-items-center gap-2 py-3 font-medium text-gray-500 hover:bg-immich-primary/10 dark:text-gray-300"
        on:click={() => dispatch('logout')}
      >
        <Icon path={mdiLogout} size={24} />
        Sign Out
      </button>
    </div>
  </div>
</FocusTrap>
{#if isShowSelectAvatar}
  <AvatarSelector
    user={$user}
    on:close={() => (isShowSelectAvatar = false)}
    on:choose={({ detail: color }) => handleSaveProfile(color)}
  />
{/if}
