import 'dart:io';

import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/platform/media_save_api.g.dart';
import 'package:path/path.dart' as p;
import 'package:photo_manager/photo_manager.dart' hide AssetType;

final _mediaSaveApi = MediaSaveApi();

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

  Future<bool> saveImageWithFile(String filePath, {String? title, String? relativePath}) async {
    try {
      await PhotoManager.editor.saveImageWithPath(filePath, title: title, relativePath: relativePath);
      return true;
    } on PlatformException catch (e) {
      final details = e.details;
      if (!CurrentPlatform.isAndroid ||
          details is! String ||
          !details.toLowerCase().contains('unsupported mime type')) {
        rethrow;
      }
      // TODO: fold the photo_manager and native save paths into one implementation
      final id = await _mediaSaveApi.saveToDownloads(filePath, title ?? p.basename(filePath), 'Download/Immich');
      return id != null;
    }
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
