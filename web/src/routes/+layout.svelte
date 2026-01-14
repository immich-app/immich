<script lang="ts">
  import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
  import { page } from '$app/state';
  import { shortcut } from '$lib/actions/shortcut';
  import DownloadPanel from '$lib/components/asset-viewer/download-panel.svelte';
  import ErrorLayout from '$lib/components/layouts/ErrorLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import AppleHeader from '$lib/components/shared-components/apple-header.svelte';
  import NavigationLoadingBar from '$lib/components/shared-components/navigation-loading-bar.svelte';
  import UploadPanel from '$lib/components/shared-components/upload-panel.svelte';
  import { AppRoute } from '$lib/constants';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
  import { themeManager } from '$lib/managers/theme-manager.svelte';
  import ServerRestartingModal from '$lib/modals/ServerRestartingModal.svelte';
  import VersionAnnouncementModal from '$lib/modals/VersionAnnouncementModal.svelte';
  import { sidebarStore } from '$lib/stores/sidebar.svelte';
  import { user } from '$lib/stores/user.store';
  import { closeWebsocketConnection, openWebsocketConnection, websocketStore } from '$lib/stores/websocket';
  import type { ReleaseEvent } from '$lib/types';
  import { copyToClipboard, getReleaseType, semverToName } from '$lib/utils';
  import { maintenanceShouldRedirect } from '$lib/utils/maintenance';
  import { isAssetViewerRoute } from '$lib/utils/navigation';
  import {
    CommandPaletteDefaultProvider,
    TooltipProvider,
    modalManager,
    setTranslations,
    toastManager,
    type ActionItem,
  } from '@immich/ui';
  import { mdiAccountMultipleOutline, mdiBookshelf, mdiCog, mdiServer, mdiSync, mdiThemeLightDark } from '@mdi/js';
  import { onMount, type Snippet } from 'svelte';
  import { t } from 'svelte-i18n';
  import '../app.css';

  interface Props {
    children?: Snippet;
  }

  $effect(() => {
    setTranslations({
      close: $t('close'),
      show_password: $t('show_password'),
      hide_password: $t('hide_password'),
      confirm: $t('confirm'),
      cancel: $t('cancel'),
      toast_success_title: $t('success'),
      toast_info_title: $t('info'),
      toast_warning_title: $t('warning'),
      toast_danger_title: $t('error'),
      navigate_next: $t('next'),
      navigate_previous: $t('previous'),
    });
  });

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

  $effect.pre(() => {
    if ($user || page.url.pathname.startsWith(AppRoute.MAINTENANCE)) {
      openWebsocketConnection();
    } else {
      closeWebsocketConnection();
    }
  });

  const { serverRestarting } = websocketStore;

  const onReleaseEvent = async (release: ReleaseEvent) => {
    if (!release.isAvailable || !$user.isAdmin) {
      return;
    }

    const releaseVersion = semverToName(release.releaseVersion);
    const serverVersion = semverToName(release.serverVersion);
    const type = getReleaseType(release.serverVersion, release.releaseVersion);

    if (type === 'none' || type === 'patch' || localStorage.getItem('appVersion') === releaseVersion) {
      return;
    }

    try {
      await modalManager.show(VersionAnnouncementModal, { serverVersion, releaseVersion });
      localStorage.setItem('appVersion', releaseVersion);
    } catch (error) {
      console.error('Error [VersionAnnouncementBox]:', error);
    }
  };

  serverRestarting.subscribe((isRestarting) => {
    if (!isRestarting) {
      return;
    }

    if (maintenanceShouldRedirect(isRestarting.isMaintenanceMode, location)) {
      modalManager.show(ServerRestartingModal, {}).catch((error) => console.error('Error [ServerRestartBox]:', error));

      // we will be disconnected momentarily
      // wait for reconnect then reload
      let waiting = false;
      websocketStore.connected.subscribe((connected) => {
        if (!connected) {
          waiting = true;
        } else if (connected && waiting) {
          location.reload();
        }
      });
    }
  });

  const userCommands: ActionItem[] = [
    {
      title: $t('theme'),
      description: $t('toggle_theme_description'),
      type: $t('command'),
      icon: mdiThemeLightDark,
      onAction: () => themeManager.toggleTheme(),
      shortcuts: { shift: true, key: 't' },
    },
  ];

  const adminCommands: ActionItem[] = [
    {
      title: $t('users'),
      description: $t('admin.users_page_description'),
      icon: mdiAccountMultipleOutline,
      onAction: () => goto(AppRoute.ADMIN_USERS),
    },
    {
      title: $t('settings'),
      description: $t('admin.settings_page_description'),
      icon: mdiCog,
      onAction: () => goto(AppRoute.ADMIN_SETTINGS),
    },
    {
      title: $t('admin.queues'),
      description: $t('admin.queues_page_description'),
      icon: mdiSync,
      type: $t('page'),
      onAction: () => goto(AppRoute.ADMIN_QUEUES),
    },
    {
      title: $t('external_libraries'),
      description: $t('admin.external_libraries_page_description'),
      icon: mdiBookshelf,
      onAction: () => goto(AppRoute.ADMIN_LIBRARIES),
    },
    {
      title: $t('server_stats'),
      description: $t('admin.server_stats_page_description'),
      icon: mdiServer,
      onAction: () => goto(AppRoute.ADMIN_STATS),
    },
  ].map((route) => ({ ...route, type: $t('page'), $if: () => $user?.isAdmin }));

  const commands = $derived([...userCommands, ...adminCommands]);
</script>

<OnEvents {onReleaseEvent} />
<CommandPaletteDefaultProvider name="Global" actions={commands} />

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

  <DownloadPanel />
  <UploadPanel />
</TooltipProvider>
