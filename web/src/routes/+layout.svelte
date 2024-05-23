<script lang="ts">
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import DownloadPanel from '$lib/components/asset-viewer/download-panel.svelte';
  import AppleHeader from '$lib/components/shared-components/apple-header.svelte';
  import FullscreenContainer from '$lib/components/shared-components/fullscreen-container.svelte';
  import NavigationLoadingBar from '$lib/components/shared-components/navigation-loading-bar.svelte';
  import NotificationList from '$lib/components/shared-components/notification/notification-list.svelte';
  import UploadPanel from '$lib/components/shared-components/upload-panel.svelte';
  import VersionAnnouncementBox from '$lib/components/shared-components/version-announcement-box.svelte';
  import { Theme } from '$lib/constants';
  import { colorTheme, handleToggleTheme, type ThemeSetting } from '$lib/stores/preferences.store';
  import { loadConfig } from '$lib/stores/server-config.store';
  import { user } from '$lib/stores/user.store';
  import { closeWebsocketConnection, openWebsocketConnection } from '$lib/stores/websocket';
  import { setKey } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { onDestroy, onMount } from 'svelte';
  import '../app.css';
  import { isAssetViewerRoute, isSharedLinkRoute } from '$lib/utils/navigation';
  import DialogWrapper from '$lib/components/shared-components/dialog/dialog-wrapper.svelte';

  let showNavigationLoadingBar = false;

  $: changeTheme($colorTheme);

  $: if ($user) {
    openWebsocketConnection();
  } else {
    closeWebsocketConnection();
  }

  const changeTheme = (theme: ThemeSetting) => {
    if (theme.system) {
      theme.value =
        window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? Theme.DARK : Theme.LIGHT;
    }

    if (theme.value === Theme.LIGHT) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  const handleChangeTheme = () => {
    if ($colorTheme.system) {
      handleToggleTheme();
    }
  };

  onMount(() => {
    // if the browser theme changes, changes the Immich theme too
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handleChangeTheme);
  });

  onDestroy(() => {
    document.removeEventListener('change', handleChangeTheme);
  });

  if (isSharedLinkRoute($page.route?.id)) {
    setKey($page.params.key);
  }

  beforeNavigate(({ from, to }) => {
    if (isAssetViewerRoute(from) && isAssetViewerRoute(to)) {
      return;
    }
    showNavigationLoadingBar = true;
  });

  afterNavigate(() => {
    showNavigationLoadingBar = false;
  });

  onMount(async () => {
    try {
      await loadConfig();
    } catch (error) {
      handleError(error, 'Unable to connect to server');
    }
  });
</script>

<svelte:head>
  <title>{$page.data.meta?.title || 'Web'} - Immich</title>
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="currentColor" />
  <AppleHeader />

  {#if $page.data.meta}
    <meta name="description" content={$page.data.meta.description} />

    <!-- Facebook Meta Tags -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content={$page.data.meta.title} />
    <meta property="og:description" content={$page.data.meta.description} />
    <meta property="og:image" content={$page.data.meta.imageUrl} />

    <!-- Twitter Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={$page.data.meta.title} />
    <meta name="twitter:description" content={$page.data.meta.description} />
    <meta name="twitter:image" content={$page.data.meta.imageUrl} />
  {/if}
</svelte:head>

<noscript
  class="absolute z-[1000] flex h-screen w-screen place-content-center place-items-center bg-immich-bg dark:bg-immich-dark-bg dark:text-immich-dark-fg"
>
  <FullscreenContainer title="Welcome to Immich">
    To use Immich, you must enable JavaScript or use a JavaScript compatible browser.
  </FullscreenContainer>
</noscript>

<slot />

{#if showNavigationLoadingBar}
  <NavigationLoadingBar />
{/if}

<DownloadPanel />
<UploadPanel />
<NotificationList />
<DialogWrapper />

{#if $user?.isAdmin}
  <VersionAnnouncementBox />
{/if}
