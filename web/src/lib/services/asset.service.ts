import { ProjectionType } from '#lib/constants.ts';
import { assetMultiSelectManager } from '#lib/managers/asset-multi-select-manager.svelte.ts';
import { assetViewerManager } from '#lib/managers/asset-viewer-manager.svelte.ts';
import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import { eventManager } from '#lib/managers/event-manager.svelte.ts';
import { featureFlagsManager } from '#lib/managers/feature-flags-manager.svelte.ts';
import type { TimelineAsset } from '#lib/managers/timeline-manager/types.ts';
import AssetAddToAlbumModal from '#lib/modals/AssetAddToAlbumModal.svelte';
import AssetDeleteConfirmModal from '#lib/modals/AssetDeleteConfirmModal.svelte';
import AssetSelectionChangeDateModal from '#lib/modals/AssetSelectionChangeDateModal.svelte';
import AssetTagModal from '#lib/modals/AssetTagModal.svelte';
import AssetUpdateDescriptionConfirmModal from '#lib/modals/AssetUpdateDescriptionConfirmModal.svelte';
import GeolocationPointPickerModal from '#lib/modals/GeolocationPointPickerModal.svelte';
import ProfileImageCropperModal from '#lib/modals/ProfileImageCropperModal.svelte';
import SharedLinkCreateModal from '#lib/modals/SharedLinkCreateModal.svelte';
import { removeAssetFromAlbumMutation } from '#lib/queries/album.query.ts';
import {
  deleteAssetsMutation,
  getAssetInfoQuery,
  runAssetJobsMutation,
  updateAssetMutation,
  updateAssetsMutation,
} from '#lib/queries/asset.query.ts';
import { executeMutation, queryClient, readPreloadedQuery, type ConfirmOptions } from '#lib/queries/client.ts';
import { getUserConfigQuery } from '#lib/queries/config-user.query.ts';
import { restoreAssetsMutation } from '#lib/queries/trash.query.ts';
import { Route } from '#lib/route.ts';
import { showDeleteModal } from '#lib/stores/preferences.store.ts';
import { SlideshowState, slideshowStore } from '#lib/stores/slideshow.store.ts';
import type { LatLng } from '#lib/types.ts';
import { downloadUrl, getAssetMediaUrl, getSharedLink } from '#lib/utils.ts';
import type { OnFavorite } from '#lib/utils/actions.ts';
import { delay, getOwnedAssetsWithWarning } from '#lib/utils/asset-utils.ts';
import { handleError } from '#lib/utils/handle-error.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import { fromTimelinePlainDateTime, toTimelineAsset } from '#lib/utils/timeline-util.ts';
import {
  AssetJobName,
  AssetTypeEnum,
  AssetVisibility,
  type AlbumResponseDto,
  type AssetJobsDto,
  type AssetResponseDto,
} from '@immich/sdk';
import { modalManager, toastManager, type ActionItem } from '@immich/ui';
import {
  mdiAccountCircleOutline,
  mdiAlertOutline,
  mdiArchiveArrowDownOutline,
  mdiArchiveArrowUpOutline,
  mdiCalendarEditOutline,
  mdiCogRefreshOutline,
  mdiCompare,
  mdiContentCopy,
  mdiDatabaseRefreshOutline,
  mdiDeleteForeverOutline,
  mdiDeleteOutline,
  mdiDownload,
  mdiDownloadBox,
  mdiFaceRecognition,
  mdiHeadSyncOutline,
  mdiHeart,
  mdiHeartOutline,
  mdiHistory,
  mdiImageRefreshOutline,
  mdiImageRemoveOutline,
  mdiImageSearch,
  mdiInformationOutline,
  mdiLockOpenVariantOutline,
  mdiLockOutline,
  mdiMagnifyMinusOutline,
  mdiMagnifyPlusOutline,
  mdiMapMarkerMultipleOutline,
  mdiMotionPauseOutline,
  mdiMotionPlayOutline,
  mdiPlus,
  mdiPresentationPlay,
  mdiShareVariantOutline,
  mdiTagMultipleOutline,
  mdiTagPlusOutline,
  mdiText,
  mdiTune,
} from '@mdi/js';
import { DateTime } from 'luxon';
import { t, type MessageFormatter } from 'svelte-i18n';
import { get } from 'svelte/store';
import { goto } from '$app/navigation';

