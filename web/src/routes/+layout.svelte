<script lang="ts">
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { shortcut } from '$lib/actions/shortcut';
  import DownloadPanel from '$lib/components/asset-viewer/download-panel.svelte';
  import ErrorLayout from '$lib/components/layouts/ErrorLayout.svelte';
  import AppleHeader from '$lib/components/shared-components/apple-header.svelte';
  import DialogWrapper from '$lib/components/shared-components/dialog/dialog-wrapper.svelte';
  import NavigationLoadingBar from '$lib/components/shared-components/navigation-loading-bar.svelte';
  import NotificationList from '$lib/components/shared-components/notification/notification-list.svelte';
  import UploadPanel from '$lib/components/shared-components/upload-panel.svelte';
  import VersionAnnouncementBox from '$lib/components/shared-components/version-announcement-box.svelte';
  import { Theme } from '$lib/constants';
  import { colorTheme, handleToggleTheme, type ThemeSetting } from '$lib/stores/preferences.store';
  import { serverConfig } from '$lib/stores/server-config.store';
  import { user } from '$lib/stores/user.store';
  import { closeWebsocketConnection, openWebsocketConnection } from '$lib/stores/websocket';
  import { copyToClipboard, setKey } from '$lib/utils';
  import { isAssetViewerRoute, isSharedLinkRoute } from '$lib/utils/navigation';
  import { setTranslations } from '@immich/ui';
  import { onDestroy, onMount, type Snippet } from 'svelte';
  import { t } from 'svelte-i18n';
  import { run } from 'svelte/legacy';
  import '../app.css';

  interface Props {
    children?: Snippet;
  }

  $effect(() => {
    setTranslations({
      close: $t('close'),
      showPassword: $t('show_password'),
      hidePassword: $t('hide_password'),
    });
  });

  let { children }: Props = $props();

  let showNavigationLoadingBar = $state(false);

  const changeTheme = (theme: ThemeSetting) => {
    if (theme.system) {
      theme.value = globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? Theme.DARK : Theme.LIGHT;
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

  const getMyImmichLink = () => {
    return new URL(page.url.pathname + page.url.search, 'https://my.immich.app');
  };

  onMount(() => {
    const element = document.querySelector('#stencil');
    element?.remove();
    // if the browser theme changes, changes the Immich theme too
    globalThis.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handleChangeTheme);
  });

  onDestroy(() => {
    document.removeEventListener('change', handleChangeTheme);
  });

  if (isSharedLinkRoute(page.route?.id)) {
    setKey(page.params.key);
  }

  beforeNavigate(({ from, to }) => {
    setKey(isSharedLinkRoute(to?.route.id) ? to?.params?.key : undefined);

    if (isAssetViewerRoute(from) && isAssetViewerRoute(to)) {
      return;
    }
    showNavigationLoadingBar = true;
  });

  afterNavigate(() => {
    showNavigationLoadingBar = false;
  });
  run(() => {
    changeTheme($colorTheme);
  });
  run(() => {
    if ($user) {
      openWebsocketConnection();
    } else {
      closeWebsocketConnection();
    }
  });
</script>

<svelte:head>
  <title>{page.data.meta?.title || 'Web'} - Immich</title>
  <link rel="manifest" href="/manifest.json" crossorigin="use-credentials" />
  <meta name="theme-color" content="currentColor" />
  <AppleHeader />

  {#if page.data.meta}
    <meta name="description" content={page.data.meta.description} />

    <!-- Facebook Meta Tags -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content={page.data.meta.title} />
    <meta property="og:description" content={page.data.meta.description} />
    {#if page.data.meta.imageUrl}
      <meta
        property="og:image"
        content={new URL(page.data.meta.imageUrl, $serverConfig.externalDomain || globalThis.location.origin).href}
      />
    {/if}

    <!-- Twitter Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={page.data.meta.title} />
    <meta name="twitter:description" content={page.data.meta.description} />
    {#if page.data.meta.imageUrl}
      <meta
        name="twitter:image"
        content={new URL(page.data.meta.imageUrl, $serverConfig.externalDomain || globalThis.location.origin).href}
      />
    {/if}
  {/if}
</svelte:head>

<svelte:window
  use:shortcut={{
    shortcut: { ctrl: true, shift: true, key: 'm' },
    onShortcut: () => copyToClipboard(getMyImmichLink().toString()),
  }}
/>

{#if page.data.error}
  <ErrorLayout error={page.data.error}></ErrorLayout>
{:else}
  {@render children?.()}
{/if}

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
