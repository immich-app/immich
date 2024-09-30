<script lang="ts">
  import { page } from '$app/stores';
  import { focusTrap } from '$lib/actions/focus-trap';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { AppRoute } from '$lib/constants';
  import { preferences, user } from '$lib/stores/user.store';
  import { handleError } from '$lib/utils/handle-error';
  import { deleteProfileImage, updateMyPreferences, type UserAvatarColor } from '@immich/sdk';
  import { mdiCog, mdiLogout, mdiPencil, mdiWrench } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import { NotificationType, notificationController } from '../notification/notification';
  import UserAvatar from '../user-avatar.svelte';
  import AvatarSelector from './avatar-selector.svelte';

  export let onLogout: () => void;
  export let onClose: () => void = () => {};

  let isShowSelectAvatar = false;

  const handleSaveProfile = async (color: UserAvatarColor) => {
    try {
      if ($user.profileImagePath !== '') {
        await deleteProfileImage();
      }

      $preferences = await updateMyPreferences({ userPreferencesUpdateDto: { avatar: { color } } });
      $user = { ...$user, profileImagePath: '', avatarColor: $preferences.avatar.color };
      isShowSelectAvatar = false;

      notificationController.show({
        message: $t('saved_profile'),
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_profile'));
    }
  };
</script>

<div
  in:fade={{ duration: 100 }}
  out:fade={{ duration: 100 }}
  id="account-info-panel"
  class="absolute right-[25px] top-[75px] z-[100] w-[min(360px,100vw-50px)] rounded-3xl bg-gray-200 shadow-lg dark:border dark:border-immich-dark-gray dark:bg-immich-dark-gray"
  use:focusTrap
>
  <div
    class="mx-4 mt-4 flex flex-col items-center justify-center gap-4 rounded-3xl bg-white p-4 dark:bg-immich-dark-primary/10"
  >
    <div class="relative">
      <UserAvatar user={$user} size="xl" />
      <div class="absolute z-10 bottom-0 right-0 rounded-full w-6 h-6">
        <CircleIconButton
          color="primary"
          icon={mdiPencil}
          title={$t('edit_avatar')}
          class="border"
          size="12"
          padding="2"
          on:click={() => (isShowSelectAvatar = true)}
        />
      </div>
    </div>
    <div>
      <p class="text-center text-lg font-medium text-immich-primary dark:text-immich-dark-primary">
        {$user.name}
      </p>
      <p class="text-sm text-gray-500 dark:text-immich-dark-fg">{$user.email}</p>
    </div>

    <div class="flex flex-col gap-1">
      <Button href={AppRoute.USER_SETTINGS} on:click={onClose} color="dark-gray" size="sm" shadow={false} border>
        <div class="flex place-content-center place-items-center text-center gap-2 px-2">
          <Icon path={mdiCog} size="18" ariaHidden />
          {$t('account_settings')}
        </div>
      </Button>
      {#if $user.isAdmin}
        <Button
          href={AppRoute.ADMIN_USER_MANAGEMENT}
          on:click={onClose}
          color="dark-gray"
          size="sm"
          shadow={false}
          border
          aria-current={$page.url.pathname.includes('/admin') ? 'page' : undefined}
        >
          <div class="flex place-content-center place-items-center text-center gap-2 px-2">
            <Icon path={mdiWrench} size="18" ariaHidden />
            {$t('administration')}
          </div>
        </Button>
      {/if}
    </div>
  </div>

  <div class="mb-4 flex flex-col">
    <button
      type="button"
      class="flex w-full place-content-center place-items-center gap-2 py-3 font-medium text-gray-500 hover:bg-immich-primary/10 dark:text-gray-300"
      on:click={onLogout}
    >
      <Icon path={mdiLogout} size={24} />
      {$t('sign_out')}</button
    >
  </div>
</div>

{#if isShowSelectAvatar}
  <AvatarSelector user={$user} onClose={() => (isShowSelectAvatar = false)} onChoose={handleSaveProfile} />
{/if}
