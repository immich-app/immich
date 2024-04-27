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
  import { md } from '$lib/utils/media-breakpoint';
  import { AppRoute } from '$lib/constants';
  import ImmichLogo from '../immich-logo.svelte';
  import SearchBar from '../search-bar/search-bar.svelte';
  import ThemeButton from '../theme-button.svelte';
  import UserAvatar from '../user-avatar.svelte';
  import AccountInfoPanel from './account-info-panel.svelte';
  import { isUserUsingMouse } from '$lib/stores/input-device.store';

  export let showUploadButton = true;

  let shouldShowAccountInfo = false;
  let shouldShowAccountInfoPanel = false;
  let showLogoText = false;
  let showSearchBar = false;
  let isSearchBarFullWidth = true;

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

  const onSmallScreenDisplay = () => {
    showLogoText = false;
    isSearchBarFullWidth = true;
  };

  const onMediumScreenDisplay = () => {
    showLogoText = true;
    isSearchBarFullWidth = false;
    showSearchBar = false;
  };
</script>

<section id="dashboard-navbar" class="fixed z-[900] h-[var(--navbar-height)] w-screen text-sm">
  <SkipLink>Skip to content</SkipLink>
  <div
    class="relative grid h-full grid-cols-[min-content_theme(spacing.18)_auto] items-center border-b bg-immich-bg py-2 dark:border-b-immich-dark-gray dark:bg-immich-dark-bg md:grid-cols-[min-content_theme(spacing.40)_auto]"
    use:md={{
      match: onMediumScreenDisplay,
      unmatch: onSmallScreenDisplay,
    }}
  >
    <div class="flex">
      <div class="ml-4 lg:hidden" id="sidebar-toggle-button">
        <IconButton title="Menu" on:click={() => ($isSideBarOpen = !$isSideBarOpen)}>
          <Icon path={mdiMenu} class="h-6 w-6" />
        </IconButton>
      </div>
    </div>
    <a data-sveltekit-preload-data="hover" class="ml-4" href={AppRoute.PHOTOS}>
      <ImmichLogo class="w-[72%] md:w-[92%]" noText={!showLogoText} />
    </a>

    <div class="flex justify-between xs:gap-6 pr-6">
      <div class="{isSearchBarFullWidth ? 'flex' : 'hidden'} sm:flex sm:w-full max-w-5xl sm:pl-4 lg:pl-24">
        {#if $featureFlags.search && (!isSearchBarFullWidth || showSearchBar)}
          <SearchBar grayTheme fullWidth={isSearchBarFullWidth} bind:isOpen={showSearchBar} />
        {/if}
      </div>

      <section class="flex place-items-center justify-end gap-2 max-sm:w-full">
        <div class="md:hidden">
          <IconButton title="Search" on:click={() => (showSearchBar = true)}>
            <div class="flex gap-2">
              <Icon path={mdiMagnify} size="1.5em" />
            </div>
          </IconButton>
        </div>

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
            on:mouseenter={() => (shouldShowAccountInfo = true)}
            on:mouseleave={() => (shouldShowAccountInfo = false)}
            on:click={() => (shouldShowAccountInfoPanel = !shouldShowAccountInfoPanel)}
          >
            {#key $user}
              <UserAvatar user={$user} size="lg" showTitle={false} interactive />
            {/key}
          </button>

          {#if shouldShowAccountInfo && !shouldShowAccountInfoPanel && $isUserUsingMouse}
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
