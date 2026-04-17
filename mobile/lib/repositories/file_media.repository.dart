import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:photo_manager/photo_manager.dart' hide AssetType;

final fileMediaRepositoryProvider = Provider((ref) => const FileMediaRepository());

class FileMediaRepository {
  const FileMediaRepository();

  Future<LocalAsset?> saveLocalAsset(Uint8List data, {required String title, String? relativePath}) async {
    final entity = await PhotoManager.editor.saveImage(data, filename: title, title: title, relativePath: relativePath);

    return LocalAsset(
      id: entity.id,
      name: title,
      type: AssetType.image,
      createdAt: entity.createDateTime,
      updatedAt: entity.modifiedDateTime,
      playbackStyle: AssetPlaybackStyle.image,
      isEdited: false,
    );
  }

  Future<AssetEntity?> saveImageWithFile(String filePath, {String? title, String? relativePath}) async {
    final entity = await PhotoManager.editor.saveImageWithPath(filePath, title: title, relativePath: relativePath);
    return entity;
  }

  Future<AssetEntity?> saveLivePhoto({required File image, required File video, required String title}) async {
    final entity = await PhotoManager.editor.darwin.saveLivePhoto(imageFile: image, videoFile: video, title: title);
    return entity;
  }

  Future<AssetEntity?> saveVideo(File file, {required String title, String? relativePath}) async {
    final entity = await PhotoManager.editor.saveVideo(file, title: title, relativePath: relativePath);
    return entity;
  }
}
