<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
  import SkipLink from '$lib/components/elements/buttons/skip-link.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { resetSavedUser, user } from '$lib/stores/user.store';
  import { clickOutside } from '$lib/actions/click-outside';
  import { logout } from '@immich/sdk';
  import { mdiMagnify, mdiTrayArrowUp } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import { AppRoute } from '../../../constants';
  import ImmichLogo from '../immich-logo.svelte';
  import SearchBar from '../search-bar/search-bar.svelte';
  import ThemeButton from '../theme-button.svelte';
  import UserAvatar from '../user-avatar.svelte';
  import AccountInfoPanel from './account-info-panel.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { t } from 'svelte-i18n';
  import { foldersStore } from '$lib/stores/folders.store';

  export let showUploadButton = true;

  let shouldShowAccountInfo = false;
  let shouldShowAccountInfoPanel = false;
  let innerWidth: number;
  const dispatch = createEventDispatcher<{
    uploadClicked: void;
  }>();

  const logOut = async () => {
    const { redirectUri } = await logout();

    if (redirectUri.startsWith('/')) {
      await goto(redirectUri);
    } else {
      window.location.href = redirectUri;
    }
    resetSavedUser();
    foldersStore.clearCache();
  };
</script>

<svelte:window bind:innerWidth />

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

      <section class="flex place-items-center justify-end gap-2 md:gap-4 w-full sm:w-auto">
        {#if $featureFlags.search}
          <CircleIconButton
            href={AppRoute.SEARCH}
            id="search-button"
            class="sm:hidden"
            title={$t('go_to_search')}
            icon={mdiMagnify}
            padding="2"
          />
        {/if}

        <ThemeButton padding="2" />

        {#if !$page.url.pathname.includes('/admin') && showUploadButton}
          <LinkButton on:click={() => dispatch('uploadClicked')} class="hidden lg:block">
            <div class="flex gap-2">
              <Icon path={mdiTrayArrowUp} size="1.5em" />
              <span>{$t('upload')}</span>
            </div>
          </LinkButton>
          <CircleIconButton
            on:click={() => dispatch('uploadClicked')}
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
            class="flex"
            on:mouseover={() => (shouldShowAccountInfo = true)}
            on:focus={() => (shouldShowAccountInfo = true)}
            on:blur={() => (shouldShowAccountInfo = false)}
            on:mouseleave={() => (shouldShowAccountInfo = false)}
            on:click={() => (shouldShowAccountInfoPanel = !shouldShowAccountInfoPanel)}
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
            <AccountInfoPanel on:logout={logOut} />
          {/if}
        </div>
      </section>
    </div>
  </div>
</section>
