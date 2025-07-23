import 'dart:io';

import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
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
      }
    } catch (error, stackTrace) {
      log.warning("Error getting file for asset $assetId", error, stackTrace);
    }
    return file;
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
}
