import 'dart:async';

import 'package:background_downloader/background_downloader.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/remote_album.service.dart';
import 'package:immich_mobile/models/download/livephotos_medatada.model.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/backup/asset_upload_progress.provider.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/services/action.service.dart';
import 'package:immich_mobile/services/download.service.dart';
import 'package:immich_mobile/services/foreground_upload.service.dart';
import 'package:logging/logging.dart';

final actionProvider = NotifierProvider<ActionNotifier, void>(ActionNotifier.new, dependencies: [multiSelectProvider]);

class ActionResult {
  final int count;
  final bool success;
  final String? error;
  final List<String> remoteAssetIds;

  const ActionResult({required this.count, required this.success, this.error, this.remoteAssetIds = const []});

  @override
  String toString() => 'ActionResult(count: $count, success: $success, error: $error, remoteAssetIds: $remoteAssetIds)';
}

class ActionNotifier extends Notifier<void> {
  final Logger _logger = Logger('ActionNotifier');
  late ActionService _service;
  late ForegroundUploadService _foregroundUploadService;
  late DownloadService _downloadService;

  ActionNotifier() : super();

  @override
  void build() {
    _foregroundUploadService = ref.watch(foregroundUploadServiceProvider);
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
      unawaited(_downloadService.saveLivePhotos(update.task, livePhotosId));
    }
  }

  List<String> _getRemoteIdsForSource(ActionSource source) {
    return _getAssets(source).whereType<RemoteAsset>().toIds().toList(growable: false);
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
    if (remoteIds.isNotEmpty) {
      try {
        addedRemote = await albumNotifier.addAssets(album.id, remoteIds);
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
      return ActionResult(count: addedRemote, success: true);
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
    );
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
}

extension on Iterable<RemoteAsset> {
  Iterable<String> toIds() => map((e) => e.id);
}