export const getAssetBulkActions = ($t: MessageFormatter, album?: AlbumResponseDto) => {
  const assetIds = assetMultiSelectManager.assets.map((asset) => asset.id);
  const ownedAssets = assetMultiSelectManager.ownedAssets;
  const isAlbumOwner = album?.albumUsers[0].user.id === authManager.user.id;

  const onAction = async (name: AssetJobName) => {
    await handleRunAssetJob({ name, assetIds: ownedAssets.map(({ id }) => id) });
    assetMultiSelectManager.clear();
  };

  const AddToAlbum: ActionItem = {
    title: $t('add_to_album'),
    icon: mdiPlus,
    shortcuts: [{ key: 'l' }],
    onAction: () => modalManager.show(AssetAddToAlbumModal, { assetIds }),
  };

  const Archive: ActionItem = {
    title: $t('to_archive'),
    icon: mdiArchiveArrowDownOutline,
    shortcuts: [{ key: 'a', shift: true }],
    $if: () => assetMultiSelectManager.isAllUserOwned && !assetMultiSelectManager.isAllArchived,
    onAction: () =>
      handleSetVisibility(
        ownedAssets.filter((asset) => asset.visibility !== AssetVisibility.Archive),
        AssetVisibility.Archive,
      ),
  };

  const ChangeDate: ActionItem = {
    title: $t('change_date'),
    icon: mdiCalendarEditOutline,
    onAction: async () => {
      const initialDate =
        ownedAssets.length === 1 ? fromTimelinePlainDateTime(ownedAssets[0].localDateTime) : DateTime.now();
      if (await modalManager.show(AssetSelectionChangeDateModal, { initialDate, assets: ownedAssets })) {
        assetMultiSelectManager.clear();
      }
    },
  };

  const ChangeDescription: ActionItem = {
    title: $t('change_description'),
    icon: mdiText,
    onAction: async () => {
      const description = (await modalManager.show(AssetUpdateDescriptionConfirmModal, {})) as string | undefined;
      if (!description) {
        return;
      }

      const ids = getOwnedAssetsWithWarning(assetMultiSelectManager.assets, authManager.user);
      await executeMutation(
        () => updateAssetsMutation({ error: { toast: 'errors.unable_to_change_description' } }),
        [{ assetBulkUpdateDto: { ids, description } }],
        { onSuccess: () => assetMultiSelectManager.clear() },
      );
    },
  };

  const ChangeLocation: ActionItem = {
    title: $t('change_location'),
    icon: mdiMapMarkerMultipleOutline,
    onAction: async () => {
      const point = (await modalManager.show(GeolocationPointPickerModal, {})) as LatLng | undefined;
      if (!point) {
        return;
      }

      const ids = getOwnedAssetsWithWarning(assetMultiSelectManager.assets, authManager.user);
      await executeMutation(
        () => updateAssetsMutation({ success: { toast: true }, error: { toast: 'errors.unable_to_update_location' } }),
        [{ assetBulkUpdateDto: { ids, latitude: point.lat, longitude: point.lng } }],
        { onSuccess: () => assetMultiSelectManager.clear() },
      );
    },
  };

  const CreateSharedLink: ActionItem = {
    title: $t('share'),
    icon: mdiShareVariantOutline,
    onAction: () => modalManager.show(SharedLinkCreateModal, { assetIds }),
  };

  const RemoveFromAlbum: ActionItem = {
    title: $t('remove_from_album'),
    icon: mdiImageRemoveOutline,
    shortcuts: [{ key: 'l', shift: true }],
    $if: () => !!album && (isAlbumOwner || assetMultiSelectManager.isAllUserOwned),
    onAction: () => handleBulkRemoveAssetsFromAlbum(assetIds, album!),
  };

  const Tag: ActionItem = {
    title: $t('tag'),
    icon: mdiTagMultipleOutline,
    $if: () => authManager.preferences.tags.enabled && assetMultiSelectManager.isAllUserOwned,
    onAction: async () => {
      if (await modalManager.show(AssetTagModal, { assetIds })) {
        assetMultiSelectManager.clear();
      }
    },
    shortcuts: { key: 't' },
  };

  const Unarchive: ActionItem = {
    title: $t('unarchive'),
    icon: mdiArchiveArrowUpOutline,
    shortcuts: [{ key: 'a', shift: true }],
    $if: () => assetMultiSelectManager.isAllUserOwned && assetMultiSelectManager.isAllArchived,
    onAction: () => handleSetVisibility(ownedAssets, AssetVisibility.Timeline),
  };

  const RefreshFacesJob: ActionItem = {
    title: $t('refresh_faces'),
    icon: mdiHeadSyncOutline,
    onAction: () => onAction(AssetJobName.RefreshFaces),
  };

  const RefreshMetadataJob: ActionItem = {
    title: $t('refresh_metadata'),
    icon: mdiDatabaseRefreshOutline,
    onAction: () => onAction(AssetJobName.RefreshMetadata),
  };

  const RegenerateThumbnailJob: ActionItem = {
    title: $t('refresh_thumbnails'),
    icon: mdiImageRefreshOutline,
    onAction: () => onAction(AssetJobName.RegenerateThumbnail),
  };

  const TranscodeVideoJob: ActionItem = {
    title: $t('refresh_encoded_videos'),
    icon: mdiCogRefreshOutline,
    onAction: () => onAction(AssetJobName.TranscodeVideo),
    $if: () => ownedAssets.every((asset) => asset.isVideo),
  };

  return {
    AddToAlbum,
    Archive,
    ChangeDate,
    ChangeDescription,
    ChangeLocation,
    CreateSharedLink,
    RemoveFromAlbum,
    Tag,
    Unarchive,
    RefreshFacesJob,
    RefreshMetadataJob,
    RegenerateThumbnailJob,
    TranscodeVideoJob,
  };
};

