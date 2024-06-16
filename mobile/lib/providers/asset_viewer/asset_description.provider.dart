import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/services/asset_description.service.dart';
import 'package:immich_mobile/entities/asset.entity.dart';

class AssetDescriptionNotifier extends StateNotifier<String> {
  final AssetDescriptionService _service;
  final Asset _asset;

  AssetDescriptionNotifier(
    this._service,
    this._asset,
  ) : super('') {
    state = _asset.exifInfo?.description ?? '';
  }

  String get description => state;

  /// Sets the description to [description]
  /// Uses the service to set the asset value
  Future<void> setDescription(String description) async {
    state = description;

    final remoteAssetId = _asset.remoteId;
    final localExifId = _asset.exifInfo?.id;

    // Guard [remoteAssetId] and [localExifId] null
    if (remoteAssetId == null || localExifId == null) {
      return;
    }

    return _service.setDescription(description, remoteAssetId, localExifId);
  }
}

final assetDescriptionProvider = StateNotifierProvider.autoDispose
    .family<AssetDescriptionNotifier, String, Asset>(
  (ref, asset) => AssetDescriptionNotifier(
    // ref.watch(dbProvider),
    ref.watch(assetDescriptionServiceProvider),
    asset,
  ),
);
