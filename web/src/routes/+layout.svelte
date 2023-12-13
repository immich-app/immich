<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import NavigationLoadingBar from '$lib/components/shared-components/navigation-loading-bar.svelte';
  import DownloadPanel from '$lib/components/asset-viewer/download-panel.svelte';
  import UploadPanel from '$lib/components/shared-components/upload-panel.svelte';
  import NotificationList from '$lib/components/shared-components/notification/notification-list.svelte';
  import VersionAnnouncementBox from '$lib/components/shared-components/version-announcement-box.svelte';
  import { fileUploadHandler } from '$lib/utils/file-uploader';
  import UploadCover from '$lib/components/shared-components/drag-and-drop-upload-overlay.svelte';
  import FullscreenContainer from '$lib/components/shared-components/fullscreen-container.svelte';
  import AppleHeader from '$lib/components/shared-components/apple-header.svelte';
  import { onMount } from 'svelte';
  import { loadConfig } from '$lib/stores/server-config.store';
  import { handleError } from '$lib/utils/handle-error';
  import { dragAndDropFilesStore } from '$lib/stores/drag-and-drop-files.store';
  import { api } from '@api';
  import { closeWebsocketConnection, openWebsocketConnection } from '$lib/stores/websocket';
  import { user } from '$lib/stores/user.store';

  let showNavigationLoadingBar = false;
  let albumId: string | undefined;

  const isSharedLinkRoute = (route: string | null) => route?.startsWith('/(user)/share/[key]');
  const isAuthRoute = (route?: string) => route?.startsWith('/auth');

  if (isSharedLinkRoute($page.route?.id)) {
    api.setKey($page.params.key);
  }

  beforeNavigate(({ from, to }) => {
    const fromRoute = from?.route?.id || '';
    const toRoute = to?.route?.id || '';

    if (isAuthRoute(fromRoute) && !isAuthRoute(toRoute)) {
      openWebsocketConnection();
    }

    if (!isAuthRoute(fromRoute) && isAuthRoute(toRoute)) {
      closeWebsocketConnection();
    }

    showNavigationLoadingBar = true;
  });

  afterNavigate(() => {
    showNavigationLoadingBar = false;
  });

  onMount(async () => {
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

<slot {albumId} />

{#if showNavigationLoadingBar}
  <NavigationLoadingBar />
{/if}

<DownloadPanel />
<UploadPanel />
<NotificationList />

{#if $user?.isAdmin}
  <VersionAnnouncementBox />
{/if}

{#if $page.route.id?.includes('(user)')}
  <UploadCover {dropHandler} />
{/if}
