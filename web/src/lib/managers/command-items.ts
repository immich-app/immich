import { goto } from '$app/navigation';
import { ADMIN_VISIBLE_QUEUES } from '$lib/constants';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { isAlmostExactWordMatch } from '$lib/managers/cmdk-match';
import type { CommandContext } from '$lib/managers/command-context-manager.svelte';
import {
  canAddSelectedToAlbum,
  canAddSelectedToCurrentSpace,
  canAddSelectedToSpace,
  canArchiveSelected,
  canDeleteSelected,
  canFavoriteSelected,
  handleAddSelectedToAlbum,
  handleAddSelectedToCurrentSpace,
  handleAddSelectedToSpace,
  handleArchiveSelected,
  handleDeleteSelected,
  handleFavoriteSelected,
} from '$lib/managers/selection-command-handlers';
import AlbumEditModal from '$lib/modals/AlbumEditModal.svelte';
import AlbumOptionsModal from '$lib/modals/AlbumOptionsModal.svelte';
import ShortcutsModal from '$lib/modals/ShortcutsModal.svelte';
import SpaceAddMemberModal from '$lib/modals/SpaceAddMemberModal.svelte';
import SpaceCreateModal from '$lib/modals/SpaceCreateModal.svelte';
import SpaceMembersModal from '$lib/modals/SpaceMembersModal.svelte';
import { Route } from '$lib/route';
import { handleDeleteAlbum, handleDownloadAlbum } from '$lib/services/album.service';
import { asQueueItem } from '$lib/services/queue.service';
import { clearEntries } from '$lib/stores/cmdk-recent';
import { createAlbumAndRedirect } from '$lib/utils/album-utils';
import { openFileUploadDialog } from '$lib/utils/file-uploader';
import { handleError } from '$lib/utils/handle-error';
import {
  bulkAddAssets,
  emptyQueue,
  QueueCommand,
  QueueName,
  removeMember,
  removeSpace,
  removeUserFromAlbum,
  runQueueCommandLegacy,
  type ServerFeaturesDto,
} from '@immich/sdk';
import { modalManager, themeManager, toastManager } from '@immich/ui';
import {
  mdiAccountGroupOutline,
  mdiAccountMultiplePlus,
  mdiAccountPlus,
  mdiAccountSearchOutline,
  mdiArchiveArrowDownOutline,
  mdiBrain,
  mdiBroom,
  mdiCloudUploadOutline,
  mdiDeleteOutline,
  mdiDownload,
  mdiExitRun,
  mdiFaceRecognition,
  mdiHeartOutline,
  mdiImageMultipleOutline,
  mdiImageOutline,
  mdiImagePlusOutline,
  mdiInformationOutline,
  mdiKeyboardOutline,
  mdiLogoutVariant,
  mdiPauseCircleOutline,
  mdiPlayCircleOutline,
  mdiPlaylistPlus,
  mdiRenameOutline,
  mdiRestore,
  mdiShareVariantOutline,
  mdiThemeLightDark,
} from '@mdi/js';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';

const MIN_MATCH_LENGTH = 3;

export interface CommandItem {
  id: `cmd:${string}`;
  labelKey: string;
  descriptionKey: string;
  icon: string;
  handler: (ctx?: CommandContext) => void | Promise<unknown>;
  /** Reserved for v1.3.1 admin verbs. Not used by any v1.3.0 item. */
  adminOnly?: boolean;
  /** Reserved for future feature-flag gating. Not used in v1.3.0. */
  featureFlag?: keyof ServerFeaturesDto;
  /** Sync predicate gating appearance. Omit for always-available commands. Throwing excludes. */
  isAvailable?: (ctx: CommandContext) => boolean;
  /** Requires inline two-step Enter confirmation. */
  destructive?: boolean;
}

async function runQueue(name: QueueName) {
  const $t = get(t);
  const item = asQueueItem($t, { name });
  try {
    await runQueueCommandLegacy({
      name,
      queueCommandDto: { command: QueueCommand.Start, force: false },
    });
    toastManager.primary($t('cmdk_cmd_job_started', { values: { job: item.title } }));
  } catch (error) {
    handleError(error, $t('errors.something_went_wrong'));
  }
}

async function bulkQueueCommand(command: QueueCommand.Pause | QueueCommand.Resume) {
  const results = await Promise.allSettled(
    ADMIN_VISIBLE_QUEUES.map((name) => runQueueCommandLegacy({ name, queueCommandDto: { command } })),
  );
  const failed = results.filter((r) => r.status === 'rejected').length;
  const $t = get(t);
  if (failed > 0) {
    toastManager.warning($t('cmdk_cmd_bulk_partial', { values: { failed, total: results.length } }));
    return;
  }
  toastManager.primary($t(command === QueueCommand.Pause ? 'cmdk_cmd_all_paused' : 'cmdk_cmd_all_resumed'));
}

