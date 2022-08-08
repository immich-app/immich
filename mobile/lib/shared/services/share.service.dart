
import 'dart:io';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:openapi/api.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:path/path.dart' as p;
import 'api.service.dart';

final shareServiceProvider =
  Provider((ref) => ShareService(ref.watch(apiServiceProvider)));

class ShareService {
  final ApiService _apiService;

  ShareService(this._apiService);

  Future<void> shareAsset(AssetResponseDto asset) async {
    await shareAssets([asset]);
  }

  Future<void> shareAssets(List<AssetResponseDto> assets) async {
    final downloadedFilePaths = assets.map((asset) async {
      final res = await _apiService.assetApi.downloadFileWithHttpInfo(
        asset.deviceAssetId,
        asset.deviceId,
        isThumb: false,
        isWeb: false,
      );

      final fileName = p.basename(asset.originalPath);

      final tempDir = await getTemporaryDirectory();
      final tempFile = await File('${tempDir.path}/$fileName').create();
      tempFile.writeAsBytesSync(res.bodyBytes);

      return tempFile.path;
    });

    Share.shareFiles(await Future.wait(downloadedFilePaths));
  }

}
