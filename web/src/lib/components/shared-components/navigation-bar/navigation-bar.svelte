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
  import { mdiCog, mdiMagnify, mdiTrayArrowUp } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { AppRoute } from '../../../constants';
  import ImmichLogo from '../immich-logo.svelte';
  import SearchBar from '../search-bar/search-bar.svelte';
  import ThemeButton from '../theme-button.svelte';
  import UserAvatar from '../user-avatar.svelte';
  import AccountInfoPanel from './account-info-panel.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { t } from 'svelte-i18n';

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
  <SkipLink>{$t('skip_to_content')}</SkipLink>
  <div
    class="grid h-full grid-cols-[theme(spacing.18)_auto] items-center border-b bg-immich-bg py-2 dark:border-b-immich-dark-gray dark:bg-immich-dark-bg md:grid-cols-[theme(spacing.64)_auto]"
  >
    <a data-sveltekit-preload-data="hover" class="ml-4" href={AppRoute.PHOTOS}>
      <ImmichLogo width="55%" noText={innerWidth < 768} />
    </a>
    <div class="flex justify-between gap-16 pr-6">
      <div class="hidden w-full max-w-5xl flex-1 pl-4 tall:pl-0 sm:block">
        {#if $featureFlags.search}
          <SearchBar grayTheme={true} />
        {/if}
      </div>

      <section class="flex place-items-center justify-end gap-4 max-sm:w-full">
        {#if $featureFlags.search}
          <a href={AppRoute.SEARCH} id="search-button" class="ml-4 sm:hidden">
            <CircleIconButton title={$t('go_to_search')} icon={mdiMagnify} />
          </a>
        {/if}

        <ThemeButton />

        {#if !$page.url.pathname.includes('/admin') && showUploadButton}
          <div in:fly={{ x: 50, duration: 250 }}>
            <LinkButton on:click={() => dispatch('uploadClicked')}>
              <div class="flex gap-2">
                <Icon path={mdiTrayArrowUp} size="1.5em" />
                <span class="hidden md:block">{$t('upload')}</span>
              </div>
            </LinkButton>
          </div>
        {/if}

        {#if $user.isAdmin}
          <a
            data-sveltekit-preload-data="hover"
            href={AppRoute.ADMIN_USER_MANAGEMENT}
            aria-label={$t('administration')}
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
                  {$t('administration')}
                </span>
              </div>
              <div class="block sm:hidden" aria-hidden="true">
                <Icon
                  path={mdiCog}
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
