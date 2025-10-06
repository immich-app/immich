<script lang="ts" module>
  export const menuButtonId = 'top-menu-button';
</script>

<script lang="ts">
  import { page } from '$app/state';
  import { clickOutside } from '$lib/actions/click-outside';
  import CastButton from '$lib/cast/cast-button.svelte';
  import ImmichLogo from '$lib/components/shared-components/immich-logo.svelte';
  import NotificationPanel from '$lib/components/shared-components/navigation-bar/notification-panel.svelte';
  import SearchBar from '$lib/components/shared-components/search-bar/search-bar.svelte';
  import { AppRoute } from '$lib/constants';
  import SkipLink from '$lib/elements/SkipLink.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { mobileDevice } from '$lib/stores/mobile-device.svelte';
  import { notificationManager } from '$lib/stores/notification-manager.svelte';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { sidebarStore } from '$lib/stores/sidebar.svelte';
  import { user } from '$lib/stores/user.store';
  import { Button, IconButton } from '@immich/ui';
  import { mdiBellBadge, mdiBellOutline, mdiMagnify, mdiMenu, mdiTrayArrowUp } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import ThemeButton from '../theme-button.svelte';
  import UserAvatar from '../user-avatar.svelte';
  import AccountInfoPanel from './account-info-panel.svelte';

  interface Props {
    showUploadButton?: boolean;
    onUploadClick?: () => void;
    // TODO: remove once this is only used in <AppShellHeader>
    noBorder?: boolean;
  }

  let { showUploadButton = true, onUploadClick, noBorder = false }: Props = $props();

  let shouldShowAccountInfoPanel = $state(false);
  let shouldShowNotificationPanel = $state(false);
  let innerWidth: number = $state(0);
  const hasUnreadNotifications = $derived(notificationManager.notifications.length > 0);
</script>

<svelte:window bind:innerWidth />

<nav id="dashboard-navbar" class="max-md:h-(--navbar-height-md) h-(--navbar-height) w-dvw text-sm">
  <SkipLink text={$t('skip_to_content')} />
  <div
    class="grid h-full grid-cols-[--spacing(32)_auto] items-center py-2 sidebar:grid-cols-[--spacing(64)_auto] {noBorder
      ? ''
      : 'border-b'}"
  >
    <div class="flex flex-row gap-1 mx-4 items-center">
      <IconButton
        id={menuButtonId}
        shape="round"
        color="secondary"
        variant="ghost"
        size="medium"
        aria-label={$t('main_menu')}
        icon={mdiMenu}
        onclick={() => {
          sidebarStore.toggle();
        }}
        onmousedown={(event: MouseEvent) => {
          if (sidebarStore.isOpen) {
            // stops event from reaching the default handler when clicking outside of the sidebar
            event.stopPropagation();
          }
        }}
        class="sidebar:hidden"
      />
      <a data-sveltekit-preload-data="hover" href={AppRoute.PHOTOS}>
        <ImmichLogo class="max-md:h-[48px] h-[50px]" noText={!mobileDevice.isFullSidebar} />
      </a>
    </div>
    <div class="flex justify-between gap-4 lg:gap-8 pe-6">
      <div class="hidden w-full max-w-5xl flex-1 tall:ps-0 sm:block">
        {#if $featureFlags.search}
          <SearchBar grayTheme={true} />
        {/if}
      </div>

      <section class="flex place-items-center justify-end gap-1 md:gap-2 w-full sm:w-auto">
        {#if $featureFlags.search}
          <IconButton
            color="secondary"
            shape="round"
            variant="ghost"
            size="medium"
            icon={mdiMagnify}
            href={AppRoute.SEARCH}
            id="search-button"
            class="sm:hidden"
            aria-label={$t('go_to_search')}
          />
        {/if}

        {#if !page.url.pathname.includes('/admin') && showUploadButton && onUploadClick}
          <Button
            leadingIcon={mdiTrayArrowUp}
            onclick={onUploadClick}
            class="hidden lg:flex"
            variant="ghost"
            size="medium"
            color="secondary"
            >{$t('upload')}
          </Button>
          <IconButton
            color="secondary"
            shape="round"
            variant="ghost"
            size="medium"
            onclick={onUploadClick}
            title={$t('upload')}
            aria-label={$t('upload')}
            icon={mdiTrayArrowUp}
            class="lg:hidden"
          />
        {/if}

        <ThemeButton />

        <div
          use:clickOutside={{
            onOutclick: () => (shouldShowNotificationPanel = false),
            onEscape: () => (shouldShowNotificationPanel = false),
          }}
        >
          <IconButton
            shape="round"
            color={hasUnreadNotifications ? 'primary' : 'secondary'}
            variant="ghost"
            size="medium"
            icon={hasUnreadNotifications ? mdiBellBadge : mdiBellOutline}
            onclick={() => (shouldShowNotificationPanel = !shouldShowNotificationPanel)}
            aria-label={$t('notifications')}
          />

          {#if shouldShowNotificationPanel}
            <NotificationPanel />
          {/if}
        </div>

        <CastButton />

        <div
          use:clickOutside={{
            onOutclick: () => (shouldShowAccountInfoPanel = false),
            onEscape: () => (shouldShowAccountInfoPanel = false),
          }}
        >
          <button
            type="button"
            class="flex ps-2"
            onclick={() => (shouldShowAccountInfoPanel = !shouldShowAccountInfoPanel)}
            title={`${$user.name} (${$user.email})`}
          >
            {#key $user}
              <UserAvatar user={$user} size="md" noTitle interactive />
            {/key}
          </button>

          {#if shouldShowAccountInfoPanel}
            <AccountInfoPanel
              onLogout={() => authManager.logout()}
              onClose={() => (shouldShowAccountInfoPanel = false)}
            />
          {/if}
        </div>
      </section>
    </div>
  </div>
</nav>