export const getAssetActions = (
  $t: MessageFormatter,
  asset: AssetResponseDto & { stackPrimaryAssetId?: string },
  album?: AlbumResponseDto,
) => {
  const sharedLink = getSharedLink();
  const authUser = authManager.authenticated ? authManager.user : undefined;
  const isOwner = !!(authUser && authUser.id === asset.ownerId);
  const isAlbumOwner = !!(authUser && authUser.id === album?.albumUsers.at(0)?.user.id);
  const smartSearchEnabled = !!authUser && readPreloadedQuery(getUserConfigQuery()).machineLearning.clip.enabled;
  const isLocked = asset.visibility === AssetVisibility.Locked;
  const isDeletePermanent = asset.isTrashed || !featureFlagsManager.value.trash;

  const Share: ActionItem = {
    title: $t('share'),
    icon: mdiShareVariantOutline,
    $if: () => !!(authUser && !asset.isTrashed && asset.visibility !== AssetVisibility.Locked),
    onAction: () => modalManager.show(SharedLinkCreateModal, { assetIds: [asset.id] }),
  };

  const Download: ActionItem = {
    title: $t('download'),
    icon: mdiDownload,
    shortcuts: { key: 'd', shift: true },
    $if: () => !!authUser,
    onAction: () => handleDownloadAsset(asset, { edited: true }),
  };

  const DownloadOriginal: ActionItem = {
    title: $t('download_original'),
    icon: mdiDownloadBox,
    $if: () => !!authUser && asset.isEdited,
    onAction: () => handleDownloadAsset(asset, { edited: false }),
  };

  const SharedLinkDownload: ActionItem = {
    ...Download,
    $if: () => isOwner || !!sharedLink?.allowDownload,
  };

  const PlayMotionPhoto: ActionItem = {
    title: $t('play_motion_photo'),
    icon: mdiMotionPlayOutline,
    $if: () => !!asset.livePhotoVideoId && !assetViewerManager.isPlayingMotionPhoto,
    onAction: () => {
      assetViewerManager.isPlayingMotionPhoto = true;
    },
  };

  const StopMotionPhoto: ActionItem = {
    title: $t('stop_motion_photo'),
    icon: mdiMotionPauseOutline,
    $if: () => !!asset.livePhotoVideoId && assetViewerManager.isPlayingMotionPhoto,
    onAction: () => {
      assetViewerManager.isPlayingMotionPhoto = false;
    },
  };

  const PlaySlideshow: ActionItem = {
    title: $t('slideshow'),
    icon: mdiPresentationPlay,
    $if: () => asset.visibility !== AssetVisibility.Locked,
    onAction: () => slideshowStore.slideshowState.set(SlideshowState.PlaySlideshow),
  };

  const Favorite: ActionItem = {
    title: $t('to_favorite'),
    icon: mdiHeartOutline,
    $if: () => isOwner && !asset.isFavorite,
    onAction: () => handleFavorite(asset),
    shortcuts: [{ key: 'f' }],
  };

  const Unfavorite: ActionItem = {
    title: $t('unfavorite'),
    icon: mdiHeart,
    $if: () => isOwner && asset.isFavorite,
    onAction: () => handleUnfavorite(asset),
    shortcuts: [{ key: 'f' }],
  };

  const Rate: ActionItem = {
    title: $t('rate_asset'),
    description: $t('rate_asset_description'),
    $if: () => isOwner && authManager.preferences.ratings.enabled,
    onAction: ({ event }) => handleRate(asset, event instanceof KeyboardEvent ? Number(event.key) : NaN),
    shortcuts: [0, 1, 2, 3, 4, 5].map((key) => ({ key: String(key) })),
  };

  const AddToAlbum: ActionItem = {
    title: $t('add_to_album'),
    icon: mdiPlus,
    shortcuts: [{ key: 'l' }],
    $if: () => asset.visibility !== AssetVisibility.Locked && !asset.isTrashed,
    onAction: () => modalManager.show(AssetAddToAlbumModal, { assetIds: [asset.id] }),
  };

  const RemoveFromAlbum: ActionItem = {
    title: $t('remove_from_album'),
    icon: mdiImageRemoveOutline,
    shortcuts: [{ key: 'l', shift: true }],
    $if: () => !!album && (isOwner || isAlbumOwner),
    onAction: () => handleRemoveAssetsFromAlbum([asset.id], album!),
  };

  const Offline: ActionItem = {
    title: $t('asset_offline'),
    icon: mdiAlertOutline,
    color: 'danger',
    $if: () => asset.isOffline,
    onAction: () => assetViewerManager.toggleDetailPanel(),
  };

  const ZoomIn: ActionItem = {
    title: $t('zoom_image'),
    icon: mdiMagnifyPlusOutline,
    $if: () => assetViewerManager.canZoomIn(),
    onAction: () => assetViewerManager.emit('Zoom'),
  };

  const ZoomOut: ActionItem = {
    title: $t('zoom_image'),
    icon: mdiMagnifyMinusOutline,
    $if: () => assetViewerManager.canZoomOut(),
    onAction: () => assetViewerManager.emit('Zoom'),
  };

  const Copy: ActionItem = {
    title: $t('copy_image'),
    icon: mdiContentCopy,
    $if: () => assetViewerManager.canCopyImage(),
    onAction: () => assetViewerManager.emit('Copy'),
  };

  const Info: ActionItem = {
    title: $t('info'),
    icon: mdiInformationOutline,
    $if: () => asset.hasMetadata,
    onAction: () => assetViewerManager.toggleDetailPanel(),
    shortcuts: { key: 'i' },
  };

  const Tag: ActionItem = {
    title: $t('add_tag'),
    icon: mdiTagPlusOutline,
    $if: () => authManager.authenticated && authManager.preferences.tags.enabled,
    onAction: () => modalManager.show(AssetTagModal, { assetIds: [asset.id] }),
    shortcuts: { key: 't' },
  };

  const TagPeople: ActionItem = {
    title: $t('tag_people'),
    icon: mdiFaceRecognition,
    $if: () => isOwner && asset.type === AssetTypeEnum.Image && !asset.isTrashed,
    onAction: () => assetViewerManager.toggleFaceEditMode(),
    shortcuts: { key: 'p' },
  };

  const Edit: ActionItem = {
    title: $t('editor'),
    icon: mdiTune,
    $if: () =>
      !sharedLink &&
      isOwner &&
      asset.type === AssetTypeEnum.Image &&
      !asset.livePhotoVideoId &&
      asset.exifInfo?.projectionType !== ProjectionType.EQUIRECTANGULAR &&
      !asset.originalPath.toLowerCase().endsWith('.insp') &&
      !asset.originalPath.toLowerCase().endsWith('.gif') &&
      !asset.originalPath.toLowerCase().endsWith('.svg'),
    onAction: () => assetViewerManager.openEditor(),
    shortcuts: [{ key: 'e' }],
  };

  const Trash: ActionItem = {
    title: $t('delete'),
    icon: mdiDeleteOutline,
    $if: () => isOwner && !isDeletePermanent,
    onAction: ({ event }) => (isShiftDelete(event) ? handlePermanentlyDelete(asset) : handleTrash(asset)),
    shortcuts: [{ key: 'Delete' }, { key: 'Delete', shift: true }],
  };

  const PermanentlyDelete: ActionItem = {
    title: $t('permanently_delete'),
    icon: mdiDeleteForeverOutline,
    $if: () => isOwner && isDeletePermanent,
    onAction: () => handlePermanentlyDelete(asset),
    shortcuts: [{ key: 'Delete' }, { key: 'Delete', shift: true }],
  };

  const Restore: ActionItem = {
    title: $t('restore'),
    icon: mdiHistory,
    $if: () => !sharedLink && !isLocked && asset.isTrashed,
    onAction: () => handleRestore(asset),
  };

  const Archive: ActionItem = {
    title: $t('to_archive'),
    icon: mdiArchiveArrowDownOutline,
    $if: () => !sharedLink && isOwner && !isLocked && !asset.isArchived,
    onAction: () => handleArchive(asset),
    shortcuts: [{ key: 'a', shift: true }],
  };

  const Unarchive: ActionItem = {
    title: $t('unarchive'),
    icon: mdiArchiveArrowUpOutline,
    $if: () => !sharedLink && isOwner && !isLocked && asset.isArchived,
    onAction: () => handleUnarchive(asset),
    shortcuts: [{ key: 'a', shift: true }],
  };

  const Lock: ActionItem = {
    title: $t('move_to_locked_folder'),
    icon: mdiLockOutline,
    $if: () => !sharedLink && isOwner && !asset.isTrashed && !isLocked,
    onAction: () => handleToggleLocked(asset),
  };

  const Unlock: ActionItem = {
    title: $t('move_off_locked_folder'),
    icon: mdiLockOpenVariantOutline,
    $if: () => !sharedLink && isOwner && !asset.isTrashed && isLocked,
    onAction: () => handleToggleLocked(asset),
  };

  const SetProfilePicture: ActionItem = {
    title: $t('set_as_profile_picture'),
    icon: mdiAccountCircleOutline,
    $if: () => asset.type === AssetTypeEnum.Image && asset.visibility !== AssetVisibility.Locked,
    onAction: () => modalManager.show(ProfileImageCropperModal, { asset }),
  };

  const ViewInTimeline: ActionItem = {
    title: $t('view_in_timeline'),
    icon: mdiImageSearch,
    $if: () => isOwner && asset.visibility !== AssetVisibility.Locked && !asset.isArchived && !asset.isTrashed,
    onAction: () => goto(Route.photos({ at: asset.stackPrimaryAssetId ?? asset.id })),
  };

  const ViewSimilar: ActionItem = {
    title: $t('view_similar_photos'),
    icon: mdiCompare,
    $if: () =>
      asset.visibility !== AssetVisibility.Locked && !asset.isArchived && !asset.isTrashed && smartSearchEnabled,
    onAction: () => goto(Route.search({ queryAssetId: asset.stackPrimaryAssetId ?? asset.id })),
  };

  const RefreshFacesJob: ActionItem = {
    title: $t('refresh_faces'),
    icon: mdiHeadSyncOutline,
    onAction: () => handleRunAssetJob({ name: AssetJobName.RefreshFaces, assetIds: [asset.id] }),
  };

  const RefreshMetadataJob: ActionItem = {
    title: $t('refresh_metadata'),
    icon: mdiDatabaseRefreshOutline,
    onAction: () => handleRunAssetJob({ name: AssetJobName.RefreshMetadata, assetIds: [asset.id] }),
  };

  const RegenerateThumbnailJob: ActionItem = {
    title: $t('refresh_thumbnails'),
    icon: mdiImageRefreshOutline,
    onAction: () => handleRunAssetJob({ name: AssetJobName.RegenerateThumbnail, assetIds: [asset.id] }),
  };

  const TranscodeVideoJob: ActionItem = {
    title: $t('refresh_encoded_videos'),
    icon: mdiCogRefreshOutline,
    onAction: () => handleRunAssetJob({ name: AssetJobName.TranscodeVideo, assetIds: [asset.id] }),
    $if: () => asset.type === AssetTypeEnum.Video,
  };

  return {
    Share,
    Download,
    DownloadOriginal,
    SharedLinkDownload,
    Offline,
    Info,
    Favorite,
    Unfavorite,
    Rate,
    PlayMotionPhoto,
    StopMotionPhoto,
    PlaySlideshow,
    AddToAlbum,
    RemoveFromAlbum,
    ZoomIn,
    ZoomOut,
    Copy,
    Tag,
    TagPeople,
    Edit,
    Trash,
    PermanentlyDelete,
    Restore,
    Archive,
    Unarchive,
    Lock,
    Unlock,
    SetProfilePicture,
    ViewInTimeline,
    ViewSimilar,
    RefreshFacesJob,
    RefreshMetadataJob,
    RegenerateThumbnailJob,
    TranscodeVideoJob,
  };
};

