import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';
import 'package:path/path.dart' as p;
import 'package:http/http.dart' as http;

import 'package:photo_manager/photo_manager.dart';
import 'package:path_provider/path_provider.dart';

class ImageViewerService {
  Future<bool> downloadAssetToDevice(ImmichAsset asset) async {
    try {
      String fileName = p.basename(asset.originalPath);
      var savedEndpoint = Hive.box(userInfoBox).get(serverEndpointKey);
      Uri filePath =
          Uri.parse("$savedEndpoint/asset/download?aid=${asset.deviceAssetId}&did=${asset.deviceId}&isThumb=false");

      var res = await http.get(
        filePath,
        headers: {"Authorization": "Bearer ${Hive.box(userInfoBox).get(accessTokenKey)}"},
      );

      final AssetEntity? entity;

      if (asset.type == 'IMAGE') {
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

      if (entity != null) {
        return true;
      }
    } catch (e) {
      debugPrint("Error saving file $e");
      return false;
    }

    return false;
  }
}
