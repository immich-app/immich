import { Route } from '$lib/route';
import type { ServerFeaturesDto } from '@immich/sdk';
import {
  mdiAccountMultipleOutline,
  mdiAccountOutline,
  mdiArchive,
  mdiBackupRestore,
  mdiBellOutline,
  mdiBookOpenOutline,
  mdiBookshelf,
  mdiClockOutline,
  mdiCog,
  mdiDatabaseOutline,
  mdiFileDocumentOutline,
  mdiFolderOutline,
  mdiHeart,
  mdiHistory,
  mdiImageMultiple,
  mdiImageOutline,
  mdiLockOutline,
  mdiMagnifyScan,
  mdiMap,
  mdiMapMarkerOutline,
  mdiPaletteOutline,
  mdiRobotOutline,
  mdiServer,
  mdiServerOutline,
  mdiShareVariantOutline,
  mdiSync,
  mdiTagMultipleOutline,
  mdiTrashCanOutline,
  mdiUpdate,
  mdiVideoOutline,
  mdiViewAgenda,
} from '@mdi/js';
import { isAlmostExactWordMatch } from './cmdk-match';

export type NavigationCategory = 'systemSettings' | 'admin' | 'userPages';

export interface NavigationItem {
  id: string;
  category: NavigationCategory;
  labelKey: string;
  descriptionKey: string;
  icon: string;
  /** Non-empty route. All navigation items lead to a real page; stateless side-effects
   * live in the commands registry (command-items.ts) instead. */
  route: string;
  adminOnly: boolean;
  /**
   * Optional feature-flag gate. Item is hidden when
   * `featureFlagsManager.valueOrUndefined?.[featureFlag]` is falsy.
   */
  featureFlag?: keyof ServerFeaturesDto;
}

/**
 * System-settings accordions. Each item deep-links to the system-settings page with
 * the `isOpen=<key>` query param which opens the matching accordion on load.
 * Keys mirror `web/src/routes/admin/system-settings/+page.svelte` — a drift-guard
 * test in navigation-items.spec.ts grep-validates against that source file.
 */
const SYSTEM_SETTINGS_SOURCE: ReadonlyArray<[key: string, baseKey: string, icon: string]> = [
  ['authentication', 'authentication_settings', mdiLockOutline],
  ['backup', 'backup_settings', mdiBackupRestore],
  ['image', 'image_settings', mdiImageOutline],
  ['job', 'job_settings', mdiSync],
  ['external-library', 'library_settings', mdiBookshelf],
  ['logging', 'logging_settings', mdiFileDocumentOutline],
  ['machine-learning', 'machine_learning_settings', mdiRobotOutline],
  ['classification', 'classification_settings', mdiMagnifyScan],
  ['location', 'map_gps_settings', mdiMapMarkerOutline],
  ['memories', 'memories_settings', mdiHistory],
  ['metadata', 'metadata_settings', mdiDatabaseOutline],
  ['nightly-tasks', 'nightly_tasks_settings', mdiClockOutline],
  ['notifications', 'notification_settings', mdiBellOutline],
  ['server', 'server_settings', mdiServerOutline],
  ['storage-template', 'storage_template_settings', mdiFolderOutline],
  ['theme', 'theme_settings', mdiPaletteOutline],
  ['trash', 'trash_settings', mdiTrashCanOutline],
  ['user-settings', 'user_settings', mdiAccountOutline],
  ['version-check', 'version_check_settings', mdiUpdate],
  ['video-transcoding', 'transcoding_settings', mdiVideoOutline],
];

const SYSTEM_SETTINGS: readonly NavigationItem[] = SYSTEM_SETTINGS_SOURCE.map(([key, base, icon]) => ({
  id: `nav:systemSettings:${key}`,
  category: 'systemSettings' as const,
  labelKey: `admin.${base}`,
  descriptionKey: `admin.${base}_description`,
  icon,
  route: `/admin/system-settings?isOpen=${key}`,
  adminOnly: true,
}));

