import 'dart:async';
import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/providers/infrastructure/storage.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:path/path.dart' as p;
import 'package:photo_manager/photo_manager.dart';
import 'package:share_plus/share_plus.dart';

typedef _ShareFile = ({File file, FileSystemEntity? tempEntity, String displayName});

final assetMediaRepositoryProvider = Provider(
  (ref) => AssetMediaRepository(ref.watch(nativeSyncApiProvider), ref.watch(storageRepositoryProvider)),
);

class AssetMediaRepository {
  final NativeSyncApi _nativeSyncApi;
  final StorageRepository _storageRepository;
  static final Logger _log = Logger("AssetMediaRepository");

  const AssetMediaRepository(this._nativeSyncApi, this._storageRepository);

  Future<bool> _androidSupportsTrash() async {
    if (Platform.isAndroid) {
      final DeviceInfoPlugin deviceInfo = DeviceInfoPlugin();
      final AndroidDeviceInfo androidInfo = await deviceInfo.androidInfo;
      final int sdkVersion = androidInfo.version.sdkInt;
      return sdkVersion >= 31;
    }
    return false;
  }

  Future<List<String>> deleteAll(List<String> ids) async {
    if (CurrentPlatform.isAndroid) {
      if (await _androidSupportsTrash()) {
        return PhotoManager.editor.android.moveToTrash(
          ids.map((e) => AssetEntity(id: e, width: 1, height: 1, typeInt: 0)).toList(),
        );
      } else {
        return PhotoManager.editor.deleteWithIds(ids);
      }
    }
    return PhotoManager.editor.deleteWithIds(ids);
  }

  Future<bool> _restoreFromTrashById(String mediaId, int type) async {
    try {
      return await _nativeSyncApi.restoreFromTrashById(mediaId, type);
    } catch (e, s) {
      _log.warning('Error restore file from trash by Id', e, s);
      return false;
    }
  }

  Future<List<String>> restoreAssetsFromTrash(Iterable<LocalAsset> assets) async {
    final restoredIds = <String>[];
    for (final asset in assets) {
      _log.info("Restoring from trash, localId: ${asset.id}, checksum: ${asset.checksum}");
      final result = await _restoreFromTrashById(asset.id, asset.type.index);
      if (result) {
        restoredIds.add(asset.id);
      }
    }
    return restoredIds;
  }

  Future<AssetEntity?> get(String id) async {
    final entity = await AssetEntity.fromId(id);
    return entity;
  }

  Future<String?> getOriginalFilename(String id) async {
    final entity = await AssetEntity.fromId(id);
    if (entity == null) {
      return null;
    }

    try {
      // titleAsync gets the correct original filename for some assets on iOS
      // otherwise using the `entity.title` would return a random GUID
      final originalFilename = await entity.titleAsync;
      // treat empty filename as missing
      return originalFilename.isNotEmpty ? originalFilename : null;
    } catch (e) {
      _log.warning("Failed to get original filename for asset: $id. Error: $e");
      return null;
    }
  }

  /// Deletes temporary entities in parallel, removing download task directories recursively
  @visibleForTesting
  static Future<void> cleanupShareTempFiles(List<FileSystemEntity> tempEntities) async {
    await Future.wait(
      tempEntities.map((entity) async {
        try {
          if (entity is Directory) {
            await entity.delete(recursive: true);
          } else {
            await entity.delete();
          }
        } catch (e) {
          _log.warning("Failed to delete temporary file: ${entity.path}", e);
        }
      }),
    );
  }

  static final RegExp _pathSeparators = RegExp(r'[\\/]');

  static String _sanitizeFilename(String filename) {
    return filename.replaceAll(_pathSeparators, '_');
  }

  @visibleForTesting
  static String getOriginalShareFilename(BaseAsset asset) {
    final hasUsableName = asset.name.replaceAll(_pathSeparators, '').isNotEmpty;
    return hasUsableName ? _sanitizeFilename(asset.name) : _shareFallbackName(asset);
  }

  static String _shareFallbackName(BaseAsset asset) => asset.remoteId ?? asset.localId ?? 'asset';

  static String _getPreviewFilename(BaseAsset asset) {
    final sanitizedFilename = _sanitizeFilename(asset.name);
    final baseName = p.basenameWithoutExtension(sanitizedFilename);
    return '${baseName.isEmpty ? _shareFallbackName(asset) : baseName}-preview.jpg';
  }

