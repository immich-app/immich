import 'dart:io';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:path/path.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'api.service.dart';

final shareServiceProvider =
    Provider((ref) => ShareService(ref.watch(apiServiceProvider)));

class ShareService {
  final ApiService _apiService;

  ShareService(this._apiService);

  Future<void> shareAsset(Asset asset) async {
    await shareAssets([asset]);
  }

  Future<void> shareAssets(List<Asset> assets) async {
    final downloadedXFiles = assets.map<Future<XFile>>((asset) async {
      if (asset.isRemote) {
        final tempDir = await getTemporaryDirectory();
        final fileName = basename(asset.remote!.originalPath);
        final tempFile = await File('${tempDir.path}/$fileName').create();
        final res = await _apiService.assetApi.downloadFileWithHttpInfo(
          asset.remote!.id,
          isThumb: false,
          isWeb: false,
        );
        tempFile.writeAsBytesSync(res.bodyBytes);
        return XFile(tempFile.path);
      } else {
        File? f = await asset.local!.file;
        return XFile(f!.path);
      }
    });

    // ignore: deprecated_member_use
    Share.shareXFiles(
      await Future.wait(downloadedXFiles),
      sharePositionOrigin: Rect.zero,
    );
  }
}
