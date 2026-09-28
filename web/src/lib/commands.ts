import { defaultProvider, screencastManager, themeManager, ThemePreference, type ActionItem } from '@immich/ui';
import {
  mdiAccountMultipleOutline,
  mdiAccountOutline,
  mdiArchiveArrowDownOutline,
  mdiBookshelf,
  mdiCog,
  mdiContentDuplicate,
  mdiCrosshairsGps,
  mdiFolderOutline,
  mdiHeartOutline,
  mdiImageAlbum,
  mdiImageMultipleOutline,
  mdiImageSizeSelectLarge,
  mdiKeyboard,
  mdiLink,
  mdiLockOutline,
  mdiMagnify,
  mdiMapMarkerOutline,
  mdiMapOutline,
  mdiServer,
  mdiStateMachine,
  mdiSync,
  mdiTagMultipleOutline,
  mdiThemeLightDark,
  mdiToolboxOutline,
  mdiTrashCanOutline,
  mdiWrench,
} from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
import { Route } from '$lib/route';
import { copyToClipboard } from '$lib/utils';

export const getPagesProvider = ($t: MessageFormatter) => {
  const adminPages: ActionItem[] = [
    {
      title: $t('admin.user_management'),
      description: $t('admin.users_page_description'),
      icon: mdiAccountMultipleOutline,
      onAction: () => goto(Route.users()),
    },
    {
      title: $t('admin.system_settings'),
      description: $t('admin.settings_page_description'),
      icon: mdiCog,
      onAction: () => goto(Route.systemSettings()),
    },
    {
      title: $t('admin.queues'),
      description: $t('admin.queues_page_description'),
      icon: mdiSync,
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
    {
      title: $t('admin.maintenance_settings'),
      description: $t('admin.maintenance_settings_description'),
      icon: mdiWrench,
      onAction: () => goto(Route.systemMaintenance()),
    },
  ].map((route) => ({ ...route, $if: () => authManager.authenticated && authManager.user.isAdmin }));

  const userPages: ActionItem[] = [
    {
      title: $t('photos'),
      icon: mdiImageMultipleOutline,
      onAction: () => goto(Route.photos()),
    },
    {
      title: $t('explore'),
      icon: mdiMagnify,
      onAction: () => goto(Route.explore()),
      $if: () => authManager.authenticated && featureFlagsManager.value.search,
    },

    {
      title: $t('map'),
      icon: mdiMapOutline,
      onAction: () => goto(Route.map()),
      $if: () => authManager.authenticated && featureFlagsManager.value.map,
    },
    {
      title: $t('people'),
      description: $t('people_feature_description'),
      icon: mdiAccountOutline,
      onAction: () => goto(Route.people()),
      $if: () => authManager.authenticated && authManager.preferences.people.enabled,
    },
    {
      title: $t('places'),
      icon: mdiMapMarkerOutline,
      onAction: () => goto(Route.places()),
    },
    {
      title: $t('shared_links'),
      icon: mdiLink,
      onAction: () => goto(Route.sharedLinks()),
      $if: () => authManager.authenticated && authManager.preferences.sharedLinks.enabled,
    },
    {
      title: $t('recently_added'),
      icon: mdiMagnify,
      onAction: () => goto(Route.recentlyAdded()),
      $if: () => authManager.authenticated,
    },
    {
      title: $t('sharing'),
      icon: mdiAccountMultipleOutline,
      onAction: () => goto(Route.sharing()),
      $if: () => authManager.authenticated,
    },
    {
      title: $t('favorites'),
      icon: mdiHeartOutline,
      onAction: () => goto(Route.favorites()),
      $if: () => authManager.authenticated,
    },
    {
      title: $t('albums'),
      description: $t('albums_feature_description'),
      icon: mdiImageAlbum,
      onAction: () => goto(Route.albums()),
      $if: () => authManager.authenticated,
    },
    {
      title: $t('tags'),
      description: $t('tag_feature_description'),
      icon: mdiTagMultipleOutline,
      onAction: () => goto(Route.tags()),
      $if: () => authManager.authenticated && authManager.preferences.tags.enabled,
    },
    {
      title: $t('folders'),
      description: $t('folders_feature_description'),
      icon: mdiFolderOutline,
      onAction: () => goto(Route.folders()),
      $if: () => authManager.authenticated && authManager.preferences.folders.enabled,
    },
    {
      title: $t('utilities'),
      icon: mdiToolboxOutline,
      onAction: () => goto(Route.utilities()),
      $if: () => authManager.authenticated,
    },
    {
      title: $t('archive'),
      icon: mdiArchiveArrowDownOutline,
      onAction: () => goto(Route.archive()),
      $if: () => authManager.authenticated,
    },
    {
      title: $t('locked_folder'),
      icon: mdiLockOutline,
      onAction: () => goto(Route.locked()),
      $if: () => authManager.authenticated,
    },
    {
      title: $t('trash'),
      icon: mdiTrashCanOutline,
      onAction: () => goto(Route.trash()),
      $if: () => authManager.authenticated && featureFlagsManager.value.trash,
    },
    {
      title: $t('admin.user_settings'),
      icon: mdiCog,
      onAction: () => goto(Route.userSettings()),
      $if: () => authManager.authenticated,
    },
  ].map((route) => ({ $if: () => authManager.authenticated, ...route }));

  const utilityPages: ActionItem[] = [
    {
      title: $t('review_duplicates'),
      icon: mdiContentDuplicate,
      onAction: () => goto(Route.duplicatesUtility()),
    },
    {
      title: $t('review_large_files'),
      icon: mdiImageSizeSelectLarge,
      onAction: () => goto(Route.largeFileUtility()),
    },
    {
      title: $t('manage_geolocation'),
      icon: mdiCrosshairsGps,
      onAction: () => goto(Route.geolocationUtility()),
    },
    {
      title: $t('workflows'),
      icon: mdiStateMachine,
      onAction: () => goto(Route.workflows()),
    },
  ].map((route) => ({ ...route, $if: () => authManager.authenticated }));

  return defaultProvider({ name: $t('page'), actions: [...userPages, ...utilityPages, ...adminPages] });
};

const getMyImmichLink = () => {
  return new URL(page.url.pathname + page.url.search, 'https://my.immich.app');
};

export const getSettingsProvider = ($t: MessageFormatter) => {
  const settings: ActionItem[] = [
    {
      title: $t('theme'),
      description: $t('toggle_theme_description'),
      icon: mdiThemeLightDark,
      onAction: () => themeManager.toggle(),
      shortcuts: { shift: true, key: 't' },
    },
    {
      title: $t('system_theme'),
      description: $t('system_theme_command_description', {
        values: { value: themeManager.prefersDark ? $t('dark') : $t('light') },
      }),
      icon: mdiThemeLightDark,
      onAction: () => themeManager.setPreference(ThemePreference.System),
    },
    {
      title: $t('screencast_mode_title'),
      description: $t('screencast_mode_description'),
      icon: mdiKeyboard,
      onAction: () => screencastManager.toggle(),
    },
    {
      title: $t('my_immich_title'),
      description: $t('my_immich_description'),
      onAction: () => copyToClipboard(getMyImmichLink().href),
      shortcuts: { ctrl: true, shift: true, key: 'm' },
    },
  ];

  return defaultProvider({ name: $t('command'), actions: settings });
};
