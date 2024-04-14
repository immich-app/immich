<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import IconButton from '$lib/components/elements/buttons/icon-button.svelte';
  import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
  import SkipLink from '$lib/components/elements/buttons/skip-link.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { resetSavedUser, user } from '$lib/stores/user.store';
  import { isSideBarOpen } from '$lib/stores/side-bar.store';
  import { clickOutside } from '$lib/utils/click-outside';
  import { logout } from '@immich/sdk';
  import { mdiMagnify, mdiMenu, mdiTrayArrowUp, mdiWrench } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { AppRoute } from '../../../constants';
  import ImmichLogo from '../immich-logo.svelte';
  import SearchBar from '../search-bar/search-bar.svelte';
  import ThemeButton from '../theme-button.svelte';
  import UserAvatar from '../user-avatar.svelte';
  import AccountInfoPanel from './account-info-panel.svelte';

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
  };
</script>

<svelte:window bind:innerWidth />

<section id="dashboard-navbar" class="fixed z-[900] h-[var(--navbar-height)] w-screen text-sm">
  <SkipLink>Skip to content</SkipLink>
  <div
    class="grid h-full grid-cols-[min-content_theme(spacing.18)_auto] items-center border-b bg-immich-bg py-2 dark:border-b-immich-dark-gray dark:bg-immich-dark-bg md:grid-cols-[min-content_theme(spacing.64)_auto]"
  >
    <div class="flex">
      <div class="ml-4 lg:hidden" id="sidebar-toggle-button">
        <IconButton title="Menu" on:click={() => ($isSideBarOpen = !$isSideBarOpen)}>
          <Icon path={mdiMenu} class="h-6 w-6" />
        </IconButton>
      </div>
    </div>
    <a data-sveltekit-preload-data="hover" class="ml-4" href={AppRoute.PHOTOS}>
      <ImmichLogo width="55%" noText={innerWidth < 768} />
    </a>
    <div class="flex justify-between gap-16 pr-6">
      <div class="hidden w-full max-w-5xl flex-1 pl-4 sm:block">
        {#if $featureFlags.search}
          <SearchBar grayTheme={true} />
        {/if}
      </div>

      <section class="flex place-items-center justify-end gap-2 max-sm:w-full">
        {#if $featureFlags.search}
          <a href={AppRoute.SEARCH} id="search-button" class="pl-4 sm:hidden">
            <IconButton title="Search">
              <div class="flex gap-2">
                <Icon path={mdiMagnify} size="1.5em" />
              </div>
            </IconButton>
          </a>
        {/if}

        <div class="hidden sm:flex place-items-center justify-end gap-2">
          <ThemeButton />

          {#if !$page.url.pathname.includes('/admin') && showUploadButton}
            <div in:fly={{ x: 50, duration: 250 }}>
              <LinkButton title="Upload" on:click={() => dispatch('uploadClicked')}>
                <div class="flex gap-2">
                  <Icon path={mdiTrayArrowUp} size="1.5em" />
                  <span class="hidden lg:block">Upload</span>
                </div>
              </LinkButton>
            </div>
          {/if}

          {#if $user.isAdmin}
            {@const isAdminPage = $page.url.pathname.includes('/admin')}
            {@const buttonCss = isAdminPage ? 'text-immich-primary dark:text-immich-dark-primary' : ''}
            <a
              data-sveltekit-preload-data="hover"
              href={AppRoute.ADMIN_USER_MANAGEMENT}
              aria-label="Administration"
              aria-current={isAdminPage ? 'page' : null}
            >
              <LinkButton title="Administration">
                <div class="flex gap-2 {buttonCss}">
                  <Icon path={mdiWrench} size="1.5em" />
                  <span class="hidden lg:block">Administration</span>
                </div>
              </LinkButton>
            </a>
          {/if}
        </div>

        <div
          use:clickOutside
          on:outclick={() => (shouldShowAccountInfoPanel = false)}
          on:escape={() => (shouldShowAccountInfoPanel = false)}
        >
          <button
            class="flex ml-2"
            on:mouseover={() => (shouldShowAccountInfo = true)}
            on:focus={() => (shouldShowAccountInfo = true)}
            on:blur={() => (shouldShowAccountInfo = false)}
            on:mouseleave={() => (shouldShowAccountInfo = false)}
            on:click={() => (shouldShowAccountInfoPanel = !shouldShowAccountInfoPanel)}
          >
            {#key $user}
              <UserAvatar user={$user} size="lg" showTitle={false} interactive />
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