async function clearAllFailedJobs() {
  const results = await Promise.allSettled(
    ADMIN_VISIBLE_QUEUES.map((name) => emptyQueue({ name, queueDeleteDto: { failed: true } })),
  );
  const failed = results.filter((r) => r.status === 'rejected').length;
  const $t = get(t);
  if (failed > 0) {
    toastManager.warning($t('cmdk_cmd_bulk_partial', { values: { failed, total: results.length } }));
    return;
  }
  toastManager.primary($t('cmdk_cmd_failed_cleared'));
}

export const COMMAND_ITEMS: readonly CommandItem[] = [
  {
    id: 'cmd:theme',
    labelKey: 'theme',
    descriptionKey: 'cmdk_cmd_theme_description',
    icon: mdiThemeLightDark,
    handler: () => themeManager.toggle(),
  },
  {
    id: 'cmd:upload',
    labelKey: 'upload',
    descriptionKey: 'cmdk_cmd_upload_description',
    icon: mdiCloudUploadOutline,
    handler: () => openFileUploadDialog(),
  },
  {
    id: 'cmd:new_album',
    labelKey: 'new_album',
    descriptionKey: 'cmdk_cmd_new_album_description',
    icon: mdiPlaylistPlus,
    handler: () => createAlbumAndRedirect(),
  },
  {
    id: 'cmd:create_space',
    labelKey: 'create_space',
    descriptionKey: 'cmdk_cmd_create_space_description',
    icon: mdiAccountMultiplePlus,
    handler: () => modalManager.show(SpaceCreateModal, {}),
  },
  {
    id: 'cmd:signout',
    labelKey: 'sign_out',
    descriptionKey: 'cmdk_cmd_sign_out_description',
    icon: mdiLogoutVariant,
    handler: () => {
      toastManager.info(get(t)('signing_out'));
      return authManager.logout();
    },
  },
  {
    id: 'cmd:shortcuts',
    labelKey: 'keyboard_shortcuts',
    descriptionKey: 'cmdk_cmd_keyboard_shortcuts_description',
    icon: mdiKeyboardOutline,
    handler: () => modalManager.show(ShortcutsModal, {}),
  },
  {
    id: 'cmd:clear_recents',
    labelKey: 'cmdk_clear_recents',
    descriptionKey: 'cmdk_cmd_clear_recents_description',
    icon: mdiRestore,
    handler: () => clearEntries(),
  },
  {
    id: 'cmd:run_thumbnail_gen',
    labelKey: 'cmdk_cmd_run_thumbnail_gen_label',
    descriptionKey: 'cmdk_cmd_run_thumbnail_gen_description',
    icon: mdiImageOutline,
    adminOnly: true,
    handler: () => runQueue(QueueName.ThumbnailGeneration),
  },
  {
    id: 'cmd:run_metadata_extraction',
    labelKey: 'cmdk_cmd_run_metadata_extraction_label',
    descriptionKey: 'cmdk_cmd_run_metadata_extraction_description',
    icon: mdiInformationOutline,
    adminOnly: true,
    handler: () => runQueue(QueueName.MetadataExtraction),
  },
  {
    id: 'cmd:run_smart_search',
    labelKey: 'cmdk_cmd_run_smart_search_label',
    descriptionKey: 'cmdk_cmd_run_smart_search_description',
    icon: mdiBrain,
    adminOnly: true,
    handler: () => runQueue(QueueName.SmartSearch),
  },
  {
    id: 'cmd:run_face_detection',
    labelKey: 'cmdk_cmd_run_face_detection_label',
    descriptionKey: 'cmdk_cmd_run_face_detection_description',
    icon: mdiFaceRecognition,
    adminOnly: true,
    handler: () => runQueue(QueueName.FaceDetection),
  },
  {
    id: 'cmd:run_face_recognition',
    labelKey: 'cmdk_cmd_run_face_recognition_label',
    descriptionKey: 'cmdk_cmd_run_face_recognition_description',
    icon: mdiAccountSearchOutline,
    adminOnly: true,
    handler: () => runQueue(QueueName.FacialRecognition),
  },
  {
    id: 'cmd:pause_all_queues',
    labelKey: 'cmdk_cmd_pause_all_queues_label',
    descriptionKey: 'cmdk_cmd_pause_all_queues_description',
    icon: mdiPauseCircleOutline,
    adminOnly: true,
    handler: () => bulkQueueCommand(QueueCommand.Pause),
  },
  {
    id: 'cmd:resume_all_queues',
    labelKey: 'cmdk_cmd_resume_all_queues_label',
    descriptionKey: 'cmdk_cmd_resume_all_queues_description',
    icon: mdiPlayCircleOutline,
    adminOnly: true,
    handler: () => bulkQueueCommand(QueueCommand.Resume),
  },
  {
    id: 'cmd:clear_failed_jobs',
    labelKey: 'cmdk_cmd_clear_failed_jobs_label',
    descriptionKey: 'cmdk_cmd_clear_failed_jobs_description',
    icon: mdiBroom,
    adminOnly: true,
    handler: () => clearAllFailedJobs(),
  },

  // v1.4 — album-context commands. Visible only on /albums/[albumId]/… routes
  // with a registered AlbumContext. Availability further narrowed by ownership
  // / membership flags computed in registerAlbumContext.
  {
    id: 'cmd:album_rename',
    labelKey: 'cmdk_cmd_album_rename_label',
    descriptionKey: 'cmdk_cmd_album_rename_description',
    icon: mdiRenameOutline,
    isAvailable: (ctx) => ctx.album !== null && ctx.album.isOwner,
    handler: (ctx) => {
      if (!ctx?.album) {
        return;
      }
      return modalManager.show(AlbumEditModal, { album: ctx.album.raw });
    },
  },
  {
    id: 'cmd:album_share',
    labelKey: 'cmdk_cmd_album_share_label',
    descriptionKey: 'cmdk_cmd_album_share_description',
    icon: mdiShareVariantOutline,
    isAvailable: (ctx) => ctx.album !== null && ctx.album.isOwner,
    handler: (ctx) => {
      if (!ctx?.album) {
        return;
      }
      return modalManager.show(AlbumOptionsModal, { album: ctx.album.raw });
    },
  },
  {
    id: 'cmd:album_download',
    labelKey: 'cmdk_cmd_album_download_label',
    descriptionKey: 'cmdk_cmd_album_download_description',
    icon: mdiDownload,
    isAvailable: (ctx) => ctx.album !== null,
    handler: (ctx) => {
      if (!ctx?.album) {
        return;
      }
      return handleDownloadAlbum(ctx.album.raw);
    },
  },
  {
    id: 'cmd:album_leave',
    labelKey: 'cmdk_cmd_album_leave_label',
    descriptionKey: 'cmdk_cmd_album_leave_description',
    icon: mdiExitRun,
    destructive: true,
    isAvailable: (ctx) => ctx.album !== null && !ctx.album.isOwner && ctx.album.isMember,
    handler: async (ctx) => {
      if (!ctx?.album) {
        return;
      }
      if (!ctx.userId) {
        console.warn('[cmdk] cmd:album_leave missing userId — context misconfigured');
        return;
      }
      const $t = get(t);
      try {
        await removeUserFromAlbum({ id: ctx.album.id, userId: ctx.userId });
        await goto(Route.albums());
      } catch (error) {
        handleError(error, $t('errors.something_went_wrong'));
      }
    },
  },
  {
    id: 'cmd:album_delete',
    labelKey: 'cmdk_cmd_album_delete_label',
    descriptionKey: 'cmdk_cmd_album_delete_description',
    icon: mdiDeleteOutline,
    destructive: true,
    isAvailable: (ctx) => ctx.album !== null && ctx.album.isOwner,
    handler: async (ctx) => {
      if (!ctx?.album) {
        return;
      }
      const ok = await handleDeleteAlbum(ctx.album.raw, { prompt: false });
      if (ok) {
        await goto(Route.albums());
      }
    },
  },

  // v1.5A — selection-context commands. Visible only when pages register a
  // non-empty selection context with the required per-action capabilities.
  {
    id: 'cmd:selection_add_to_album',
    labelKey: 'cmdk_cmd_selection_add_to_album_label',
    descriptionKey: 'cmdk_cmd_selection_add_to_album_description',
    icon: mdiPlaylistPlus,
    isAvailable: canAddSelectedToAlbum,
    handler: handleAddSelectedToAlbum,
  },
  {
    id: 'cmd:selection_add_to_space',
    labelKey: 'cmdk_cmd_selection_add_to_space_label',
    descriptionKey: 'cmdk_cmd_selection_add_to_space_description',
    icon: mdiImageMultipleOutline,
    isAvailable: canAddSelectedToSpace,
    handler: handleAddSelectedToSpace,
  },
  {
    id: 'cmd:selection_add_to_current_space',
    labelKey: 'cmdk_cmd_selection_add_to_current_space_label',
    descriptionKey: 'cmdk_cmd_selection_add_to_current_space_description',
    icon: mdiImagePlusOutline,
    isAvailable: canAddSelectedToCurrentSpace,
    handler: handleAddSelectedToCurrentSpace,
  },
  {
    id: 'cmd:selection_favorite',
    labelKey: 'cmdk_cmd_selection_favorite_label',
    descriptionKey: 'cmdk_cmd_selection_favorite_description',
    icon: mdiHeartOutline,
    isAvailable: canFavoriteSelected,
    handler: handleFavoriteSelected,
  },
  {
    id: 'cmd:selection_archive',
    labelKey: 'cmdk_cmd_selection_archive_label',
    descriptionKey: 'cmdk_cmd_selection_archive_description',
    icon: mdiArchiveArrowDownOutline,
    isAvailable: canArchiveSelected,
    handler: handleArchiveSelected,
  },
  {
    id: 'cmd:selection_delete',
    labelKey: 'cmdk_cmd_selection_delete_label',
    descriptionKey: 'cmdk_cmd_selection_delete_description',
    icon: mdiDeleteOutline,
    destructive: true,
    isAvailable: canDeleteSelected,
    handler: handleDeleteSelected,
  },

  // v1.4 — space-context commands. Visible only on /spaces/[spaceId]/… routes
  // with a registered SpaceContext.
  {
    id: 'cmd:space_add_photos',
    labelKey: 'cmdk_cmd_space_add_photos_label',
    descriptionKey: 'cmdk_cmd_space_add_photos_description',
    icon: mdiImagePlusOutline,
    isAvailable: (ctx) => ctx.space?.canWrite === true && ctx.space.addPhotosToCurrentSpace !== undefined,
    handler: (ctx) => ctx?.space?.addPhotosToCurrentSpace?.(),
  },
  {
    id: 'cmd:space_manage_members',
    labelKey: 'cmdk_cmd_space_manage_members_label',
    descriptionKey: 'cmdk_cmd_space_manage_members_description',
    icon: mdiAccountGroupOutline,
    isAvailable: (ctx) => ctx.space !== null && ctx.space.isOwner,
    handler: (ctx) => {
      if (!ctx?.space) {
        return;
      }
      return modalManager.show(SpaceMembersModal, {
        spaceId: ctx.space.id,
        members: ctx.space.members,
        isOwner: true,
        spaceColor: ctx.space.raw.color ?? 'primary',
      });
    },
  },
  {
    id: 'cmd:space_add_member',
    labelKey: 'cmdk_cmd_space_add_member_label',
    descriptionKey: 'cmdk_cmd_space_add_member_description',
    icon: mdiAccountPlus,
    isAvailable: (ctx) => ctx.space !== null && ctx.space.isOwner,
    handler: (ctx) => {
      if (!ctx?.space) {
        return;
      }
      return modalManager.show(SpaceAddMemberModal, {
        spaceId: ctx.space.id,
        existingMemberIds: ctx.space.members.map((m) => m.userId),
      });
    },
  },
  {
    id: 'cmd:space_bulk_add',
    labelKey: 'cmdk_cmd_space_bulk_add_label',
    descriptionKey: 'cmdk_cmd_space_bulk_add_description',
    icon: mdiImageMultipleOutline,
    destructive: true,
    isAvailable: (ctx) => ctx.space !== null && ctx.space.canWrite,
    handler: async (ctx) => {
      if (!ctx?.space) {
        return;
      }
      const $t = get(t);
      try {
        await bulkAddAssets({ id: ctx.space.id });
        toastManager.primary($t('bulk_add_started'));
      } catch (error) {
        handleError(error, $t('errors.something_went_wrong'));
      }
    },
  },
  {
    id: 'cmd:space_leave',
    labelKey: 'cmdk_cmd_space_leave_label',
    descriptionKey: 'cmdk_cmd_space_leave_description',
    icon: mdiExitRun,
    destructive: true,
    isAvailable: (ctx) => ctx.space !== null && !ctx.space.isOwner && ctx.space.isMember,
    handler: async (ctx) => {
      if (!ctx?.space) {
        return;
      }
      if (!ctx.userId) {
        console.warn('[cmdk] cmd:space_leave missing userId — context misconfigured');
        return;
      }
      const $t = get(t);
      try {
        await removeMember({ id: ctx.space.id, userId: ctx.userId });
        await goto(Route.spaces());
      } catch (error) {
        handleError(error, $t('errors.something_went_wrong'));
      }
    },
  },
  {
    id: 'cmd:space_delete',
    labelKey: 'cmdk_cmd_space_delete_label',
    descriptionKey: 'cmdk_cmd_space_delete_description',
    icon: mdiDeleteOutline,
    destructive: true,
    isAvailable: (ctx) => ctx.space !== null && ctx.space.isOwner,
    handler: async (ctx) => {
      if (!ctx?.space) {
        return;
      }
      const $t = get(t);
      try {
        await removeSpace({ id: ctx.space.id });
        await goto(Route.spaces());
      } catch (error) {
        handleError(error, $t('errors.something_went_wrong'));
      }
    },
  },
];

export function isAlmostExactCommandMatch(query: string, label: string): boolean {
  return isAlmostExactWordMatch(query, label, MIN_MATCH_LENGTH);
}
