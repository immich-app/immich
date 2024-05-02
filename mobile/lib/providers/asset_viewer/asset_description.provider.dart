import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/asset_viewer/services/asset_description.service.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/exif_info.entity.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:isar/isar.dart';

class AssetDescriptionNotifier extends StateNotifier<String> {
  final Isar _db;
  final AssetDescriptionService _service;
  final Asset _asset;

  AssetDescriptionNotifier(
    this._db,
    this._service,
    this._asset,
  ) : super('') {
    _fetchLocalDescription();
    _fetchRemoteDescription();
  }

  String get description => state;

  /// Fetches the local database value for description
  /// and writes it to [state]
  void _fetchLocalDescription() async {
    final localExifId = _asset.exifInfo?.id;

    // Guard [localExifId] null
    if (localExifId == null) {
      return;
    }

    // Subscribe to local changes
    final exifInfo = await _db.exifInfos.get(localExifId);

    // Guard
    if (exifInfo?.description == null) {
      return;
    }

    state = exifInfo!.description!;
  }

  /// Fetches the remote value and sets the state
  void _fetchRemoteDescription() async {
    final remoteAssetId = _asset.remoteId;
    final localExifId = _asset.exifInfo?.id;

    // Guard [remoteAssetId] and [localExifId] null
    if (remoteAssetId == null || localExifId == null) {
      return;
    }

    // Reads the latest from the remote and writes it to DB in the service
    final latest = await _service.readLatest(remoteAssetId, localExifId);

    state = latest;
  }

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
    ref.watch(dbProvider),
    ref.watch(assetDescriptionServiceProvider),
    asset,
  ),
);
