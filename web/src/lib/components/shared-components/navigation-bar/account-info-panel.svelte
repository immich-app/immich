<script lang="ts">
  import { page } from '$app/state';
  import { focusTrap } from '$lib/actions/focus-trap';
  import { AppRoute } from '$lib/constants';
  import AvatarEditModal from '$lib/modals/AvatarEditModal.svelte';
  import HelpAndFeedbackModal from '$lib/modals/HelpAndFeedbackModal.svelte';
  import SwitchAccountModal from '$lib/modals/SwitchAccountModal.svelte';
  import { subscribeSavedAccounts, type SavedAccount } from '$lib/stores/saved-accounts.store';
  import { user } from '$lib/stores/user.store';
  import { userInteraction } from '$lib/stores/user.svelte';
  import { getAboutInfo, type ServerAboutResponseDto } from '@immich/sdk';
  import { Button, Icon, IconButton, modalManager } from '@immich/ui';
  import { mdiAccountSwitch, mdiCog, mdiLogout, mdiPencil, mdiWrench } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import UserAvatar from '../user-avatar.svelte';

  interface Props {
    onLogout: () => void;
    onClose?: () => void;
  }

  let { onLogout, onClose = () => {} }: Props = $props();

  let info: ServerAboutResponseDto | undefined = $state();
  let savedAccounts: SavedAccount[] = $state([]);
  let unsubscribe: (() => void) | undefined;

  // Compute the count of OTHER accounts (excluding current user)
  // If user is undefined during loading, return 0 to avoid counting all accounts
  const otherAccountsCount = $derived(
    $user ? savedAccounts.filter((account) => account.id !== $user.id).length : 0
  );

  onMount(async () => {
    info = userInteraction.aboutInfo ?? (await getAboutInfo());
    unsubscribe = subscribeSavedAccounts((accounts) => {
      savedAccounts = accounts;
    });
  });

  onDestroy(() => {
    unsubscribe?.();
  });

  const handleSwitchAccountClick = async () => {
    onClose();
    await modalManager.show(SwitchAccountModal, {});
  };
</script>

<div
  in:fade={{ duration: 100 }}
  out:fade={{ duration: 100 }}
  id="account-info-panel"
  class="absolute z-1 end-6 top-19 w-[min(360px,100vw-50px)] rounded-3xl bg-gray-200 shadow-lg dark:border dark:border-immich-dark-gray dark:bg-immich-dark-gray"
  use:focusTrap
>
  <div
    class="mx-4 mt-4 flex flex-col items-center justify-center gap-4 rounded-t-3xl bg-white p-4 dark:bg-immich-dark-primary/10"
  >
    <div class="relative">
      <UserAvatar user={$user} size="xl" />
      <div class="absolute bottom-0 end-0 rounded-full w-6 h-6">
        <IconButton
          color="primary"
          icon={mdiPencil}
          aria-label={$t('edit_avatar')}
          size="tiny"
          shape="round"
          onclick={async () => {
            onClose();
            await modalManager.show(AvatarEditModal);
          }}
        />
      </div>
    </div>
    <div>
      <p class="text-center text-lg font-medium text-primary">
        {$user.name}
      </p>
      <p class="text-sm text-gray-500 dark:text-immich-dark-fg">{$user.email}</p>
    </div>

    <div class="flex flex-col gap-1">
      <Button
        href={AppRoute.USER_SETTINGS}
        onclick={onClose}
        size="small"
        color="secondary"
        variant="ghost"
        shape="round"
        class="border dark:border-immich-dark-gray dark:bg-gray-500 dark:hover:bg-immich-dark-primary/50 hover:bg-immich-primary/10 dark:text-white"
      >
        <div class="flex place-content-center place-items-center text-center gap-2 px-2">
          <Icon icon={mdiCog} size="18" aria-hidden />
          {$t('account_settings')}
        </div>
      </Button>
      <Button
        onclick={handleSwitchAccountClick}
        size="small"
        color="secondary"
        variant="ghost"
        shape="round"
        class="border dark:border-immich-dark-gray dark:bg-gray-500 dark:hover:bg-immich-dark-primary/50 hover:bg-immich-primary/10 dark:text-white"
      >
        <div class="flex place-content-center place-items-center text-center gap-2 px-2">
          <Icon icon={mdiAccountSwitch} size="18" aria-hidden />
          {$t('switch_account')}
          {#if otherAccountsCount > 0}
            <span class="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/20 text-primary font-medium">
              {otherAccountsCount}
            </span>
          {/if}
        </div>
      </Button>
      {#if $user.isAdmin}
        <Button
          href={AppRoute.ADMIN_USERS}
          onclick={onClose}
          shape="round"
          variant="ghost"
          size="small"
          color="secondary"
          aria-current={page.url.pathname.includes('/admin') ? 'page' : undefined}
          class="border dark:border-immich-dark-gray dark:bg-gray-500 dark:hover:bg-immich-dark-primary/50 hover:bg-immich-primary/10 dark:text-white"
        >
          <div class="flex place-content-center place-items-center text-center gap-2 px-2">
            <Icon icon={mdiWrench} size="18" aria-hidden />
            {$t('administration')}
          </div>
        </Button>
      {/if}
    </div>
  </div>

  <div class="mb-4 flex flex-col">
    <Button
      class="m-1 mx-4 rounded-none rounded-b-3xl bg-white p-3 dark:bg-immich-dark-primary/10"
      onclick={onLogout}
      leadingIcon={mdiLogout}
      variant="ghost"
      color="secondary">{$t('sign_out')}</Button
    >

    <button
      type="button"
      class="text-center mt-4 underline text-xs text-primary"
      onclick={async () => {
        onClose();
        if (info) {
          await modalManager.show(HelpAndFeedbackModal, { info });
        }
      }}
    >
      {$t('support_and_feedback')}
    </button>
  </div>
</div>
