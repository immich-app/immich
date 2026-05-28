import 'dart:async';
import 'dart:io';

import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:logging/logging.dart';
import 'package:photo_manager/photo_manager.dart';

class StorageRepository {
  static final log = Logger('StorageRepository');

  const StorageRepository();

  Future<File?> getFileForAsset(
    String assetId, {
    void Function(String id, double progress)? onProgress,
    Completer<void>? cancelToken,
  }) {
    return _getFileForAsset(assetId, isMotion: false, onProgress: onProgress, cancelToken: cancelToken);
  }

  Future<File?> getMotionFileForAsset(
    String assetId, {
    void Function(String id, double progress)? onProgress,
    Completer<void>? cancelToken,
  }) {
    return _getFileForAsset(assetId, isMotion: true, onProgress: onProgress, cancelToken: cancelToken);
  }

  Future<File?> _getFileForAsset(
    String assetId, {
    bool isMotion = false,
    void Function(String id, double progress)? onProgress,
    Completer<void>? cancelToken,
  }) async {
    final entity = await AssetEntity.fromId(assetId);
    if (entity == null) {
      log.warning("Cannot get AssetEntity for asset $assetId");
      return null;
    }

    PMProgressHandler? progressHandler;
    StreamSubscription<PMProgressState>? progressSubscription;
    PMCancelToken? pmCancelToken;
    if (cancelToken != null) {
      progressHandler = PMProgressHandler();
      progressSubscription = progressHandler.stream.listen((event) => onProgress?.call(assetId, event.progress));
      pmCancelToken = PMCancelToken();
      unawaited(cancelToken.future.then((_) => pmCancelToken!.cancelRequest()));
    }

    try {
      return await entity.loadFile(withSubtype: isMotion, progressHandler: progressHandler, cancelToken: pmCancelToken);
    } catch (error, stackTrace) {
      log.warning("Error loading file for asset $assetId", error, stackTrace);
      return null;
    } finally {
      unawaited(progressSubscription?.cancel());
    }
  }

  Future<AssetEntity?> getAssetEntityForAsset(LocalAsset asset) async {
    AssetEntity? entity;

    try {
      entity = await AssetEntity.fromId(asset.id);
      if (entity == null) {
        log.warning(
          "Cannot get AssetEntity for asset ${asset.id}, name: ${asset.name}, created on: ${asset.createdAt}",
        );
      }
    } catch (error, stackTrace) {
      log.warning(
        "Error getting AssetEntity for asset ${asset.id}, name: ${asset.name}, created on: ${asset.createdAt}",
        error,
        stackTrace,
      );
    }
    return entity;
  }

  Future<bool> isAssetAvailableLocally(String assetId) async {
    try {
      final entity = await AssetEntity.fromId(assetId);
      if (entity == null) {
        log.warning("Cannot get AssetEntity for asset $assetId");
        return false;
      }

      return await entity.isLocallyAvailable(isOrigin: true);
    } catch (error, stackTrace) {
      log.warning("Error checking if asset is locally available $assetId", error, stackTrace);
      return false;
    }
  }

  Future<void> clearCache() async {
    try {
      await PhotoManager.clearFileCache();
    } catch (error, stackTrace) {
      log.warning("Error clearing cache", error, stackTrace);
    }

    if (!CurrentPlatform.isIOS) {
      return;
    }

    try {
      if (await Directory.systemTemp.exists()) {
        await Directory.systemTemp.delete(recursive: true);
      }
    } catch (error, stackTrace) {
      log.warning("Error deleting temporary directory", error, stackTrace);
    }
  }
}