const ADMIN_PAGES: readonly NavigationItem[] = [
  {
    id: 'nav:admin:users',
    category: 'admin',
    labelKey: 'users',
    descriptionKey: 'admin.users_page_description',
    icon: mdiAccountMultipleOutline,
    route: '/admin/users',
    adminOnly: true,
  },
  {
    id: 'nav:admin:libraries',
    category: 'admin',
    labelKey: 'external_libraries',
    descriptionKey: 'admin.external_libraries_page_description',
    icon: mdiBookshelf,
    route: '/admin/library-management',
    adminOnly: true,
  },
  {
    id: 'nav:admin:queues',
    category: 'admin',
    labelKey: 'admin.queues',
    descriptionKey: 'admin.queues_page_description',
    icon: mdiSync,
    route: '/admin/queues',
    adminOnly: true,
  },
  {
    id: 'nav:admin:server-stats',
    category: 'admin',
    labelKey: 'server_stats',
    descriptionKey: 'admin.server_stats_page_description',
    icon: mdiServer,
    route: '/admin/system-statistics',
    adminOnly: true,
  },
  {
    id: 'nav:admin:maintenance',
    category: 'admin',
    labelKey: 'cmdk_nav_maintenance',
    descriptionKey: 'cmdk_nav_maintenance_description',
    icon: mdiCog,
    route: '/admin/maintenance',
    adminOnly: true,
  },
];

const USER_PAGES: readonly NavigationItem[] = [
  {
    id: 'nav:userPages:photos',
    category: 'userPages',
    labelKey: 'photos',
    descriptionKey: 'cmdk_nav_photos_description',
    icon: mdiImageMultiple,
    route: '/photos',
    adminOnly: false,
  },
  {
    id: 'nav:userPages:albums',
    category: 'userPages',
    labelKey: 'albums',
    descriptionKey: 'cmdk_nav_albums_description',
    icon: mdiViewAgenda,
    route: '/albums',
    adminOnly: false,
  },
  {
    id: 'nav:userPages:people',
    category: 'userPages',
    labelKey: 'people',
    descriptionKey: 'cmdk_nav_people_description',
    icon: mdiAccountMultipleOutline,
    route: '/people',
    adminOnly: false,
  },
  {
    id: 'nav:userPages:tags',
    category: 'userPages',
    labelKey: 'tags',
    descriptionKey: 'cmdk_nav_tags_description',
    icon: mdiTagMultipleOutline,
    route: '/tags',
    adminOnly: false,
  },
  {
    id: 'nav:userPages:map',
    category: 'userPages',
    labelKey: 'map',
    descriptionKey: 'cmdk_nav_map_description',
    icon: mdiMap,
    route: '/map',
    adminOnly: false,
    featureFlag: 'map',
  },
  {
    id: 'nav:userPages:sharing',
    category: 'userPages',
    labelKey: 'sharing',
    descriptionKey: 'sharing_page_description',
    icon: mdiShareVariantOutline,
    route: '/sharing',
    adminOnly: false,
  },
  {
    id: 'nav:userPages:spaces',
    category: 'userPages',
    labelKey: 'spaces',
    descriptionKey: 'cmdk_nav_spaces_description',
    icon: mdiBookOpenOutline,
    route: '/spaces',
    adminOnly: false,
  },
  {
    id: 'nav:userPages:trash',
    category: 'userPages',
    labelKey: 'trash',
    descriptionKey: 'cmdk_nav_trash_description',
    icon: mdiTrashCanOutline,
    route: '/trash',
    adminOnly: false,
    featureFlag: 'trash',
  },
  {
    id: 'nav:userPages:favorites',
    category: 'userPages',
    labelKey: 'favorites',
    descriptionKey: 'cmdk_nav_favorites_description',
    icon: mdiHeart,
    route: '/favorites',
    adminOnly: false,
  },
  {
    id: 'nav:userPages:archive',
    category: 'userPages',
    labelKey: 'archive',
    descriptionKey: 'cmdk_nav_archive_description',
    icon: mdiArchive,
    route: '/archive',
    adminOnly: false,
  },
  {
    id: 'nav:userPages:memories',
    category: 'userPages',
    labelKey: 'memories',
    descriptionKey: 'cmdk_nav_memories_description',
    icon: mdiHistory,
    route: Route.memories(),
    adminOnly: false,
  },
];

export const NAVIGATION_ITEMS: readonly NavigationItem[] = [...SYSTEM_SETTINGS, ...ADMIN_PAGES, ...USER_PAGES];

const MIN_MATCH_LENGTH = 3;

/**
 * "Almost exact" match — used to promote a navigation item to the palette's
 * "Top result" band above photos/places/etc. when the query unambiguously
 * points at its label.
 *
 * Rule: after case-folding and splitting both sides on non-alphanumerics, at
 * least one query word ≥ 3 chars must be a prefix of some label word. The
 * length floor keeps single-letter queries from promoting the first match in
 * the catalog, and working at word granularity lets compound queries like
 * `auto-classification` still promote `Classification Settings` by matching
 * on the second query word.
 *
 * Only the label is inspected, not the description — the description is
 * richer and would promote items the user did not visually intend to pick.
 */
export function isAlmostExactNavMatch(query: string, label: string): boolean {
  return isAlmostExactWordMatch(query, label, MIN_MATCH_LENGTH);
}
