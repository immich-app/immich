import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/interfaces/asset.interface.dart';
import 'package:immich_mobile/interfaces/user.interface.dart';

import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/asset.repository.dart';
import 'package:immich_mobile/repositories/user.repository.dart';

import 'package:immich_mobile/services/api.service.dart';
import 'package:openapi/api.dart';

final trashServiceProvider = Provider<TrashService>((ref) {
  return TrashService(
    ref.watch(apiServiceProvider),
    ref.watch(assetRepositoryProvider),
    ref.watch(userRepositoryProvider),
  );
});

class TrashService {
  final ApiService _apiService;
  final IAssetRepository _assetRepository;
  final IUserRepository _userRepository;

  TrashService(this._apiService, this._assetRepository, this._userRepository);

  Future<void> restoreAssets(Iterable<Asset> assetList) async {
    final remoteAssets = assetList.where((a) => a.isRemote);
    await _apiService.trashApi.restoreAssets(
      BulkIdsDto(ids: remoteAssets.map((e) => e.remoteId!).toList()),
    );

    final updatedAssets = remoteAssets.map((asset) {
      asset.isTrashed = false;
      return asset;
    }).toList();

    await _assetRepository.updateAll(updatedAssets);
  }

  Future<void> emptyTrash() async {
    final user = await _userRepository.me();

    await _apiService.trashApi.emptyTrash();

    final trashedAssets = await _assetRepository.getTrashAssets(user.isarId);
    final ids = trashedAssets.map((e) => e.remoteId!).toList();

    await _assetRepository.transaction(() async {
      await _assetRepository.deleteAllByRemoteId(
        ids,
        state: AssetState.remote,
      );

      final merged = await _assetRepository.getAllByRemoteId(
        ids,
        state: AssetState.merged,
      );
      if (merged.isEmpty) {
        return;
      }

      for (final Asset asset in merged) {
        asset.remoteId = null;
        asset.isTrashed = false;
      }

      await _assetRepository.updateAll(merged);
    });
  }

  Future<void> restoreTrash() async {
    final user = await _userRepository.me();

    await _apiService.trashApi.restoreTrash();

    final trashedAssets = await _assetRepository.getTrashAssets(user.isarId);
    final updatedAssets = trashedAssets.map((asset) {
      asset.isTrashed = false;
      return asset;
    }).toList();

    await _assetRepository.updateAll(updatedAssets);
  }
}
