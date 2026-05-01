<script lang="ts">
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { getPagesProvider, getSettingsProvider } from '$lib/commands';
  import DownloadPanel from './DownloadPanel.svelte';
  import ErrorLayout from './ErrorLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import NavigationLoadingBar from './NavigationLoadingBar.svelte';
  import UploadPanel from './UploadPanel.svelte';
  import VersionAnnouncement from './VersionAnnouncement.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
  import ServerRestartingModal from '$lib/modals/ServerRestartingModal.svelte';
  import { Route } from '$lib/route';
  import { lang, locale } from '$lib/stores/preferences.store';
  import { sidebarStore } from '$lib/stores/sidebar.svelte';
  import { closeWebsocketConnection, openWebsocketConnection, websocketStore } from '$lib/stores/websocket';
  import { maintenanceShouldRedirect } from '$lib/utils/maintenance';
  import { getServerConfig } from '@immich/sdk';
  import {
    CommandPaletteProvider,
    CORE_PAGE_COMMANDS,
    defaultProvider,
    MOBILE_APP_COMMANDS,
    modalManager,
    OTHER_SITE_COMMANDS,
    PROJECT_SUPPORT_COMMANDS,
    ScreencastOverlay,
    setLocale,
    setTranslations,
    SOCIAL_COMMANDS,
    Theme,
    themeManager,
    toastManager,
    TooltipProvider,
  } from '@immich/ui';
  import { En } from 'media-chrome/lang/en';
  import { addTranslation } from 'media-chrome/utils/i18n';
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

    addTranslation($lang, {
      'Start airplay': En['Start airplay'],
      'Stop airplay': En['Stop airplay'],
      Audio: En['Audio'],
      Captions: $t('media_chrome.captions'),
      'Enable captions': $t('media_chrome.enable_captions'),
      'Disable captions': $t('media_chrome.disable_captions'),
      'Start casting': En['Start casting'],
      'Stop casting': En['Stop casting'],
      'Enter fullscreen mode': $t('media_chrome.enter_fullscreen_mode'),
      'Exit fullscreen mode': $t('media_chrome.exit_fullscreen_mode'),
      Mute: $t('media_chrome.mute'),
      Unmute: $t('media_chrome.unmute'),
      Loop: $t('media_chrome.loop'),
      'Enter picture in picture mode': En['Enter picture in picture mode'],
      'Exit picture in picture mode': En['Exit picture in picture mode'],
      Play: $t('play'),
      Pause: $t('pause'),
      'Playback rate': $t('media_chrome.playback_rate'),
      'Playback rate {playbackRate}': $t('media_chrome.playback_rate_value'),
      Quality: $t('media_chrome.quality'),
      'Seek backward': En['Seek backward'],
      'Seek forward': En['Seek forward'],
      Settings: $t('settings'),
      Auto: $t('media_chrome.auto'),
      'audio player': En['audio player'],
      'video player': $t('media_chrome.video_player'),
      volume: $t('media_chrome.volume'),
      seek: En['seek'],
      'closed captions':$t('media_chrome.closed_captions'),
      'current playback rate': $t('media_chrome.playback_rate_current'),
      'playback time': $t('media_chrome.playback_time'),
      'media loading': $t('media_chrome.media_loading'),
      settings: $t('settings'),
      'audio tracks': En['audio tracks'],
      quality: $t('media_chrome.quality'),
      play: $t('play'),
      pause: $t('pause'),
      mute: $t('media_chrome.mute'),
      unmute: $t('media_chrome.unmute'),
      'chapter: {chapterName}': En['chapter: {chapterName}'],
      live: En['live'],
      Off: $t('media_chrome.captions_off'),
      'start airplay': En['start airplay'],
      'stop airplay': En['stop airplay'],
      'start casting': En['start casting'],
      'stop casting': En['stop casting'],
      'enter fullscreen mode': $t('media_chrome.enter_fullscreen_mode'),
      'exit fullscreen mode': $t('media_chrome.exit_fullscreen_mode'),
      'enter picture in picture mode': En['enter picture in picture mode'],
      'exit picture in picture mode': En['exit picture in picture mode'],
      'seek to live': En['seek to live'],
      'playing live': En['playing live'],
      'seek back {seekOffset} seconds': En['seek back {seekOffset} seconds'],
      'seek forward {seekOffset} seconds': En['seek forward {seekOffset} seconds'],
      'Network Error': $t('media_chrome.network_error'),
      'Decode Error': $t('media_chrome.decode_error'),
      'Source Not Supported': $t('media_chrome.not_supported_error'),
      'Encryption Error': En['Encryption Error'],
      'A network error caused the media download to fail.': $t('media_chrome.network_error_description'),
      'A media error caused playback to be aborted. The media could be corrupt or your browser does not support this format.':
        $t('media_chrome.media_error_description'),
      'An unsupported error occurred. The server or network failed, or your browser does not support this format.': $t(
        'media_chrome.unsupported_error_description',
      ),
      'The media is encrypted and there are no keys to decrypt it.':
        En['The media is encrypted and there are no keys to decrypt it.'],
      hour: $t('hour'),
      hours: $t('hours'),
      minute: $t('minute'),
      minutes: $t('minutes'),
      second: $t('media_chrome.second'),
      seconds: $t('media_chrome.seconds'),
      '{time} remaining': $t('media_chrome.time_value_remaining'),
      '{currentTime} of {totalTime}': $t('media_chrome.time_value_of_total_time'),
      'video not loaded, unknown time.': $t('media_chrome.video_not_loaded_unknown_time'),
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
  <ScreencastOverlay />

  <CommandPaletteProvider
    providers={[
      getPagesProvider($t),
      getSettingsProvider($t),
      defaultProvider({ name: $t('documentation'), types: ['doc', 'documentation'], actions: CORE_PAGE_COMMANDS }),
      defaultProvider({ name: $t('support'), actions: PROJECT_SUPPORT_COMMANDS }),
      defaultProvider({ name: 'Socials', types: ['social', 'socials'], actions: SOCIAL_COMMANDS }),
      defaultProvider({ name: $t('mobile_app'), actions: MOBILE_APP_COMMANDS }),
      defaultProvider({ name: 'Sites', types: ['site', 'sites'], actions: OTHER_SITE_COMMANDS }),
    ]}
  />
</TooltipProvider>
