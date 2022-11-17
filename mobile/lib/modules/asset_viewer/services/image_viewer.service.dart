import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:openapi/api.dart';
import 'package:path/path.dart' as p;

import 'package:photo_manager/photo_manager.dart';
import 'package:path_provider/path_provider.dart';

final imageViewerServiceProvider =
    Provider((ref) => ImageViewerService(ref.watch(apiServiceProvider)));

class ImageViewerService {
  final ApiService _apiService;

  ImageViewerService(this._apiService);

  Future<bool> downloadAssetToDevice(AssetResponseDto asset) async {
    try {
      String fileName = p.basename(asset.originalPath);

      var res = await _apiService.assetApi.downloadFileWithHttpInfo(
        asset.id,
        isThumb: false,
        isWeb: false,
      );

      final AssetEntity? entity;

      if (asset.type == AssetTypeEnum.IMAGE) {
        entity = await PhotoManager.editor.saveImage(
          res.bodyBytes,
          title: p.basename(asset.originalPath),
        );
      } else {
        final tempDir = await getTemporaryDirectory();
        File tempFile = await File('${tempDir.path}/$fileName').create();
        tempFile.writeAsBytesSync(res.bodyBytes);
        entity = await PhotoManager.editor.saveVideo(tempFile, title: fileName);
      }

      return entity != null;
    } catch (e) {
      debugPrint("Error saving file $e");
      return false;
    }
  }
}
