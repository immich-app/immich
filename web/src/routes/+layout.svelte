<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import NavigationLoadingBar from '$lib/components/shared-components/navigation-loading-bar.svelte';
  import DownloadPanel from '$lib/components/asset-viewer/download-panel.svelte';
  import UploadPanel from '$lib/components/shared-components/upload-panel.svelte';
  import NotificationList from '$lib/components/shared-components/notification/notification-list.svelte';
  import VersionAnnouncementBox from '$lib/components/shared-components/version-announcement-box.svelte';
  import type { LayoutData } from './$types';
  import { fileUploadHandler } from '$lib/utils/file-uploader';
  import UploadCover from '$lib/components/shared-components/drag-and-drop-upload-overlay.svelte';
  import FullscreenContainer from '$lib/components/shared-components/fullscreen-container.svelte';
  import AppleHeader from '$lib/components/shared-components/apple-header.svelte';
  import FaviconHeader from '$lib/components/shared-components/favicon-header.svelte';
  import { onMount } from 'svelte';
  import { loadConfig } from '$lib/stores/server-config.store';
  import { handleError } from '$lib/utils/handle-error';
  import { dragAndDropFilesStore } from '$lib/stores/drag-and-drop-files.store';
  import { api } from '@api';
  import { closeWebsocketConnection, openWebsocketConnection } from '$lib/stores/websocket';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiOpenInNew } from '@mdi/js';
  import Button from '$lib/components/elements/buttons/button.svelte';

  // remove after v1.87 is released
  let isOutdated = false;
  const handleCheckOutdated = async () => {
    try {
      let response = await api.serverInfoApi.getServerVersion();
      if (!response.headers['content-type'].startsWith('application/json')) {
        api.setBaseUrl('/api/api');
        response = await api.serverInfoApi.getServerVersion();
      }
      if (response.data.major === 1 && response.data.minor >= 88) {
        isOutdated = true;
      }
    } catch {
      // noop
    }
  };

  let showNavigationLoadingBar = false;
  export let data: LayoutData;
  let albumId: string | undefined;

  if ($page.route.id?.startsWith('/(user)/share/[key]')) {
    api.setKey($page.params.key);
  }

  beforeNavigate(({ from, to }) => {
    const fromRoute = from?.route?.id || '';
    const toRoute = to?.route?.id || '';

    if (fromRoute.startsWith('/auth') && !toRoute.startsWith('/auth')) {
      openWebsocketConnection();
    }

    if (!fromRoute.startsWith('/auth') && toRoute.startsWith('/auth')) {
      closeWebsocketConnection();
    }

    showNavigationLoadingBar = true;
  });

  afterNavigate(() => {
    showNavigationLoadingBar = false;
  });

  onMount(async () => {
    handleCheckOutdated();

    if ($page.route.id?.startsWith('/auth') === false) {
      openWebsocketConnection();
    }

    try {
      await loadConfig();
    } catch (error) {
      handleError(error, 'Unable to connect to server');
    }
  });

  const dropHandler = async ({ dataTransfer }: DragEvent) => {
    const files = dataTransfer?.files;
    if (!files) {
      return;
    }

    const filesArray: File[] = Array.from<File>(files);
    albumId = ($page.route.id === '/(user)/albums/[albumId]' || undefined) && $page.params.albumId;

    const isShare = $page.route.id === '/(user)/share/[key]' || undefined;
    if (isShare) {
      dragAndDropFilesStore.set({ isDragging: true, files: filesArray });
    } else {
      await fileUploadHandler(filesArray, albumId);
    }
  };
</script>

<svelte:head>
  <title>{$page.data.meta?.title || 'Web'} - Immich</title>
  <link rel="manifest" href="/manifest.json" />
  <link rel="stylesheet" href="/custom.css" />
  <meta name="theme-color" content="currentColor" />
  <FaviconHeader />
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

{#if isOutdated}
  <FullscreenContainer title="Notice">
    <section class="text-center text-immich-primary dark:text-immich-dark-primary flex flex-col gap-2">
      <p>
        This container (<span>immich-web</span>) is no longer in use.
      </p>
      <p>
        Please read the announcement about the breaking changes released in <code>v1.88.0</code> and update your configuration
        accordingly.
      </p>

      <a
        href="https://github.com/immich-app/immich/discussions/5086"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-4"
      >
        <Button fullwidth color="primary">
          <span class="flex gap-2 items-center text-md">
            View Announcement
            <Icon path={mdiOpenInNew} />
          </span>
        </Button>
      </a>
    </section>
  </FullscreenContainer>
{:else}
  <slot {albumId} />
{/if}

{#if showNavigationLoadingBar}
  <NavigationLoadingBar />
{/if}

<DownloadPanel />
<UploadPanel />
<NotificationList />

{#if data.user?.isAdmin}
  <VersionAnnouncementBox />
{/if}

{#if $page.route.id?.includes('(user)')}
  <UploadCover {dropHandler} />
{/if}
