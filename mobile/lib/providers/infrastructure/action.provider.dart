import 'package:auto_route/auto_route.dart';
import 'package:background_downloader/background_downloader.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/models/download/livephotos_medatada.model.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/action.service.dart';
import 'package:immich_mobile/services/download.service.dart';
import 'package:immich_mobile/services/timeline.service.dart';
import 'package:immich_mobile/services/upload.service.dart';
import 'package:logging/logging.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

final actionProvider = NotifierProvider<ActionNotifier, void>(
  ActionNotifier.new,
  dependencies: [multiSelectProvider, timelineServiceProvider],
);

class ActionResult {
  final int count;
  final bool success;
  final String? error;

  const ActionResult({required this.count, required this.success, this.error});

  @override
  String toString() => 'ActionResult(count: $count, success: $success, error: $error)';
}

class ActionNotifier extends Notifier<void> {
  final Logger _logger = Logger('ActionNotifier');
  late ActionService _service;
  late UploadService _uploadService;
  late DownloadService _downloadService;

  ActionNotifier() : super();

  @override
  void build() {
    _uploadService = ref.watch(uploadServiceProvider);
    _service = ref.watch(actionServiceProvider);
    _downloadService = ref.watch(downloadServiceProvider);
    _downloadService.onImageDownloadStatus = _downloadImageCallback;
    _downloadService.onVideoDownloadStatus = _downloadVideoCallback;
    _downloadService.onLivePhotoDownloadStatus = _downloadLivePhotoCallback;
  }

  void _downloadImageCallback(TaskStatusUpdate update) {
    if (update.status == TaskStatus.complete) {
      _downloadService.saveImageWithPath(update.task);
    }
  }

  void _downloadVideoCallback(TaskStatusUpdate update) {
    if (update.status == TaskStatus.complete) {
      _downloadService.saveVideo(update.task);
    }
  }

  void _downloadLivePhotoCallback(TaskStatusUpdate update) async {
    if (update.status == TaskStatus.complete) {
      final livePhotosId = LivePhotosMetadata.fromJson(update.task.metaData).id;
      _downloadService.saveLivePhotos(update.task, livePhotosId);
    }
  }

  List<String> _getRemoteIdsForSource(ActionSource source) {
    return _getAssets(source).whereType<RemoteAsset>().toIds().toList(growable: false);
  }

  List<String> _getLocalIdsForSource(ActionSource source) {
    final Set<BaseAsset> assets = _getAssets(source);
    final List<String> localIds = [];

    for (final asset in assets) {
      if (asset is LocalAsset) {
        localIds.add(asset.id);
      } else if (asset is RemoteAsset && asset.localId != null) {
        localIds.add(asset.localId!);
      }
    }

    return localIds;
  }

  List<String> _getOwnedRemoteIdsForSource(ActionSource source) {
    final ownerId = ref.read(currentUserProvider)?.id;
    return _getAssets(source).whereType<RemoteAsset>().ownedAssets(ownerId).toIds().toList(growable: false);
  }

  List<RemoteAsset> _getOwnedRemoteAssetsForSource(ActionSource source) {
    final ownerId = ref.read(currentUserProvider)?.id;
    return _getIdsForSource<RemoteAsset>(source).ownedAssets(ownerId).toList();
  }

  Iterable<T> _getIdsForSource<T extends BaseAsset>(ActionSource source) {
    final Set<BaseAsset> assets = _getAssets(source);
    return switch (T) {
          const (RemoteAsset) => assets.whereType<RemoteAsset>(),
          const (LocalAsset) => assets.whereType<LocalAsset>(),
          _ => const [],
        }
        as Iterable<T>;
  }

  Set<BaseAsset> _getAssets(ActionSource source) {
    return switch (source) {
      ActionSource.timeline => ref.read(multiSelectProvider).selectedAssets,
      ActionSource.viewer => switch (ref.read(currentAssetNotifier)) {
        BaseAsset asset => {asset},
        null => const {},
      },
    };
  }

  Future<ActionResult> troubleshoot(ActionSource source, BuildContext context) async {
    final assets = _getAssets(source);
    if (assets.length > 1) {
      return ActionResult(count: assets.length, success: false, error: 'Cannot troubleshoot multiple assets');
    }
    context.pushRoute(AssetTroubleshootRoute(asset: assets.first));

    return ActionResult(count: assets.length, success: true);
  }

