import 'dart:io';

import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:logging/logging.dart';
import 'package:photo_manager/photo_manager.dart';

class StorageRepository {
  const StorageRepository();

  Future<File?> getFileForAsset(String assetId) async {
    File? file;
    final log = Logger('StorageRepository');

    try {
      final entity = await AssetEntity.fromId(assetId);
      file = await entity?.originFile;
      if (file == null) {
        log.warning("Cannot get file for asset $assetId");
        return null;
      }

      final exists = await file.exists();
      if (!exists) {
        log.warning("File for asset $assetId does not exist");
        return null;
      }
    } catch (error, stackTrace) {
      log.warning("Error getting file for asset $assetId", error, stackTrace);
    }
    return file;
  }

  /// Check if an asset has a RAW resource (iOS only, JPEG+RAW pair).
  /// Returns true if the asset has a RAW resource alongside the main JPEG/HEIC.
  Future<bool> hasRawResource(String assetId) async {
    if (!CurrentPlatform.isIOS) {
      return false;
    }

    try {
      final nativeSyncApi = NativeSyncApi();
      return await nativeSyncApi.hasRawResource(assetId);
    } catch (error, stackTrace) {
      final log = Logger('StorageRepository');
      log.warning("Error checking RAW resource for asset $assetId", error, stackTrace);
      return false;
    }
  }

  /// Get the RAW file for an asset (iOS only).
  /// Returns null if the asset has no RAW resource.
  Future<File?> getRawFileForAsset(String assetId) async {
    if (!CurrentPlatform.isIOS) {
      return null;
    }

    final log = Logger('StorageRepository');

    try {
      final nativeSyncApi = NativeSyncApi();
      final filePath = await nativeSyncApi.getRawFilePath(assetId);

      if (filePath == null) {
        return null;
      }

      final file = File(filePath);
      final exists = await file.exists();

      if (!exists) {
        log.warning("RAW file for asset $assetId does not exist at path: $filePath");
        return null;
      }

      return file;
    } catch (error, stackTrace) {
      log.warning("Error getting RAW file for asset $assetId", error, stackTrace);
      return null;
    }
  }

  Future<File?> getMotionFileForAsset(LocalAsset asset) async {
    File? file;
    final log = Logger('StorageRepository');

    try {
      final entity = await AssetEntity.fromId(asset.id);
      file = await entity?.originFileWithSubtype;
      if (file == null) {
        log.warning(
          "Cannot get motion file for asset ${asset.id}, name: ${asset.name}, created on: ${asset.createdAt}",
        );
        return null;
      }

      final exists = await file.exists();
      if (!exists) {
        log.warning("Motion file for asset ${asset.id} does not exist");
        return null;
      }
    } catch (error, stackTrace) {
      log.warning(
        "Error getting motion file for asset ${asset.id}, name: ${asset.name}, created on: ${asset.createdAt}",
        error,
        stackTrace,
      );
    }
    return file;
  }

  Future<AssetEntity?> getAssetEntityForAsset(LocalAsset asset) async {
    final log = Logger('StorageRepository');

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

  Future<void> clearCache() async {
    final log = Logger('StorageRepository');

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
