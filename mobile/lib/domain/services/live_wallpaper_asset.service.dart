import 'dart:math';

import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';

class LiveWallpaperAssetService {
  LiveWallpaperAssetService(this._assetApiRepository);

  final AssetApiRepository _assetApiRepository;
  final Random _random = Random();

  Future<Asset?> pickRandomAsset(List<String> personIds, {String? excludeRemoteId}) async {
    if (personIds.isEmpty) {
      return null;
    }

    final assets = await _assetApiRepository.search(personIds: personIds);
    if (assets.isEmpty) {
      return null;
    }

    final filtered = assets.where((asset) {
      final matchesType = asset.type == AssetType.image;
      final matchesRemoteId = excludeRemoteId == null || asset.remoteId != excludeRemoteId;
      return matchesType && matchesRemoteId;
    }).toList();

    if (filtered.isEmpty) {
      return null;
    }

    return filtered[_random.nextInt(filtered.length)];
  }
}
