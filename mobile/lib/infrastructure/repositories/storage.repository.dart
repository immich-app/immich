import 'dart:io';

import 'package:immich_mobile/domain/interfaces/storage.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:logging/logging.dart';
import 'package:photo_manager/photo_manager.dart';

class StorageRepository implements IStorageRepository {
  const StorageRepository();

  @override
  Future<File?> getFileForAsset(LocalAsset asset) async {
    final log = Logger('StorageRepository');
    File? file;
    try {
      final entity = await AssetEntity.fromId(asset.id);
      file = await entity?.originFile;
      if (file == null) {
        log.warning(
          "Cannot get file for asset ${asset.id}, name: ${asset.name}, created on: ${asset.createdAt}",
        );
      }
    } catch (error, stackTrace) {
      log.warning(
        "Error getting file for asset ${asset.id}, name: ${asset.name}, created on: ${asset.createdAt}",
        error,
        stackTrace,
      );
    }
    return file;
  }
}