  static String _shareDisplayName(BaseAsset asset, ShareAssetType fileType) =>
      switch (asset.isVideo ? ShareAssetType.original : fileType) {
        ShareAssetType.original => getOriginalShareFilename(asset),
        ShareAssetType.preview => _getPreviewFilename(asset),
      };

  @visibleForTesting
  static String getOrdinalShareDisplayName(String displayName, int occurrence) {
    if (occurrence <= 0) {
      return displayName;
    }
    return '${p.basenameWithoutExtension(displayName)} ($occurrence)${p.extension(displayName)}';
  }

  @visibleForTesting
  static Map<String, int> countShareDisplayNames(List<BaseAsset> assets, ShareAssetType fileType) {
    final counts = <String, int>{};
    for (final asset in assets) {
      final name = _shareDisplayName(asset, fileType);
      counts[name] = (counts[name] ?? 0) + 1;
    }
    return counts;
  }

  bool _isCancelled(Completer<void>? cancelCompleter) => cancelCompleter?.isCompleted ?? false;

  Future<_ShareFile?> _getLocalOriginalShareFile(BaseAsset asset, String localId, int occurrence) async {
    final file = await _storageRepository.getFileForAsset(localId);
    if (file == null) {
      _log.warning("Local original file not found for sharing: $asset");
      return null;
    }

    return (
      file: file,
      tempEntity: CurrentPlatform.isIOS ? file : null,
      displayName: getOrdinalShareDisplayName(getOriginalShareFilename(asset), occurrence),
    );
  }

  @visibleForTesting
  static DownloadTask buildShareDownloadTask({
    required String taskId,
    required String url,
    required Map<String, String> headers,
    required String displayName,
  }) {
    return DownloadTask(
      taskId: taskId,
      url: url,
      headers: headers,
      // receiving apps show the shared file's own name, so duplicates get an ordinal suffix in the display name
      filename: displayName,
      directory: taskId,
      baseDirectory: BaseDirectory.temporary,
      group: kShareDownloadGroup,
      updates: Updates.statusAndProgress,
    );
  }

  Future<_ShareFile?> _downloadRemoteShareFile({
    required String taskId,
    required String url,
    required String displayName,
    Completer<void>? cancelCompleter,
    required void Function(double progress) onProgress,
  }) async {
    final task = buildShareDownloadTask(
      taskId: taskId,
      url: url,
      headers: ApiService.getRequestHeaders(),
      displayName: displayName,
    );
    final downloader = FileDownloader();
    final statusUpdate = await downloader.download(
      task,
      onProgress: (value) {
        if (_isCancelled(cancelCompleter)) {
          unawaited(downloader.cancelTaskWithId(taskId));
          return;
        }
        onProgress(value);
      },
    );

    if (_isCancelled(cancelCompleter)) {
      return null;
    }

    if (statusUpdate.status == TaskStatus.complete) {
      final file = File(await task.filePath());
      return (file: file, tempEntity: file.parent, displayName: displayName);
    }

    _log.severe("Download for $displayName failed with status ${statusUpdate.status}", statusUpdate.exception);
    return null;
  }

  Future<_ShareFile?> _getRemoteOriginalShareFile(
    BaseAsset asset,
    String remoteId, {
    required int occurrence,
    Completer<void>? cancelCompleter,
    required void Function(double progress) onProgress,
  }) {
    return _downloadRemoteShareFile(
      taskId: 'share-original-$remoteId-${DateTime.now().microsecondsSinceEpoch}',
      url: getOriginalUrlForRemoteId(remoteId, edited: asset.isEdited),
      displayName: getOrdinalShareDisplayName(getOriginalShareFilename(asset), occurrence),
      cancelCompleter: cancelCompleter,
      onProgress: onProgress,
    );
  }

  Future<_ShareFile?> _getRemotePreviewShareFile(
    BaseAsset asset,
    String remoteId, {
    required int occurrence,
    Completer<void>? cancelCompleter,
    required void Function(double progress) onProgress,
  }) {
    return _downloadRemoteShareFile(
      taskId: 'share-preview-$remoteId-${DateTime.now().microsecondsSinceEpoch}',
      url: getThumbnailUrlForRemoteId(remoteId, type: AssetMediaSize.preview, edited: asset.isEdited),
      displayName: getOrdinalShareDisplayName(_getPreviewFilename(asset), occurrence),
      cancelCompleter: cancelCompleter,
      onProgress: onProgress,
    );
  }

