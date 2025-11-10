<script lang="ts">
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { shortcut } from '$lib/actions/shortcut';
  import DownloadPanel from '$lib/components/asset-viewer/download-panel.svelte';
  import ErrorLayout from '$lib/components/layouts/ErrorLayout.svelte';
  import AppleHeader from '$lib/components/shared-components/apple-header.svelte';
  import NavigationLoadingBar from '$lib/components/shared-components/navigation-loading-bar.svelte';
  import UploadPanel from '$lib/components/shared-components/upload-panel.svelte';
  import { AppRoute } from '$lib/constants';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { themeManager } from '$lib/managers/theme-manager.svelte';
  import VersionAnnouncementModal from '$lib/modals/VersionAnnouncementModal.svelte';
  import { serverConfig } from '$lib/stores/server-config.store';
  import { user } from '$lib/stores/user.store';
  import {
    closeWebsocketConnection,
    openWebsocketConnection,
    websocketStore,
    type ReleaseEvent,
  } from '$lib/stores/websocket';
  import { copyToClipboard, getReleaseType } from '$lib/utils';
  import { isAssetViewerRoute } from '$lib/utils/navigation';
  import type { ServerVersionResponseDto } from '@immich/sdk';
  import { CommandPaletteContext, modalManager, setTranslations, type CommandItem } from '@immich/ui';
  import { mdiAccountMultipleOutline, mdiBookshelf, mdiCog, mdiServer, mdiSync, mdiThemeLightDark } from '@mdi/js';
  import { onMount, type Snippet } from 'svelte';
  import { t } from 'svelte-i18n';
  import { run } from 'svelte/legacy';
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
    });
  });

  let { children }: Props = $props();

  let showNavigationLoadingBar = $state(false);

  const getMyImmichLink = () => {
    return new URL(page.url.pathname + page.url.search, 'https://my.immich.app');
  };

  onMount(() => {
    const element = document.querySelector('#stencil');
    element?.remove();
    // if the browser theme changes, changes the Immich theme too
  });

  eventManager.emit('AppInit');

  beforeNavigate(({ from, to }) => {
    if (isAssetViewerRoute(from) && isAssetViewerRoute(to)) {
      return;
    }
    showNavigationLoadingBar = true;
  });

  afterNavigate(() => {
    showNavigationLoadingBar = false;
  });
  run(() => {
    if ($user) {
      openWebsocketConnection();
    } else {
      closeWebsocketConnection();
    }
  });

  const semverToName = ({ major, minor, patch }: ServerVersionResponseDto) => `v${major}.${minor}.${patch}`;
  const { release } = websocketStore;

  const handleRelease = async (release?: ReleaseEvent) => {
    if (!release?.isAvailable || !$user.isAdmin) {
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

  const userCommands: CommandItem[] = [
    {
      title: $t('theme'),
      description: $t('toggle_theme_description'),
      type: $t('command'),
      icon: mdiThemeLightDark,
      action: () => themeManager.toggleTheme(),
      shortcuts: { shift: true, key: 't' },
    },
  ];

  const adminCommands: CommandItem[] = [
    {
      title: $t('users'),
      description: $t('admin.users_page_description'),
      type: $t('page'),
      icon: mdiAccountMultipleOutline,
      href: AppRoute.ADMIN_USERS,
    },
    {
      title: $t('jobs'),
      description: $t('admin.jobs_page_description'),
      type: $t('page'),
      icon: mdiSync,
      href: AppRoute.ADMIN_JOBS,
    },
    {
      title: $t('settings'),
      description: $t('admin.jobs_page_description'),
      type: $t('page'),
      icon: mdiCog,
      href: AppRoute.ADMIN_SETTINGS,
    },
    {
      title: $t('external_libraries'),
      description: $t('admin.external_libraries_page_description'),
      type: $t('page'),
      icon: mdiBookshelf,
      href: AppRoute.ADMIN_LIBRARY_MANAGEMENT,
    },
    {
      title: $t('server_stats'),
      description: $t('admin.server_stats_page_description'),
      type: $t('page'),
      icon: mdiServer,
      href: AppRoute.ADMIN_STATS,
    },
  ];

  const commands = $derived([...userCommands, ...($user?.isAdmin ? adminCommands : [])]);

  $effect(() => void handleRelease($release));
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

<svelte:document
  use:shortcut={{
    shortcut: { ctrl: true, shift: true, key: 'm' },
    onShortcut: () => copyToClipboard(getMyImmichLink().toString()),
  }}
/>

<CommandPaletteContext {commands} global />

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
