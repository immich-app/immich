import 'dart:io';

import 'package:logging/logging.dart';
import 'package:photo_manager/photo_manager.dart';

class StorageRepository {
  const StorageRepository();

  Future<File?> getFileForAsset(String assetId) async {
    final log = Logger('StorageRepository');
    File? file;
    try {
      final entity = await AssetEntity.fromId(assetId);
      file = await entity?.originFile;
      if (file == null) {
        log.warning("Cannot get file for asset $assetId");
      }
    } catch (error, stackTrace) {
      log.warning("Error getting file for asset $assetId", error, stackTrace);
    }
    return file;
  }

  Future<void> clearFileCache() async {
    final log = Logger('StorageRepository');
    try {
      await PhotoManager.clearFileCache();
      log.fine("File cache cleared successfully");
    } catch (error, stackTrace) {
      log.warning("Error clearing file cache", error, stackTrace);
    }
  }
}