  Future<_ShareFile?> _getOriginalShareFile(
    BaseAsset asset, {
    required int occurrence,
    Completer<void>? cancelCompleter,
    required void Function(double progress) onProgress,
  }) {
    final localId = asset.localId;
    if (localId != null && !asset.isEdited) {
      return _getLocalOriginalShareFile(asset, localId, occurrence);
    }

    final remoteId = asset.remoteId;
    if (remoteId == null) {
      _log.warning("Asset has no remote ID for sharing: $asset");
      return Future.value(null);
    }

    return _getRemoteOriginalShareFile(
      asset,
      remoteId,
      occurrence: occurrence,
      cancelCompleter: cancelCompleter,
      onProgress: onProgress,
    );
  }

  Future<_ShareFile?> _getPreviewShareFile(
    BaseAsset asset, {
    required int occurrence,
    Completer<void>? cancelCompleter,
    required void Function(double progress) onProgress,
  }) async {
    final remoteId = asset.remoteId;
    if (remoteId != null) {
      final remotePreview = await _getRemotePreviewShareFile(
        asset,
        remoteId,
        occurrence: occurrence,
        cancelCompleter: cancelCompleter,
        onProgress: onProgress,
      );
      if (remotePreview != null || asset.isEdited) {
        return remotePreview;
      }
    }

    final localId = asset.localId;
    if (localId != null) {
      return _getLocalOriginalShareFile(asset, localId, occurrence);
    }

    _log.warning("Asset has no local or remote ID for preview sharing: $asset");
    return null;
  }

  Future<int> shareAssets(
    List<BaseAsset> assets,
    BuildContext context, {
    ShareAssetType fileType = ShareAssetType.original,
    Completer<void>? cancelCompleter,
    void Function(double progress)? onAssetDownloadProgress,
  }) async {
    final downloadedXFiles = <XFile>[];
    final tempFiles = <FileSystemEntity>[];
    final totalAssets = assets.length;
    var processedAssets = 0;

    void updateProgress([double currentAssetProgress = 0.0]) {
      if (totalAssets <= 0) {
        onAssetDownloadProgress?.call(1.0);
        return;
      }

      final normalizedAssetProgress = currentAssetProgress.clamp(0.0, 1.0);
      final overallProgress = ((processedAssets + normalizedAssetProgress) / totalAssets).clamp(0.0, 1.0);
      onAssetDownloadProgress?.call(overallProgress);
    }

    updateProgress();

    final displayNameCounts = countShareDisplayNames(assets, fileType);
    final displayNameOccurrences = <String, int>{};

    for (final asset in assets) {
      if (_isCancelled(cancelCompleter)) {
        await cleanupShareTempFiles(tempFiles);
        return 0;
      }

      final effectiveFileType = asset.isVideo ? ShareAssetType.original : fileType;
      final displayName = _shareDisplayName(asset, fileType);
      final occurrence = displayNameCounts[displayName]! > 1
          ? displayNameOccurrences.update(displayName, (count) => count + 1, ifAbsent: () => 1)
          : 0;

      final shareFile = switch (effectiveFileType) {
        ShareAssetType.original => await _getOriginalShareFile(
          asset,
          occurrence: occurrence,
          cancelCompleter: cancelCompleter,
          onProgress: updateProgress,
        ),
        ShareAssetType.preview => await _getPreviewShareFile(
          asset,
          occurrence: occurrence,
          cancelCompleter: cancelCompleter,
          onProgress: updateProgress,
        ),
      };

      if (_isCancelled(cancelCompleter)) {
        await cleanupShareTempFiles(tempFiles);
        return 0;
      }

      if (shareFile == null) {
        processedAssets++;
        updateProgress();
        continue;
      }

      downloadedXFiles.add(XFile(shareFile.file.path, name: shareFile.displayName));
      final tempEntity = shareFile.tempEntity;
      if (tempEntity != null) {
        tempFiles.add(tempEntity);
      }
      processedAssets++;
      updateProgress();
    }

    if (downloadedXFiles.isEmpty) {
      _log.warning("No asset can be retrieved for share");
      return 0;
    }

    if (_isCancelled(cancelCompleter)) {
      await cleanupShareTempFiles(tempFiles);
      return 0;
    }

    // we dont want to await the share result since the
    // "preparing" dialog will not disappear until
    final size = context.sizeData;
    unawaited(
      Share.shareXFiles(
        downloadedXFiles,
        sharePositionOrigin: Rect.fromPoints(Offset.zero, Offset(size.width / 3, size.height)),
      ).then((result) async {
        await cleanupShareTempFiles(tempFiles);
      }),
    );

    return downloadedXFiles.length;
  }
}
