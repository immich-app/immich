import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/entities/asset.entity.dart' hide AssetType;
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:photo_manager/photo_manager.dart' hide AssetType;

final fileMediaRepositoryProvider = Provider((ref) => const FileMediaRepository());

class FileMediaRepository {
  const FileMediaRepository();
  Future<Asset?> saveImage(Uint8List data, {required String title, String? relativePath}) async {
    final entity = await PhotoManager.editor.saveImage(data, filename: title, title: title, relativePath: relativePath);
    return AssetMediaRepository.toAsset(entity);
  }

  Future<LocalAsset?> saveLocalAsset(Uint8List data, {required String title, String? relativePath}) async {
    final entity = await PhotoManager.editor.saveImage(data, filename: title, title: title, relativePath: relativePath);

    return LocalAsset(
      id: entity.id,
      name: title,
      type: AssetType.image,
      createdAt: entity.createDateTime,
      updatedAt: entity.modifiedDateTime,
    );
  }

  Future<Asset?> saveImageWithFile(String filePath, {String? title, String? relativePath}) async {
    final entity = await PhotoManager.editor.saveImageWithPath(filePath, title: title, relativePath: relativePath);
    return AssetMediaRepository.toAsset(entity);
  }

  Future<Asset?> saveLivePhoto({required File image, required File video, required String title}) async {
    final entity = await PhotoManager.editor.darwin.saveLivePhoto(imageFile: image, videoFile: video, title: title);
    return AssetMediaRepository.toAsset(entity);
  }

  Future<Asset?> saveVideo(File file, {required String title, String? relativePath}) async {
    final entity = await PhotoManager.editor.saveVideo(file, title: title, relativePath: relativePath);
    return AssetMediaRepository.toAsset(entity);
  }

  Future<void> clearFileCache() => PhotoManager.clearFileCache();

  Future<void> enableBackgroundAccess() => PhotoManager.setIgnorePermissionCheck(true);

  Future<void> requestExtendedPermissions() => PhotoManager.requestPermissionExtend();
}
