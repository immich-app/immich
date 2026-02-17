<script lang="ts">
  import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
  import { page } from '$app/state';
  import { shortcut } from '$lib/actions/shortcut';
  import DownloadPanel from '$lib/components/asset-viewer/download-panel.svelte';
  import ErrorLayout from '$lib/components/layouts/ErrorLayout.svelte';
  import AppleHeader from '$lib/components/shared-components/apple-header.svelte';
  import NavigationLoadingBar from '$lib/components/shared-components/navigation-loading-bar.svelte';
  import UploadPanel from '$lib/components/shared-components/upload-panel.svelte';
  import VersionAnnouncement from '$lib/components/VersionAnnouncement.svelte';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
  import { themeManager } from '$lib/managers/theme-manager.svelte';
  import ServerRestartingModal from '$lib/modals/ServerRestartingModal.svelte';
  import { Route } from '$lib/route';
  import { locale } from '$lib/stores/preferences.store';
  import { sidebarStore } from '$lib/stores/sidebar.svelte';
  import { user } from '$lib/stores/user.store';
  import { closeWebsocketConnection, openWebsocketConnection, websocketStore } from '$lib/stores/websocket';
  import { copyToClipboard } from '$lib/utils';
  import { maintenanceShouldRedirect } from '$lib/utils/maintenance';
  import { isAssetViewerRoute } from '$lib/utils/navigation';
  import {
    CommandPaletteDefaultProvider,
    TooltipProvider,
    modalManager,
    setLocale,
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
      dark_theme: $t('dark_theme'),
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

  const getMyImmichLink = () => {
    return new URL(page.url.pathname + page.url.search, 'https://my.immich.app');
  };

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
      onAction: () => goto(Route.users()),
    },
    {
      title: $t('settings'),
      description: $t('admin.settings_page_description'),
      icon: mdiCog,
      onAction: () => goto(Route.systemSettings()),
    },
    {
      title: $t('admin.queues'),
      description: $t('admin.queues_page_description'),
      icon: mdiSync,
      type: $t('page'),
      onAction: () => goto(Route.queues()),
    },
    {
      title: $t('external_libraries'),
      description: $t('admin.external_libraries_page_description'),
      icon: mdiBookshelf,
      onAction: () => goto(Route.libraries()),
    },
    {
      title: $t('server_stats'),
      description: $t('admin.server_stats_page_description'),
      icon: mdiServer,
      onAction: () => goto(Route.systemStatistics()),
    },
  ].map((route) => ({ ...route, type: $t('page'), $if: () => $user?.isAdmin }));

  const commands = $derived([...userCommands, ...adminCommands]);
</script>

<CommandPaletteDefaultProvider name="Global" actions={commands} />
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

  <DownloadPanel />
  <UploadPanel />
</TooltipProvider>
