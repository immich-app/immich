import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';
import 'package:path/path.dart' as p;
import 'package:http/http.dart' as http;

import 'package:photo_manager/photo_manager.dart';

class ImageViewerService {
  Future<bool> downloadAssetToDevice(ImmichAsset asset) async {
    try {
      var savedEndpoint = Hive.box(userInfoBox).get(serverEndpointKey);
      Uri filePath =
          Uri.parse("$savedEndpoint/asset/download?aid=${asset.deviceAssetId}&did=${asset.deviceId}&isThumb=false");

      var res = await http.get(
        filePath,
        headers: {"Authorization": "Bearer ${Hive.box(userInfoBox).get(accessTokenKey)}"},
      );

      final AssetEntity? entity = await PhotoManager.editor.saveImage(
        res.bodyBytes,
        title: p.basename(asset.originalPath),
      );

      if (entity != null) {
        return true;
      }
    } catch (e) {
      debugPrint("Errir gettubg file $e");
      return false;
    }

    return false;
  }
}
