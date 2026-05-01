<script lang="ts">
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { shortcut, shortcuts } from '$lib/actions/shortcut';
  import { getMyImmichLink } from '$lib/commands';
  import GlobalSearch from '$lib/components/global-search/global-search.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { closePaletteOnNavigate } from '$lib/managers/close-palette-on-navigate';
  import { globalSearchManager, type SearchMode } from '$lib/managers/global-search-manager.svelte';
  import { copyToClipboard } from '$lib/utils';
  import DownloadPanel from './download-panel.svelte';
  import ErrorLayout from './ErrorLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import NavigationLoadingBar from './navigation-loading-bar.svelte';
  import OpenInAppBanner from '$lib/components/shared-components/open-in-app-banner.svelte';
  import UploadPanel from './upload-panel.svelte';
  import VersionAnnouncement from './VersionAnnouncement.svelte';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
  import ServerRestartingModal from '$lib/modals/ServerRestartingModal.svelte';
  import { Route } from '$lib/route';
  import { locale } from '$lib/stores/preferences.store';
  import { sidebarStore } from '$lib/stores/sidebar.svelte';
  import { closeWebsocketConnection, openWebsocketConnection, websocketStore } from '$lib/stores/websocket';
  import { maintenanceShouldRedirect } from '$lib/utils/maintenance';
  import { getServerConfig } from '@immich/sdk';
  import {
    modalManager,
    setLocale,
    setTranslations,
    Theme,
    themeManager,
    toastManager,
    TooltipProvider,
  } from '@immich/ui';
  import { onMount, type Snippet } from 'svelte';
  import { t } from 'svelte-i18n';
  import { get } from 'svelte/store';
  import '../app.css';

  interface Props {
    children?: Snippet;
  }

  $effect(() => {
    setTranslations({
      cancel: $t('cancel'),
      close: $t('close'),
      confirm: $t('confirm'),
      expand: $t('expand'),
      collapse: $t('collapse'),
      search_placeholder: $t('search'),
      search_no_results: $t('no_results'),
      prompt_default: $t('are_you_sure_to_do_this'),
      show_password: $t('show_password'),
      hide_password: $t('hide_password'),
      dark_theme: themeManager.value === Theme.Dark ? $t('light_theme') : $t('dark_theme'),
      open_menu: $t('open'),
      command_palette_prompt_default: $t('command_palette_prompt'),
      command_palette_to_select: $t('command_palette_to_select'),
      command_palette_to_navigate: $t('command_palette_to_navigate'),
      command_palette_to_close: $t('command_palette_to_close'),
      command_palette_to_show_all: $t('command_palette_to_show_all'),
      navigate_next: $t('next'),
      navigate_previous: $t('previous'),
      open_calendar: $t('open_calendar'),
      toast_success_title: $t('success'),
      toast_info_title: $t('info'),
      toast_warning_title: $t('warning'),
      toast_danger_title: $t('error'),
      save: $t('save'),
      supporter: $t('supporter'),
    });
  });

  $effect(() => setLocale($locale));

  let { children }: Props = $props();

  let showNavigationLoadingBar = $state(false);

  toastManager.setOptions({ class: 'top-16 fixed' });

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

    const fromRouteId = from?.route?.id;
    const toRouteId = to?.route?.id;
    const sameRouteTransition = fromRouteId && toRouteId && fromRouteId === toRouteId;

    if (sameRouteTransition) {
      return;
    }

    eventManager.emit('AppNavigate');

    showNavigationLoadingBar = true;
  });

  afterNavigate(() => {
    showNavigationLoadingBar = false;
  });

  afterNavigate(closePaletteOnNavigate);

  const { serverRestarting } = websocketStore;

  $effect.pre(() => {
    if (authManager.authenticated || $serverRestarting || page.url.pathname.startsWith(Route.maintenanceMode())) {
      openWebsocketConnection();
    } else {
      closeWebsocketConnection();
    }
  });

  serverRestarting.subscribe((isRestarting) => {
    if (!isRestarting) {
      return;
    }

    if (maintenanceShouldRedirect(isRestarting.isMaintenanceMode, location)) {
      modalManager.show(ServerRestartingModal, {}).catch((error) => console.error('Error [ServerRestartBox]:', error));
    }
  });

  const onWebsocketConnect = async () => {
    const isRestarting = get(serverRestarting);
    if (isRestarting && maintenanceShouldRedirect(isRestarting.isMaintenanceMode, location)) {
      const { maintenanceMode } = await getServerConfig();
      if (maintenanceMode === isRestarting.isMaintenanceMode) {
        location.reload();
      }
    }
  };

  const isApplePlatform = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.platform);

  const openModalSearch = () => {
    // Use valueOrUndefined so the shortcut never throws if it fires before
    // feature flags have loaded (SSR→hydration race).
    if (featureFlagsManager.valueOrUndefined?.search) {
      globalSearchManager.toggle('modal');
    }
  };
</script>

<OnEvents {onWebsocketConnect} />

<VersionAnnouncement />

<svelte:head>
  <title>{page.data.meta?.title || 'Web'} - Immich</title>
  <link rel="manifest" href="/manifest.json" crossorigin="use-credentials" />
  <meta name="theme-color" content="white" media="(prefers-color-scheme: light)" />
  <meta name="theme-color" content="black" media="(prefers-color-scheme: dark)" />

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
  use:shortcut={{
    shortcut: { shift: true, key: 't' },
    onShortcut: () => themeManager.toggle(),
  }}
  use:shortcuts={[
    {
      shortcut: { ctrl: true, key: 'k' },
      onShortcut: () => {
        if (!isApplePlatform) {
          openModalSearch();
        }
      },
    },
    {
      shortcut: { meta: true, key: 'k' },
      onShortcut: () => {
        if (isApplePlatform) {
          openModalSearch();
        }
      },
    },
    {
      shortcut: { ctrl: true, key: '/' },
      onShortcut: () => {
        if (!globalSearchManager.isOpen) {
          return;
        }
        const order: SearchMode[] = ['smart', 'metadata', 'description', 'ocr'];
        const next = order[(order.indexOf(globalSearchManager.mode) + 1) % order.length];
        globalSearchManager.setMode(next);
      },
    },
  ]}
/>

<TooltipProvider>
  <OpenInAppBanner />
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
  {#if globalSearchManager.isOpen && globalSearchManager.presentation === 'modal'}
    <GlobalSearch manager={globalSearchManager} />
  {/if}
</TooltipProvider>
