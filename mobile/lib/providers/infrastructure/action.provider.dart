import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/asset_edit.model.dart';
import 'package:immich_mobile/domain/services/asset.service.dart';
import 'package:immich_mobile/domain/services/remote_album.service.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/backup/asset_upload_progress.provider.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/asset.provider.dart' show assetExifProvider;
import 'package:immich_mobile/providers/infrastructure/tag.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/providers/websocket.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/action.service.dart';
import 'package:immich_mobile/services/foreground_upload.service.dart';
import 'package:immich_mobile/utils/semver.dart';
import 'package:immich_mobile/widgets/asset_grid/delete_dialog.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

final actionProvider = NotifierProvider<ActionNotifier, void>(ActionNotifier.new, dependencies: [multiSelectProvider]);

class ActionResult {
  final int count;
  final bool success;
  final String? error;
  final List<String> remoteAssetIds;
  final int failedCount;

  const ActionResult({
    required this.count,
    required this.success,
    this.error,
    this.remoteAssetIds = const [],
    this.failedCount = 0,
  });

  @override
  String toString() =>
      'ActionResult(count: $count, success: $success, error: $error, remoteAssetIds: $remoteAssetIds, failedCount: $failedCount)';
}

class ActionNotifier extends Notifier<void> {
  final Logger _logger = Logger('ActionNotifier');
  late ActionService _service;
  late ForegroundUploadService _foregroundUploadService;
  late AssetService _assetService;

  ActionNotifier() : super();

  @override
  void build() {
    _foregroundUploadService = ref.watch(foregroundUploadServiceProvider);
    _service = ref.watch(actionServiceProvider);
    _assetService = ref.watch(assetServiceProvider);
  }

  List<String> _getRemoteIdsForSource(ActionSource source) {
    return _getAssets(source).whereType<RemoteAsset>().toIds().toList(growable: false);
  }

