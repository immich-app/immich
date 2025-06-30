import 'package:flutter/foundation.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_asset.repository.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

final actionServiceProvider = Provider<ActionService>(
  (ref) => ActionService(
    ref.watch(assetApiRepositoryProvider),
    ref.watch(remoteAssetRepositoryProvider),
  ),
);

class ActionService {
  final AssetApiRepository _assetApiRepository;
  final RemoteAssetRepository _remoteAssetRepository;

  const ActionService(this._assetApiRepository, this._remoteAssetRepository);

  Future<void> favorite(List<String> remoteIds) async {
    try {
      await _assetApiRepository.updateFavorite(remoteIds, true);
      await _remoteAssetRepository.updateFavorite(remoteIds, true);
    } catch (e) {
      debugPrint('Error favoriting assets: $e');
    }
  }

  Future<void> unFavorite(List<String> remoteIds) async {
    try {
      await _assetApiRepository.updateFavorite(remoteIds, false);
      await _remoteAssetRepository.updateFavorite(remoteIds, false);
    } catch (e) {
      debugPrint('Error unfavoriting assets: $e');
    }
  }
}
