<script lang="ts">
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { shortcut } from '$lib/actions/shortcut';
  import ErrorLayout from '$lib/components/layouts/ErrorLayout.svelte';
  import AppleHeader from '$lib/components/shared-components/apple-header.svelte';
  import NavigationLoadingBar from '$lib/components/shared-components/navigation-loading-bar.svelte';
  import VersionAnnouncement from '$lib/components/VersionAnnouncement.svelte';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
  import { Route } from '$lib/route';
  import { sidebarStore } from '$lib/stores/sidebar.svelte';
  import { user } from '$lib/stores/user.store';
  import { closeWebsocketConnection, openWebsocketConnection, websocketStore } from '$lib/stores/websocket';
  import { copyToClipboard } from '$lib/utils';

  import { isAssetViewerRoute } from '$lib/utils/navigation';
  import { TooltipProvider, toastManager } from '@immich/ui';
  import { onMount, type Snippet } from 'svelte';
  import '../app.css';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();

  let showNavigationLoadingBar = $state(false);

  const getMyImmichLink = () => {
    return new URL(page.url.pathname + page.url.search, 'https://my.immich.app');
  };

  toastManager.setOptions({ class: 'top-16' });

  onMount(() => {
    const element = document.querySelector('#stencil');
    element?.remove();
    // if the browser theme changes, changes the Immich theme too
  });

  eventManager.emit('AppInit');

  beforeNavigate(({ from, to }) => {
    if (sidebarStore.isOpen) {
      sidebarStore.reset();
    }

    if (isAssetViewerRoute(from) && isAssetViewerRoute(to)) {
      return;
    }
    showNavigationLoadingBar = true;
  });

  afterNavigate(() => {
    showNavigationLoadingBar = false;
  });

  const { serverRestarting } = websocketStore;

  $effect.pre(() => {
    if ($user || $serverRestarting || page.url.pathname.startsWith(Route.maintenanceMode())) {
      openWebsocketConnection();
    } else {
      closeWebsocketConnection();
    }
  });

  serverRestarting.subscribe((isRestarting) => {
    if (!isRestarting) {
      return;
    }
  });
</script>

<VersionAnnouncement />

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
        content={new URL(
          page.data.meta.imageUrl,
          serverConfigManager.value.externalDomain || globalThis.location.origin,
        ).href}
      />
    {/if}

    <!-- Twitter Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={page.data.meta.title} />
    <meta name="twitter:description" content={page.data.meta.description} />
    {#if page.data.meta.imageUrl}
      <meta
        name="twitter:image"
        content={new URL(
          page.data.meta.imageUrl,
          serverConfigManager.value.externalDomain || globalThis.location.origin,
        ).href}
      />
    {/if}
  {/if}
</svelte:head>

<svelte:document
  use:shortcut={{
    shortcut: { ctrl: true, shift: true, key: 'm' },
    onShortcut: () => copyToClipboard(getMyImmichLink().toString()),
  }}
/>

<TooltipProvider>
  {#if page.data.error}
    <ErrorLayout error={page.data.error}></ErrorLayout>
  {:else}
    {@render children?.()}
  {/if}

  {#if showNavigationLoadingBar}
    <NavigationLoadingBar />
  {/if}
</TooltipProvider>
