<script lang="ts">
  import { page } from '$app/state';
  import { clickOutside } from '$lib/actions/click-outside';
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
  import { mdiHelpCircleOutline, mdiMagnify, mdiTrayArrowUp } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import ThemeButton from '../theme-button.svelte';
  import UserAvatar from '../user-avatar.svelte';
  import AccountInfoPanel from './account-info-panel.svelte';

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
    <a data-sveltekit-preload-data="hover" class="ml-4" href={AppRoute.PHOTOS}>
      <ImmichLogo width="55%" noText={innerWidth < 768} />
    </a>
    <div class="flex justify-between gap-4 lg:gap-8 pr-6">
      <div class="hidden w-full max-w-5xl flex-1 tall:pl-0 sm:block">
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
            size="large"
            icon={mdiMagnify}
            href={AppRoute.SEARCH}
            id="search-button"
            class="sm:hidden"
            title={$t('go_to_search')}
            aria-label={$t('go_to_search')}
          />
        {/if}

        {#if !page.url.pathname.includes('/admin') && showUploadButton}
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
            size="large"
            onclick={onUploadClick}
            title={$t('upload')}
            aria-label={$t('upload')}
            icon={mdiTrayArrowUp}
            class="lg:hidden"
          />
        {/if}

        <ThemeButton padding="2" />

        <div
          use:clickOutside={{
            onEscape: () => (shouldShowHelpPanel = false),
          }}
        >
          <IconButton
            shape="round"
            color="secondary"
            variant="ghost"
            size="large"
            title={$t('support_and_feedback')}
            icon={mdiHelpCircleOutline}
            onclick={() => (shouldShowHelpPanel = !shouldShowHelpPanel)}
            aria-label={$t('support_and_feedback')}
          />
        </div>

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