export const handleDownloadAsset = async (asset: AssetResponseDto, { edited }: { edited: boolean }) => {
  const $t = await getFormatter();

  const assets = [
    {
      filename: asset.originalFileName,
      id: asset.id,
      cacheKey: asset.thumbhash,
    },
  ];

  const isAndroidMotionVideo = (asset: AssetResponseDto) => {
    return asset.originalPath.includes('encoded-video');
  };

  if (asset.livePhotoVideoId) {
    const motionAsset = await queryClient.query(
      getAssetInfoQuery({ ...authManager.params, id: asset.livePhotoVideoId }),
    );
    if (
      !isAndroidMotionVideo(motionAsset) ||
      (authManager.authenticated && authManager.preferences.download.includeEmbeddedVideos)
    ) {
      const motionFilename = motionAsset.originalFileName;
      const lastDotIndex = motionFilename.lastIndexOf('.');
      const motionDownloadFilename =
        lastDotIndex > 0
          ? `${motionFilename.slice(0, lastDotIndex)}-motion${motionFilename.slice(lastDotIndex)}`
          : `${motionFilename}-motion`;
      assets.push({
        filename: motionDownloadFilename,
        id: asset.livePhotoVideoId,
        cacheKey: motionAsset.thumbhash,
      });
    }
  }

  for (const [i, { filename, id, cacheKey }] of assets.entries()) {
    if (i !== 0) {
      // play nice with Safari
      await delay(500);
    }

    try {
      toastManager.primary($t('downloading_asset_filename', { values: { filename } }));
      downloadUrl(getAssetMediaUrl({ id, size: 'original', edited, cacheKey }), filename);
    } catch (error) {
      handleError(error, $t('errors.error_downloading', { values: { filename } }));
    }
  }
};

