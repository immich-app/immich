<script lang="ts" module>
  export const menuButtonId = 'top-menu-button';
</script>

<script lang="ts">
  import { page } from '$app/state';
  import { clickOutside } from '$lib/actions/click-outside';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import SkipLink from '$lib/components/elements/buttons/skip-link.svelte';
  import HelpAndFeedbackModal from '$lib/components/shared-components/help-and-feedback-modal.svelte';
  import ImmichLogo from '$lib/components/shared-components/immich-logo.svelte';
  import SearchBar from '$lib/components/shared-components/search-bar/search-bar.svelte';
  import { AppRoute } from '$lib/constants';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { user } from '$lib/stores/user.store';
  import { userInteraction } from '$lib/stores/user.svelte';
  import { handleLogout } from '$lib/utils/auth';
  import { getAboutInfo, logout, type ServerAboutResponseDto } from '@immich/sdk';
  import { Button, IconButton } from '@immich/ui';
  import { mdiHelpCircleOutline, mdiMagnify, mdiMenu, mdiTrayArrowUp } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import UserAvatar from '../user-avatar.svelte';
  import AccountInfoPanel from './account-info-panel.svelte';
  import { isSidebarOpen } from '$lib/stores/side-bar.svelte';

  interface Props {
    showUploadButton?: boolean;
    onUploadClick: () => void;
  }

  let { showUploadButton = true, onUploadClick }: Props = $props();

  let shouldShowAccountInfo = $state(false);
  let shouldShowAccountInfoPanel = $state(false);
  let shouldShowHelpPanel = $state(false);
  let innerWidth: number = $state(0);

  const onLogout = async () => {
    const { redirectUri } = await logout();
    await handleLogout(redirectUri);
  };

  let info: ServerAboutResponseDto | undefined = $state();

  onMount(async () => {
    info = userInteraction.aboutInfo ?? (await getAboutInfo());
  });
</script>

<svelte:window bind:innerWidth />

{#if shouldShowHelpPanel && info}
  <HelpAndFeedbackModal onClose={() => (shouldShowHelpPanel = false)} {info} />
{/if}

<section id="dashboard-navbar" class="fixed z-[900] h-[var(--navbar-height)] w-screen text-sm">
  <SkipLink text={$t('skip_to_content')} />
  <div
    class="grid h-full grid-cols-[theme(spacing.18)_auto] items-center border-b bg-immich-bg py-2 dark:border-b-immich-dark-gray dark:bg-immich-dark-bg md:grid-cols-[theme(spacing.64)_auto]"
  >
    <div class="flex flex-row ml-4">
      <CircleIconButton
        id={menuButtonId}
        title={'Main menu'}
        icon={mdiMenu}
        padding="2"
        onclick={() => {
          isSidebarOpen.value = !isSidebarOpen.value;
        }}
        class="md:hidden"
      />
      <a data-sveltekit-preload-data="hover" class="hidden md:block" href={AppRoute.PHOTOS}>
        <ImmichLogo width="150em" />
      </a>
    </div>
    <div class="flex justify-between gap-4 lg:gap-8 pr-6">
      <div class="flex items-center gap-2 max-w-5xl w-full">
        <a data-sveltekit-preload-data="hover" class="md:hidden" href={AppRoute.PHOTOS}>
          <ImmichLogo width="40em" noText={true} class="max-w-none" />
        </a>
        <div class="hidden flex-1 tall:pl-0 sm:block">
          {#if $featureFlags.search}
            <SearchBar grayTheme={true} />
          {/if}
        </div>
      </div>

      <section class="flex place-items-center justify-end gap-1 w-full sm:w-auto">
        {#if $featureFlags.search}
          <CircleIconButton
            href={AppRoute.SEARCH}
            id="search-button"
            class="sm:hidden"
            title={$t('go_to_search')}
            icon={mdiMagnify}
            padding="2"
            onclick={() => {}}
          />
        {/if}

        <div
          use:clickOutside={{
            onEscape: () => (shouldShowHelpPanel = false),
          }}
        >
          <IconButton
            shape="round"
            color="secondary"
            variant="ghost"
            size="giant"
            title={$t('support_and_feedback')}
            icon={mdiHelpCircleOutline}
            onclick={() => (shouldShowHelpPanel = !shouldShowHelpPanel)}
            aria-label={$t('support_and_feedback')}
          />
        </div>

        {#if !page.url.pathname.includes('/admin') && showUploadButton}
          <Button
            leadingIcon={mdiTrayArrowUp}
            onclick={onUploadClick}
            class="hidden lg:flex px-2"
            variant="ghost"
            color="secondary"
          >
            {$t('upload')}
          </Button>
          <CircleIconButton
            onclick={onUploadClick}
            title={$t('upload')}
            icon={mdiTrayArrowUp}
            class="lg:hidden"
            padding="2"
          />
        {/if}

        <div
          use:clickOutside={{
            onOutclick: () => (shouldShowAccountInfoPanel = false),
            onEscape: () => (shouldShowAccountInfoPanel = false),
          }}
        >
          <button
            type="button"
            class="flex pl-2"
            onmouseover={() => (shouldShowAccountInfo = true)}
            onfocus={() => (shouldShowAccountInfo = true)}
            onblur={() => (shouldShowAccountInfo = false)}
            onmouseleave={() => (shouldShowAccountInfo = false)}
            onclick={() => (shouldShowAccountInfoPanel = !shouldShowAccountInfoPanel)}
          >
            {#key $user}
              <UserAvatar user={$user} size="md" showTitle={false} interactive />
            {/key}
          </button>

          {#if shouldShowAccountInfo && !shouldShowAccountInfoPanel}
            <div
              in:fade={{ delay: 500, duration: 150 }}
              out:fade={{ delay: 200, duration: 150 }}
              class="absolute -bottom-12 right-5 rounded-md border bg-gray-500 p-2 text-[12px] text-gray-100 shadow-md dark:border-immich-dark-gray dark:bg-immich-dark-gray"
            >
              <p>{$user.name}</p>
              <p>{$user.email}</p>
            </div>
          {/if}

          {#if shouldShowAccountInfoPanel}
            <AccountInfoPanel {onLogout} />
          {/if}
        </div>
      </section>
    </div>
  </div>
</section>
