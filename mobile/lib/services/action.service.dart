import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
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
    await _assetApiRepository.updateFavorite(remoteIds, true);
    await _remoteAssetRepository.updateFavorite(remoteIds, true);
  }

  Future<void> unFavorite(List<String> remoteIds) async {
    await _assetApiRepository.updateFavorite(remoteIds, false);
    await _remoteAssetRepository.updateFavorite(remoteIds, false);
  }

  Future<void> archive(List<String> remoteIds) async {
    await _assetApiRepository.updateVisibility(
      remoteIds,
      AssetVisibilityEnum.archive,
    );
    await _remoteAssetRepository.updateVisibility(
      remoteIds,
      AssetVisibility.archive,
    );
  }

  Future<void> unArchive(List<String> remoteIds) async {
    await _assetApiRepository.updateVisibility(
      remoteIds,
      AssetVisibilityEnum.timeline,
    );
    await _remoteAssetRepository.updateVisibility(
      remoteIds,
      AssetVisibility.timeline,
    );
  }

  Future<void> moveToLockFolder(List<String> remoteIds) async {
    try {
      await _assetApiRepository.updateVisibility(
        remoteIds,
        AssetVisibilityEnum.locked,
      );
      await _remoteAssetRepository.updateVisibility(
        remoteIds,
        AssetVisibility.locked,
      );
    } catch (e) {
      debugPrint('Error move to locked folder: $e');
    }
  }

  Future<void> removeFromLockFolder(List<String> remoteIds) async {
    try {
      await _assetApiRepository.updateVisibility(
        remoteIds,
        AssetVisibilityEnum.timeline,
      );
      await _remoteAssetRepository.updateVisibility(
        remoteIds,
        AssetVisibility.timeline,
      );
    } catch (e) {
      debugPrint('Error remove from locked folder: $e');
    }
  }
}
