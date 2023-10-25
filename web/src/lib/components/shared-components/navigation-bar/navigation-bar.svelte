<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { clickOutside } from '$lib/utils/click-outside';
  import { createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import TrayArrowUp from 'svelte-material-icons/TrayArrowUp.svelte';
  import { api, UserResponseDto } from '@api';
  import ThemeButton from '../theme-button.svelte';
  import { AppRoute } from '../../../constants';
  import AccountInfoPanel from './account-info-panel.svelte';
  import ImmichLogo from '../immich-logo.svelte';
  import SearchBar from '../search-bar/search-bar.svelte';
  import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
  import Magnify from 'svelte-material-icons/Magnify.svelte';
  import IconButton from '$lib/components/elements/buttons/icon-button.svelte';
  import Cog from 'svelte-material-icons/Cog.svelte';
  import UserAvatar from '../user-avatar.svelte';
  import { featureFlags } from '$lib/stores/server-config.store';
  export let user: UserResponseDto;
  export let showUploadButton = true;

  let shouldShowAccountInfo = false;
  let shouldShowAccountInfoPanel = false;

  const dispatch = createEventDispatcher();

  const logOut = async () => {
    const { data } = await api.authenticationApi.logout();

    await fetch('/auth/logout', { method: 'POST' });

    goto(data.redirectUri || '/auth/login?autoLaunch=0');
  };
</script>

<section id="dashboard-navbar" class="fixed z-[900] h-[var(--navbar-height)] w-screen text-sm">
  <div
    class="grid h-full grid-cols-[theme(spacing.18)_auto] items-center border-b bg-immich-bg py-2 dark:border-b-immich-dark-gray dark:bg-immich-dark-bg md:grid-cols-[theme(spacing.64)_auto]"
  >
    <a data-sveltekit-preload-data="hover" class="mx-4 flex place-items-center gap-2 md:mx-6" href={AppRoute.PHOTOS}>
      <ImmichLogo height="35" width="35" />
      <h1 class="hidden font-immich-title text-2xl text-immich-primary dark:text-immich-dark-primary md:block">
        IMMICH
      </h1>
    </a>
    <div class="flex justify-between gap-16 pr-6">
      <div class="hidden w-full max-w-5xl flex-1 pl-4 sm:block">
        {#if $featureFlags.search}
          <SearchBar grayTheme={true} />
        {/if}
      </div>

      <section class="flex place-items-center justify-end gap-4 max-sm:w-full">
        {#if $featureFlags.search}
          <a href={AppRoute.SEARCH} id="search-button" class="pl-4 sm:hidden">
            <IconButton title="Search">
              <div class="flex gap-2">
                <Magnify size="1.5em" />
              </div>
            </IconButton>
          </a>
        {/if}

        <ThemeButton />

        {#if !$page.url.pathname.includes('/admin') && showUploadButton}
          <div in:fly={{ x: 50, duration: 250 }}>
            <LinkButton on:click={() => dispatch('uploadClicked')}>
              <div class="flex gap-2">
                <TrayArrowUp size="1.5em" />
                <span class="hidden md:block">Upload</span>
              </div>
            </LinkButton>
          </div>
        {/if}

        {#if user.isAdmin}
          <a
            data-sveltekit-preload-data="hover"
            href={AppRoute.ADMIN_USER_MANAGEMENT}
            aria-label="Administration"
            aria-current={$page.url.pathname.includes('/admin') ? 'page' : null}
          >
            <div
              class="inline-flex items-center justify-center transition-colors dark:text-immich-dark-fg p-2 font-medium rounded-lg"
            >
              <div class="hidden sm:block">
                <span
                  class={$page.url.pathname.includes('/admin')
                    ? 'item text-immich-primary underline dark:text-immich-dark-primary'
                    : ''}
                >
                  Administration
                </span>
              </div>
              <div class="block sm:hidden" aria-hidden="true">
                <Cog
                  size="1.5em"
                  class="dark:text-immich-dark-fg {$page.url.pathname.includes('/admin')
                    ? 'text-immich-primary dark:text-immich-dark-primary'
                    : ''}"
                />
                <div
                  class={$page.url.pathname.includes('/admin')
                    ? 'border-t-1 mx-auto block w-2/3 border-immich-primary dark:border-immich-dark-primary'
                    : 'hidden'}
                />
              </div>
            </div>
          </a>
        {/if}

        <div
          use:clickOutside
          on:outclick={() => (shouldShowAccountInfoPanel = false)}
          on:escape={() => (shouldShowAccountInfoPanel = false)}
        >
          <button
            class="flex"
            on:mouseover={() => (shouldShowAccountInfo = true)}
            on:focus={() => (shouldShowAccountInfo = true)}
            on:blur={() => (shouldShowAccountInfo = false)}
            on:mouseleave={() => (shouldShowAccountInfo = false)}
            on:click={() => (shouldShowAccountInfoPanel = !shouldShowAccountInfoPanel)}
          >
            <UserAvatar {user} size="lg" showTitle={false} interactive />
          </button>

          {#if shouldShowAccountInfo && !shouldShowAccountInfoPanel}
            <div
              in:fade={{ delay: 500, duration: 150 }}
              out:fade={{ delay: 200, duration: 150 }}
              class="absolute -bottom-12 right-5 rounded-md border bg-gray-500 p-2 text-[12px] text-gray-100 shadow-md dark:border-immich-dark-gray dark:bg-immich-dark-gray"
            >
              <p>{user.firstName} {user.lastName}</p>
              <p>{user.email}</p>
            </div>
          {/if}

          {#if shouldShowAccountInfoPanel}
            <AccountInfoPanel {user} on:logout={logOut} />
          {/if}
        </div>
      </section>
    </div>
  </div>
</section>
