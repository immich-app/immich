import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:logging/logging.dart';

import 'package:photo_manager/photo_manager.dart';
import 'package:path_provider/path_provider.dart';

final imageViewerServiceProvider =
    Provider((ref) => ImageViewerService(ref.watch(apiServiceProvider)));

class ImageViewerService {
  final ApiService _apiService;
  final Logger _log = Logger("ImageViewerService");

  ImageViewerService(this._apiService);

  Future<bool> downloadAssetToDevice(Asset asset) async {
    try {
      // Download LivePhotos image and motion part
      if (asset.isImage && asset.livePhotoVideoId != null) {
        var imageResponse = await _apiService.assetApi.downloadFileWithHttpInfo(
          asset.remoteId!,
        );

        var motionReponse = await _apiService.assetApi.downloadFileWithHttpInfo(
          asset.livePhotoVideoId!,
        );

        if (imageResponse.statusCode != 200 ||
            motionReponse.statusCode != 200) {
          final failedResponse =
              imageResponse.statusCode != 200 ? imageResponse : motionReponse;
          _log.severe(
            "Motion asset download failed with status - ${failedResponse.statusCode} and response - ${failedResponse.body}",
          );
          return false;
        }

        final AssetEntity? entity;

        final tempDir = await getTemporaryDirectory();
        File videoFile = await File('${tempDir.path}/livephoto.mov').create();
        File imageFile = await File('${tempDir.path}/livephoto.heic').create();
        videoFile.writeAsBytesSync(motionReponse.bodyBytes);
        imageFile.writeAsBytesSync(imageResponse.bodyBytes);

        entity = await PhotoManager.editor.darwin.saveLivePhoto(
          imageFile: imageFile,
          videoFile: videoFile,
          title: asset.fileName,
        );

        return entity != null;
      } else {
        var res = await _apiService.assetApi
            .downloadFileWithHttpInfo(asset.remoteId!);

        if (res.statusCode != 200) {
          _log.severe(
            "Asset download failed with status - ${res.statusCode} and response - ${res.body}",
          );
          return false;
        }

        final AssetEntity? entity;

        if (asset.isImage) {
          entity = await PhotoManager.editor.saveImage(
            res.bodyBytes,
            title: asset.fileName,
          );
        } else {
          final tempDir = await getTemporaryDirectory();
          File tempFile =
              await File('${tempDir.path}/${asset.fileName}').create();
          tempFile.writeAsBytesSync(res.bodyBytes);
          entity = await PhotoManager.editor
              .saveVideo(tempFile, title: asset.fileName);
        }
        return entity != null;
      }
    } catch (e) {
      debugPrint("Error saving file $e");
      return false;
    }
  }
}
