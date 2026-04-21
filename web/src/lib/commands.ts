import { defaultProvider, screencastManager, themeManager, ThemePreference, type ActionItem } from '@immich/ui';
import {
  mdiAccountMultipleOutline,
  mdiBookshelf,
  mdiCog,
  mdiKeyboard,
  mdiServer,
  mdiSync,
  mdiThemeLightDark,
} from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { authManager } from '$lib/managers/auth-manager.svelte';
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
  ].map((route) => ({ ...route, $if: () => authManager.authenticated && authManager.user.isAdmin }));

  return defaultProvider({ name: $t('page'), actions: adminPages });
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
      onAction: () => copyToClipboard(getMyImmichLink().toString()),
      shortcuts: { ctrl: true, shift: true, key: 'm' },
    },
  ];

  return defaultProvider({ name: $t('command'), actions: settings });
};