const handleFavorite = (asset: AssetResponseDto) =>
  executeMutation(
    () =>
      updateAssetMutation({
        success: { toast: 'added_to_favorites' },
        error: { toast: 'errors.unable_to_add_remove_favorites', values: { favorite: asset.isFavorite } },
      }),
    [{ id: asset.id, updateAssetDto: { isFavorite: true } }],
  );

const handleUnfavorite = (asset: AssetResponseDto) =>
  executeMutation(
    () =>
      updateAssetMutation({
        success: { toast: 'removed_from_favorites' },
        error: { toast: 'errors.unable_to_add_remove_favorites', values: { favorite: asset.isFavorite } },
      }),
    [{ id: asset.id, updateAssetDto: { isFavorite: false } }],
  );

const isShiftDelete = (event: Event) => event instanceof KeyboardEvent && event.key === 'Delete' && event.shiftKey;

const handleTrash = async (asset: AssetResponseDto) => {
  assetViewerManager.emit('AssetLeave', { asset, reason: 'trash' });
  const $t = await getFormatter();

  await executeMutation(deleteAssetsMutation, [{ assetBulkDeleteDto: { ids: [asset.id], force: false } }], {
    onSuccess: () =>
      toastManager.primary(
        {
          description: $t('assets_trashed_count', { values: { count: 1 } }),
          button: assetViewerManager.hasListeners('AssetReturn')
            ? { label: $t('undo'), color: 'secondary', onclick: () => handleUndoTrash(asset) }
            : undefined,
        },
        { timeout: 5000 },
      ),
  });
};