  List<String> _getLocalIdsForSource(ActionSource source, {bool ignoreLocalOnly = false}) {
    final Set<BaseAsset> assets = _getAssets(source);
    final List<String> localIds = [];

    for (final asset in assets) {
      if (ignoreLocalOnly && asset.storage != AssetState.merged) {
        continue;
      }
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
      ActionSource.viewer => switch (ref.read(assetViewerProvider).currentAsset) {
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
    unawaited(context.pushRoute(AssetTroubleshootRoute(asset: assets.first)));

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
    final localIds = _getLocalIdsForSource(source, ignoreLocalOnly: true);
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

  Future<ActionResult> emptyTrash(String userId) async {
    try {
      final count = await _service.emptyTrash(userId);
      return ActionResult(count: count, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to empty trash', error, stack);
      return ActionResult(count: 0, success: false, error: error.toString());
    }
  }

  Future<ActionResult> restoreAllTrash(String userId) async {
    try {
      final count = await _service.restoreAllTrash(userId);
      return ActionResult(count: count, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to restore all trash assets', error, stack);
      return ActionResult(count: 0, success: false, error: error.toString());
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

  Future<ActionResult?> deleteLocal(ActionSource source, BuildContext context) async {
    final assets = _getAssets(source);
    bool? backedUpOnly = assets.every((asset) => asset.storage == AssetState.merged)
        ? true
        : await showDialog<bool>(
            context: context,
            builder: (BuildContext context) => DeleteLocalOnlyDialog(onDeleteLocal: (_) {}),
          );

    if (backedUpOnly == null) {
      // User cancelled the dialog
      return null;
    }

    final List<String> ids;
    if (backedUpOnly) {
      ids = assets.where((asset) => asset.storage == AssetState.merged).map((asset) => asset.localId!).toList();
    } else {
      ids = _getLocalIdsForSource(source);
    }

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

      // This must be called since editing location
      // does not update the currentAsset which means
      // the exif provider will not be refreshed automatically
      if (source == ActionSource.viewer) {
        final currentAsset = ref.read(assetViewerProvider).currentAsset;
        if (currentAsset != null) {
          ref.invalidate(assetExifProvider(currentAsset));
        }
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

      if (source == ActionSource.viewer) {
        ref.invalidate(assetExifProvider);
      }

      return ActionResult(count: ids.length, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to edit date and time for assets', error, stack);
      return ActionResult(count: ids.length, success: false, error: error.toString());
    }
  }

  Future<ActionResult?> tagAssets(ActionSource source, BuildContext context) async {
    final ids = _getOwnedRemoteIdsForSource(source);
    try {
      final count = await _service.tagAssets(ids, context);
      if (count == null) {
        return null;
      }

      ref.invalidate(tagProvider);
      return ActionResult(count: count, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to tag assets', error, stack);
      ref.invalidate(tagProvider);
      return ActionResult(count: ids.length, success: false, error: error.toString());
    }
  }

  Future<ActionResult> addToAlbum(ActionSource source, RemoteAlbum album) async {
    final selected = _getAssets(source).toList(growable: false);
    if (selected.isEmpty) {
      return const ActionResult(count: 0, success: true);
    }

    final candidates = RemoteAlbumService.categorizeCandidates(selected);
    final remoteIds = candidates.remoteAssetIds;
    final localAssets = candidates.localAssetsToUpload;
    final albumNotifier = ref.read(remoteAlbumProvider.notifier);

    int addedRemote = 0;
    int failedRemote = 0;
    if (remoteIds.isNotEmpty) {
      try {
        final result = await albumNotifier.addAssets(album.id, remoteIds);
        addedRemote = result.added;
        failedRemote = result.failed;
      } catch (error, stack) {
        _logger.severe('Failed to add assets to album ${album.id}', error, stack);
        return ActionResult(count: 0, success: false, error: error.toString());
      }
    }

    // Keep the selection available for retry if the remote add fails. Once the
    // album mutation succeeds, clear timeline selection so upload overlays can render.
    if (source == ActionSource.timeline) {
      ref.read(multiSelectProvider.notifier).reset();
    }

    if (localAssets.isEmpty) {
      return ActionResult(count: addedRemote, success: true, failedCount: failedRemote);
    }

    final uploadResult = await upload(
      source,
      assets: localAssets,
      onAssetUploaded: (asset, remoteId) async {
        await albumNotifier.linkUploadedAssetToAlbum(album.id, asset, remoteId);
      },
    );

    return ActionResult(
      count: addedRemote + uploadResult.count,
      success: uploadResult.success,
      error: uploadResult.error,
      failedCount: failedRemote,
    );
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

  Future<ActionResult> setAlbumCover(ActionSource source, String albumId) async {
    final assets = _getAssets(source);
    final asset = assets.first;
    if (asset is! RemoteAsset) {
      return const ActionResult(count: 1, success: false, error: 'Asset must be remote');
    }

    try {
      await _service.setAlbumCover(albumId, asset.id);
      return const ActionResult(count: 1, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to set album cover', error, stack);
      return ActionResult(count: 1, success: false, error: error.toString());
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

  Future<ActionResult> updateRating(ActionSource source, int? rating) async {
    final ids = _getRemoteIdsForSource(source);
    if (ids.length != 1) {
      _logger.warning('updateRating called with multiple assets, expected single asset');
      return ActionResult(count: ids.length, success: false, error: 'Expected single asset for rating update');
    }

    try {
      final isUpdated = await _service.updateRating(ids.first, rating);
      return ActionResult(count: 1, success: isUpdated);
    } catch (error, stack) {
      _logger.severe('Failed to update rating for asset', error, stack);
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
      if (source == ActionSource.viewer) {
        final updatedParent = await _assetService.getRemoteAsset(assets.first.id);
        if (updatedParent != null) {
          ref.read(assetViewerProvider.notifier).setAsset(updatedParent);
        }
      }

      return ActionResult(count: assets.length, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to unstack assets', error, stack);
      return ActionResult(count: assets.length, success: false);
    }
  }

  Future<ActionResult> shareAssets(
    ActionSource source,
    BuildContext context, {
    ShareAssetType fileType = ShareAssetType.original,
    Completer<void>? cancelCompleter,
    void Function(double progress)? onAssetDownloadProgress,
  }) async {
    final ids = _getAssets(source).toList(growable: false);

    try {
      final count = await _service.shareAssets(
        ids,
        context,
        fileType: fileType,
        cancelCompleter: cancelCompleter,
        onAssetDownloadProgress: onAssetDownloadProgress,
      );
      return ActionResult(count: count, success: count > 0 || ids.isEmpty);
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

  Future<ActionResult> upload(
    ActionSource source, {
    List<LocalAsset>? assets,
    FutureOr<void> Function(LocalAsset asset, String remoteId)? onAssetUploaded,
  }) async {
    final assetsToUpload = assets ?? _getAssets(source).whereType<LocalAsset>().toList();
    final assetById = {for (final a in assetsToUpload) a.id: a};
    final uploadedAssetIds = <String>{};
    final failedAssetIds = <String>{};
    final postUploadTasks = <Future<void>>[];
    if (assetsToUpload.isEmpty) {
      return const ActionResult(count: 0, success: false, error: 'No assets to upload');
    }

    final progressNotifier = ref.read(assetUploadProgressProvider.notifier);
    final cancelToken = Completer<void>();
    ref.read(manualUploadCancelTokenProvider.notifier).state = cancelToken;
    final remoteAssetIds = <String>[];

    // Initialize progress for all assets
    for (final asset in assetsToUpload) {
      progressNotifier.setProgress(asset.id, 0.0);
    }

    try {
      await _foregroundUploadService.uploadManual(
        assetsToUpload,
        cancelToken: cancelToken,
        callbacks: UploadCallbacks(
          onProgress: (localAssetId, filename, bytes, totalBytes) {
            final progress = totalBytes > 0 ? bytes / totalBytes : 0.0;
            progressNotifier.setProgress(localAssetId, progress);
          },
          onSuccess: (localAssetId, remoteAssetId) {
            remoteAssetIds.add(remoteAssetId);
            progressNotifier.remove(localAssetId);
            uploadedAssetIds.add(localAssetId);
            final asset = assetById[localAssetId];
            final callback = onAssetUploaded;
            if (asset != null && callback != null) {
              postUploadTasks.add(
                Future.sync(() => callback(asset, remoteAssetId)).catchError((Object error, StackTrace stack) {
                  failedAssetIds.add(localAssetId);
                  progressNotifier.setError(localAssetId);
                  _logger.warning('Post-upload callback failed for $localAssetId', error, stack);
                }),
              );
            }
          },
          onError: (localAssetId, errorMessage) {
            failedAssetIds.add(localAssetId);
            progressNotifier.setError(localAssetId);
          },
        ),
      );

      await Future.wait(postUploadTasks);
      final successCount = uploadedAssetIds.difference(failedAssetIds).length;
      final isSuccess = successCount == assetsToUpload.length && failedAssetIds.isEmpty;

      return ActionResult(
        count: successCount,
        success: isSuccess,
        error: isSuccess ? null : 'Failed to upload ${assetsToUpload.length - successCount} assets',
      );
    } catch (error, stack) {
      _logger.severe('Failed manually upload assets', error, stack);

      return ActionResult(
        count: uploadedAssetIds.difference(failedAssetIds).length,
        success: false,
        error: error.toString(),
      );
    } finally {
      ref.read(manualUploadCancelTokenProvider.notifier).state = null;
      Future.delayed(const Duration(seconds: 2), () {
        progressNotifier.clear();
      });
    }
  }

  Future<ActionResult> applyEdits(ActionSource source, List<AssetEdit> edits) async {
    final ids = _getOwnedRemoteIdsForSource(source);

    if (ids.length != 1) {
      _logger.warning('applyEdits called with multiple assets, expected single asset');
      return ActionResult(count: ids.length, success: false, error: 'Expected single asset for applying edits');
    }

    Future<void> editReady;
    if (ref.read(serverInfoProvider).serverVersion >= const SemVer(major: 3, minor: 0, patch: 0)) {
      editReady = ref.read(websocketProvider.notifier).waitForEvent("AssetEditReadyV2", (dynamic data) {
        final eventAsset = SyncAssetV2.fromJson(data["asset"]);
        return eventAsset?.id == ids.first;
      }, const Duration(seconds: 10));
    } else {
      editReady = ref.read(websocketProvider.notifier).waitForEvent("AssetEditReadyV1", (dynamic data) {
        final eventAsset = SyncAssetV1.fromJson(data["asset"]);
        return eventAsset?.id == ids.first;
      }, const Duration(seconds: 10));
    }

    try {
      await _service.applyEdits(ids.first, edits);
      await editReady;
      return const ActionResult(count: 1, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to apply edits to assets', error, stack);
      return ActionResult(count: ids.length, success: false, error: error.toString());
    }
  }
}

extension on Iterable<RemoteAsset> {
  Iterable<String> toIds() => map((e) => e.id);

  Iterable<RemoteAsset> ownedAssets(String? ownerId) {
    if (ownerId == null) {
      return const [];
    }
    return whereType<RemoteAsset>().where((a) => a.ownerId == ownerId);
  }
}
