<script lang="ts" module>
  export const menuButtonId = 'top-menu-button';
</script>

<script lang="ts">
  import { clickOutside } from '$lib/actions/click-outside';
  import SkipLink from '$lib/elements/SkipLink.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { Route } from '$lib/route';
  import { mediaQueryManager } from '$lib/stores/media-query-manager.svelte';
  import { sidebarStore } from '$lib/stores/sidebar.svelte';
  import { user } from '$lib/stores/user.store';
  import { IconButton, Logo } from '@immich/ui';
  import { mdiMenu } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import ThemeButton from '../theme-button.svelte';
  import UserAvatar from '../user-avatar.svelte';
  import AccountInfoPanel from './account-info-panel.svelte';

  type Props = {
    noBorder?: boolean;
  };

  let { noBorder = false }: Props = $props();

  let shouldShowAccountInfoPanel = $state(false);
</script>

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
            event.stopPropagation();
          }
        }}
        class="sidebar:hidden"
      />
      <a data-sveltekit-preload-data="hover" href={Route.userSettings()}>
        <Logo variant={mediaQueryManager.isFullSidebar ? 'inline' : 'icon'} class="max-md:h-12" />
      </a>
    </div>
    <div class="flex justify-end gap-4 lg:gap-8 pe-6">
      <section class="flex place-items-center justify-end gap-1 md:gap-2">
        <ThemeButton />

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