const handleUndoTrash = (asset: AssetResponseDto) =>
  executeMutation(restoreAssetsMutation, [{ bulkIdsDto: { ids: [asset.id] } }], {
    onSuccess: () => assetViewerManager.emit('AssetReturn', asset),
  });

const handlePermanentlyDelete = async (asset: AssetResponseDto) => {
  if (get(showDeleteModal) && !(await modalManager.show(AssetDeleteConfirmModal, { size: 1 }))) {
    return;
  }

  assetViewerManager.emit('AssetLeave', { asset, reason: 'delete' });
  await executeMutation(
    () =>
      deleteAssetsMutation({
        success: { toast: 'permanently_deleted_asset' },
        error: { toast: 'errors.unable_to_delete_asset' },
      }),
    [{ assetBulkDeleteDto: { ids: [asset.id], force: true } }],
  );
};

const handleRestore = async (asset: AssetResponseDto) => {
  const $t = await getFormatter();

  await executeMutation(restoreAssetsMutation, [{ bulkIdsDto: { ids: [asset.id] } }], {
    onSuccess: () => {
      eventManager.emit('AssetsRestore', [asset.id]);
      toastManager.primary($t('restored_asset'));
    },
  });
};

const handleArchive = async (asset: AssetResponseDto) => {
  assetViewerManager.emit('AssetLeave', { asset, reason: 'archive' });
  const $t = await getFormatter();

  await executeMutation(
    () => updateAssetMutation({ error: { toast: 'errors.unable_to_add_remove_archive', values: { archived: false } } }),
    [{ id: asset.id, updateAssetDto: { visibility: AssetVisibility.Archive } }],
    {
      onSuccess: (response) => {
        toastManager.primary({
          description: $t('added_to_archive'),
          button: (close) => ({
            label: $t('undo'),
            onclick: () => {
              close();
              void undoArchiveAssets([toTimelineAsset(response)]);
            },
          }),
        });
        eventManager.emit('AssetsArchive', [asset.id]);
      },
    },
  );
};

