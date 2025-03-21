<script lang="ts">
  import { page } from '$app/state';
  import { focusTrap } from '$lib/actions/focus-trap';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import ThemeButton from '$lib/components/shared-components/theme-button.svelte';
  import { AppRoute } from '$lib/constants';
  import { preferences, user } from '$lib/stores/user.store';
  import { handleError } from '$lib/utils/handle-error';
  import { deleteProfileImage, updateMyPreferences, type UserAvatarColor } from '@immich/sdk';
  import { Button, IconButton } from '@immich/ui';
  import { mdiCog, mdiHelpCircleOutline, mdiLogout, mdiPencil, mdiWrench } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import { NotificationType, notificationController } from '../notification/notification';
  import UserAvatar from '../user-avatar.svelte';
  import AvatarSelector from './avatar-selector.svelte';

  interface Props {
    onLogout: () => void;
    onHelp: () => void;
  }

  let { onLogout, onHelp }: Props = $props();

  let isShowSelectAvatar = $state(false);

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
  class="absolute right-[25px] top-[75px] z-[100] w-[min(360px,100vw-50px)] rounded-3xl bg-gray-200 shadow-lg dark:bg-immich-dark-gray"
  use:focusTrap
>
  <div class="mx-4 mt-4 flex flex-col items-center justify-center gap-4 rounded-3xl bg-light dark:bg-light/50 p-4">
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
          onclick={() => (isShowSelectAvatar = true)}
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
      <Button
        href={AppRoute.USER_SETTINGS}
        shape="round"
        color="secondary"
        size="small"
        variant="outline"
        leadingIcon={mdiCog}
      >
        {$t('account_settings')}
      </Button>
      {#if $user.isAdmin}
        <Button
          href={AppRoute.ADMIN_USER_MANAGEMENT}
          leadingIcon={mdiWrench}
          shape="round"
          variant="ghost"
          color="secondary"
          size="small"
          aria-current={page.url.pathname.includes('/admin') ? 'page' : undefined}
        >
          {$t('administration')}
        </Button>
      {/if}
    </div>

    <div class="flex justify-between px-2">
      <IconButton
        shape="round"
        color="secondary"
        variant="ghost"
        title={$t('support_and_feedback')}
        onclick={onHelp}
        icon={mdiHelpCircleOutline}
        aria-label={$t('support_and_feedback')}
      />
      <ThemeButton padding="2" />
    </div>
  </div>

  <div class="flex flex-col mb-4">
    <Button leadingIcon={mdiLogout} variant="ghost" color="secondary" shape="rectangle" class="py-3" onclick={onLogout}>
      {$t('sign_out')}
    </Button>
  </div>
</div>

{#if isShowSelectAvatar}
  <AvatarSelector user={$user} onClose={() => (isShowSelectAvatar = false)} onChoose={handleSaveProfile} />
{/if}
