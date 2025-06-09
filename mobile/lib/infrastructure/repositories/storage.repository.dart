import 'dart:io';

import 'package:immich_mobile/domain/interfaces/storage.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:logging/logging.dart';
import 'package:photo_manager/photo_manager.dart';

class StorageRepository implements IStorageRepository {
  final _log = Logger('StorageRepository');

  @override
  Future<File?> getFileForAsset(LocalAsset asset) async {
    File? file;
    try {
      final entity = await AssetEntity.fromId(asset.id);
      file = await entity?.originFile;
      if (file == null) {
        _log.warning(
          "Cannot get file for asset ${asset.id}, name: ${asset.name}, created on: ${asset.createdAt}",
        );
      }
    } catch (error, stackTrace) {
      _log.warning(
        "Error getting file for asset ${asset.id}, name: ${asset.name}, created on: ${asset.createdAt}",
        error,
        stackTrace,
      );
    }
    return file;
  }

  @override
  Future<AssetEntity?> getAssetEntityForAsset(LocalAsset asset) async {
    AssetEntity? entity;
    try {
      entity = await AssetEntity.fromId(asset.id);
      if (entity == null) {
        _log.warning(
          "Cannot get AssetEntity for asset ${asset.id}, name: ${asset.name}, created on: ${asset.createdAt}",
        );
      }
    } catch (error, stackTrace) {
      _log.warning(
        "Error getting AssetEntity for asset ${asset.id}, name: ${asset.name}, created on: ${asset.createdAt}",
        error,
        stackTrace,
      );
    }
    return entity;
  }
}