const handleUnarchive = (asset: AssetResponseDto) =>
  executeMutation(
    () =>
      updateAssetMutation({
        success: { toast: 'removed_from_archive' },
        error: { toast: 'errors.unable_to_add_remove_archive', values: { archived: true } },
      }),
    [{ id: asset.id, updateAssetDto: { visibility: AssetVisibility.Timeline } }],
  );

const handleToggleLocked = async (asset: AssetResponseDto) => {
  const $t = await getFormatter();
  const isLocked = asset.visibility === AssetVisibility.Locked;

  const isConfirmed = await modalManager.showDialog({
    title: isLocked ? $t('remove_from_locked_folder') : $t('move_to_locked_folder'),
    prompt: isLocked ? $t('remove_from_locked_folder_confirmation') : $t('move_to_locked_folder_confirmation'),
    confirmText: $t('move'),
    confirmColor: isLocked ? 'danger' : 'primary',
    icon: isLocked ? mdiLockOpenVariantOutline : mdiLockOutline,
  });
  if (!isConfirmed) {
    return;
  }

  const visibility = isLocked ? AssetVisibility.Timeline : AssetVisibility.Locked;
  assetViewerManager.emit('AssetLeave', { asset, reason: isLocked ? 'unlock' : 'lock' });
  await executeMutation(
    () => updateAssetsMutation({ error: { toast: 'errors.unable_to_save_settings' } }),
    [{ assetBulkUpdateDto: { ids: [asset.id], visibility } }],
  );
};

export const toggleFavoriteAssets = async (
  assets: Pick<AssetResponseDto, 'id' | 'isFavorite'>[],
  isFavorite: boolean,
  onFavorite?: OnFavorite,
) => {
  const ids = assets.map((a) => a.id);
  const $t = get(t);
  const onSuccess = () => {
    for (const asset of assets) {
      asset.isFavorite = isFavorite;
    }

    onFavorite?.(ids, isFavorite);

    toastManager.primary(
      isFavorite
        ? $t('added_to_favorites_count', { values: { count: ids.length } })
        : $t('removed_from_favorites_count', { values: { count: ids.length } }),
    );
  };

  if (ids.length === 0) {
    onSuccess();
    return;
  }

  await executeMutation(
    () =>
      updateAssetsMutation({
        error: { toast: 'errors.unable_to_add_remove_favorites', values: { favorite: isFavorite } },
      }),
    [{ assetBulkUpdateDto: { ids, isFavorite } }],
    { onSuccess },
  );
};

