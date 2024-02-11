import 'dart:io';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:logging/logging.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'api.service.dart';

final shareServiceProvider =
    Provider((ref) => ShareService(ref.watch(apiServiceProvider)));

class ShareService {
  final ApiService _apiService;
  final Logger _log = Logger("ShareService");

  ShareService(this._apiService);

  Future<bool> shareAsset(Asset asset) async {
    return await shareAssets([asset]);
  }

  Future<bool> shareAssets(List<Asset> assets) async {
    try {
      final downloadedXFiles = <XFile>[];

      for (var asset in assets) {
        if (asset.isRemote) {
          final tempDir = await getTemporaryDirectory();
          final fileName = asset.fileName;
          final tempFile = await File('${tempDir.path}/$fileName').create();
          final res = await _apiService.downloadApi
              .downloadFileWithHttpInfo(asset.remoteId!);

          if (res.statusCode != 200) {
            _log.severe(
              "Asset download failed with status - ${res.statusCode} and response - ${res.body}",
            );
            continue;
          }

          tempFile.writeAsBytesSync(res.bodyBytes);
          downloadedXFiles.add(XFile(tempFile.path));
        } else {
          File? f = await asset.local!.file;
          downloadedXFiles.add(XFile(f!.path));
        }
      }

      if (downloadedXFiles.isEmpty) {
        _log.warning("No asset can be retrieved for share");
        return false;
      }

      if (downloadedXFiles.length != assets.length) {
        _log.warning(
          "Partial share - Requested: ${assets.length}, Sharing: ${downloadedXFiles.length}",
        );
      }

      Share.shareXFiles(
        downloadedXFiles,
        sharePositionOrigin: Rect.zero,
      );
      return true;
    } catch (error) {
      _log.severe("Share failed with error $error");
    }
    return false;
  }
}