  Future<ActionResult> shareLink(ActionSource source, BuildContext context) async {
    final ids = _getRemoteIdsForSource(source);
    try {
      await _service.shareLink(ids, context);
      return ActionResult(count: ids.length, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to create shared link for assets', error, stack);
      return ActionResult(count: ids.length, success: false, error: error.toString());
    }
  }

  Future<ActionResult> favorite(ActionSource source) async {
    final ids = _getOwnedRemoteIdsForSource(source);
    try {
      await _service.favorite(ids);
      return ActionResult(count: ids.length, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to favorite assets', error, stack);
      return ActionResult(count: ids.length, success: false, error: error.toString());
    }
  }

  Future<ActionResult> unFavorite(ActionSource source) async {
    final ids = _getOwnedRemoteIdsForSource(source);
    try {
      await _service.unFavorite(ids);
      return ActionResult(count: ids.length, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to unfavorite assets', error, stack);
      return ActionResult(count: ids.length, success: false, error: error.toString());
    }
  }

  Future<ActionResult> archive(ActionSource source) async {
    final ids = _getOwnedRemoteIdsForSource(source);
    try {
      await _service.archive(ids);
      return ActionResult(count: ids.length, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to archive assets', error, stack);
      return ActionResult(count: ids.length, success: false, error: error.toString());
    }
  }

  Future<ActionResult> unArchive(ActionSource source) async {
    final ids = _getOwnedRemoteIdsForSource(source);
    try {
      await _service.unArchive(ids);
      return ActionResult(count: ids.length, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to unarchive assets', error, stack);
      return ActionResult(count: ids.length, success: false, error: error.toString());
    }
  }

  Future<ActionResult> moveToLockFolder(ActionSource source) async {
    final ids = _getOwnedRemoteIdsForSource(source);
    final localIds = _getLocalIdsForSource(source);
    try {
      await _service.moveToLockFolder(ids, localIds);
      return ActionResult(count: ids.length, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to move assets to lock folder', error, stack);
      return ActionResult(count: ids.length, success: false, error: error.toString());
    }
  }

  Future<ActionResult> removeFromLockFolder(ActionSource source) async {
    final ids = _getOwnedRemoteIdsForSource(source);
    try {
      await _service.removeFromLockFolder(ids);
      return ActionResult(count: ids.length, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to remove assets from lock folder', error, stack);
      return ActionResult(count: ids.length, success: false, error: error.toString());
    }
  }

  Future<ActionResult> trash(ActionSource source) async {
    final ids = _getOwnedRemoteIdsForSource(source);

    try {
      await _service.trash(ids);
      return ActionResult(count: ids.length, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to trash assets', error, stack);
      return ActionResult(count: ids.length, success: false, error: error.toString());
    }
  }

  Future<ActionResult> restoreTrash(ActionSource source) async {
    final ids = _getOwnedRemoteIdsForSource(source);
    try {
      await _service.restoreTrash(ids);
      return ActionResult(count: ids.length, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to restore trash assets', error, stack);
      return ActionResult(count: ids.length, success: false, error: error.toString());
    }
  }

  Future<ActionResult> trashRemoteAndDeleteLocal(ActionSource source) async {
    final ids = _getOwnedRemoteIdsForSource(source);
    final localIds = _getLocalIdsForSource(source);
    try {
      await _service.trashRemoteAndDeleteLocal(ids, localIds);
      return ActionResult(count: ids.length, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to delete assets', error, stack);
      return ActionResult(count: ids.length, success: false, error: error.toString());
    }
  }

  Future<ActionResult> deleteRemoteAndLocal(ActionSource source) async {
    final ids = _getOwnedRemoteIdsForSource(source);
    final localIds = _getLocalIdsForSource(source);
    try {
      await _service.deleteRemoteAndLocal(ids, localIds);
      return ActionResult(count: ids.length, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to delete assets', error, stack);
      return ActionResult(count: ids.length, success: false, error: error.toString());
    }
  }

  Future<ActionResult> deleteLocal(ActionSource source) async {
    final ids = _getLocalIdsForSource(source);
    try {
      final deletedCount = await _service.deleteLocal(ids);
      return ActionResult(count: deletedCount, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to delete assets', error, stack);
      return ActionResult(count: ids.length, success: false, error: error.toString());
    }
  }

  Future<ActionResult?> editLocation(ActionSource source, BuildContext context) async {
    final ids = _getOwnedRemoteIdsForSource(source);
    try {
      final isEdited = await _service.editLocation(ids, context);
      if (!isEdited) {
        return null;
      }

      return ActionResult(count: ids.length, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to edit location for assets', error, stack);
      return ActionResult(count: ids.length, success: false, error: error.toString());
    }
  }

  Future<ActionResult?> editDateTime(ActionSource source, BuildContext context) async {
    final ids = _getOwnedRemoteIdsForSource(source);
    try {
      final isEdited = await _service.editDateTime(ids, context);
      if (!isEdited) {
        return null;
      }

      return ActionResult(count: ids.length, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to edit date and time for assets', error, stack);
      return ActionResult(count: ids.length, success: false, error: error.toString());
    }
  }

  Future<ActionResult> removeFromAlbum(ActionSource source, String albumId) async {
    final ids = _getRemoteIdsForSource(source);
    try {
      final removedCount = await _service.removeFromAlbum(ids, albumId);
      return ActionResult(count: removedCount, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to remove assets from album', error, stack);
      return ActionResult(count: ids.length, success: false, error: error.toString());
    }
  }

  Future<ActionResult> updateDescription(ActionSource source, String description) async {
    final ids = _getRemoteIdsForSource(source);
    if (ids.length != 1) {
      _logger.warning('updateDescription called with multiple assets, expected single asset');
      return ActionResult(count: ids.length, success: false, error: 'Expected single asset for description update');
    }

    try {
      final isUpdated = await _service.updateDescription(ids.first, description);
      return ActionResult(count: 1, success: isUpdated);
    } catch (error, stack) {
      _logger.severe('Failed to update description for asset', error, stack);
      return ActionResult(count: 1, success: false, error: error.toString());
    }
  }

  Future<ActionResult> stack(String userId, ActionSource source) async {
    final ids = _getOwnedRemoteIdsForSource(source);
    try {
      await _service.stack(userId, ids);
      return ActionResult(count: ids.length, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to stack assets', error, stack);
      return ActionResult(count: ids.length, success: false, error: error.toString());
    }
  }

  Future<ActionResult> unStack(ActionSource source) async {
    final assets = _getOwnedRemoteAssetsForSource(source);
    try {
      await _service.unStack(assets.map((e) => e.stackId).nonNulls.toList());
      return ActionResult(count: assets.length, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to unstack assets', error, stack);
      return ActionResult(count: assets.length, success: false);
    }
  }

  Future<ActionResult> shareAssets(ActionSource source) async {
    final ids = _getAssets(source).toList(growable: false);

    try {
      await _service.shareAssets(ids);
      return ActionResult(count: ids.length, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to share assets', error, stack);
      return ActionResult(count: ids.length, success: false, error: error.toString());
    }
  }

  Future<ActionResult> downloadAll(ActionSource source) async {
    final assets = _getAssets(source).whereType<RemoteAsset>().toList(growable: false);

    try {
      final didEnqueue = await _service.downloadAll(assets);
      final enqueueCount = didEnqueue.where((e) => e).length;
      return ActionResult(count: enqueueCount, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to download assets', error, stack);
      return ActionResult(count: assets.length, success: false, error: error.toString());
    }
  }

  Future<ActionResult> upload(ActionSource source) async {
    final assets = _getAssets(source).whereType<LocalAsset>().toList();
    try {
      await _uploadService.manualBackup(assets);
      return ActionResult(count: assets.length, success: true);
    } catch (error, stack) {
      _logger.severe('Failed manually upload assets', error, stack);
      return ActionResult(count: assets.length, success: false, error: error.toString());
    }
  }
}

extension on Iterable<RemoteAsset> {
  Iterable<String> toIds() => map((e) => e.id);

  Iterable<RemoteAsset> ownedAssets(String? ownerId) {
    if (ownerId == null) return const [];
    return whereType<RemoteAsset>().where((a) => a.ownerId == ownerId);
  }
}