const handleRate = async (asset: AssetResponseDto, rating: number) => {
  const $t = await getFormatter();

  if (Number.isNaN(rating)) {
    toastManager.info($t('rate_asset_description'));
    return;
  }

  const newRating = rating === 0 ? null : rating;
  if (asset.exifInfo && asset.exifInfo.rating === newRating) {
    return;
  }

  await executeMutation(
    () => updateAssetMutation({ error: { toast: 'errors.unable_to_set_rating' } }),
    [{ id: asset.id, updateAssetDto: { rating: newRating } }],
  );
};

const handleSetVisibility = async (assets: TimelineAsset[], visibility: AssetVisibility) => {
  const $t = await getFormatter();
  const ids = assets.map((asset) => asset.id);
  const archived = visibility === AssetVisibility.Archive;

  await executeMutation(
    () => updateAssetsMutation({ error: { toast: 'errors.unable_to_archive_unarchive', values: { archived } } }),
    [{ assetBulkUpdateDto: { ids, visibility } }],
    {
      onSuccess: () => {
        assetMultiSelectManager.clear();
        if (!archived) {
          toastManager.primary($t('unarchived_count', { values: { count: assets.length } }));
          eventManager.emit('AssetsUnarchive', assets);
          return;
        }

        toastManager.primary({
          description: $t('archived_count', { values: { count: assets.length } }),
          button: (close) => ({
            label: $t('undo'),
            onclick: () => {
              close();
              void undoArchiveAssets(assets);
            },
          }),
        });
        eventManager.emit('AssetsArchive', ids);
      },
    },
  );
};

const undoArchiveAssets = async (assets: TimelineAsset[]) => {
  const $t = await getFormatter();

  await executeMutation(
    () => updateAssetsMutation({ error: { toast: 'errors.unable_to_archive_unarchive', values: { archived: false } } }),
    [{ assetBulkUpdateDto: { ids: assets.map((a) => a.id), visibility: AssetVisibility.Timeline } }],
    {
      onSuccess: () => {
        for (const asset of assets) {
          asset.visibility = AssetVisibility.Timeline;
        }
        toastManager.success($t('unarchived_count', { values: { count: assets.length } }));
        eventManager.emit('AssetsUnarchive', assets);
        eventManager.emit('AssetsUndoArchive', assets);
      },
    },
  );
};

const handleBulkRemoveAssetsFromAlbum = async (assetIds: string[], album: AlbumResponseDto) => {
  const $t = await getFormatter();

  await handleRemoveAssetsFromAlbum(assetIds, album, {
    confirm: { prompt: $t('remove_assets_album_confirmation', { values: { count: assetIds.length } }) },
    onSettled: () => assetMultiSelectManager.clear(),
  });
};

const handleRemoveAssetsFromAlbum = async (
  assetIds: string[],
  album: AlbumResponseDto,
  options: { confirm?: ConfirmOptions | false; onSettled?: () => void } = {},
) => {
  const $t = await getFormatter();

  await executeMutation(removeAssetFromAlbumMutation, [{ id: album.id, bulkIdsDto: { ids: assetIds } }], {
    ...options,
    onSuccess: (results) => {
      const count = results.filter(({ success }) => success).length;
      toastManager.primary($t('assets_removed_count', { values: { count } }));
      eventManager.emit('AlbumRemoveAssets', { assetIds, albumIds: [album.id] });
    },
  });
};

const getAssetJobMessage = ($t: MessageFormatter, job: AssetJobName) => {
  const messages: Record<AssetJobName, string> = {
    [AssetJobName.RefreshFaces]: $t('refreshing_faces'),
    [AssetJobName.RefreshMetadata]: $t('refreshing_metadata'),
    [AssetJobName.RegenerateThumbnail]: $t('regenerating_thumbnails'),
    [AssetJobName.TranscodeVideo]: $t('refreshing_encoded_video'),
  };

  return messages[job];
};

const handleRunAssetJob = async (dto: AssetJobsDto) => {
  const $t = await getFormatter();

  await executeMutation(runAssetJobsMutation, [{ assetJobsDto: dto }], {
    onSuccess: () => toastManager.primary(getAssetJobMessage($t, dto.name)),
  });
};
