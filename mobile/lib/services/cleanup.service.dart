import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';

final cleanupServiceProvider = Provider<CleanupService>((ref) {
  return CleanupService(ref.watch(localAssetRepository), ref.watch(assetMediaRepositoryProvider));
});

class CleanupService {
  final DriftLocalAssetRepository _localAssetRepository;
  final AssetMediaRepository _assetMediaRepository;

  const CleanupService(this._localAssetRepository, this._assetMediaRepository);

  Future<List<LocalAsset>> getRemovalCandidates(
    String userId,
    DateTime cutoffDate, {
    AssetFilterType filterType = AssetFilterType.all,
    bool keepFavorites = true,
  }) {
    return _localAssetRepository.getRemovalCandidates(
      userId,
      cutoffDate,
      filterType: filterType,
      keepFavorites: keepFavorites,
    );
  }

  Future<int> deleteLocalAssets(List<String> localIds) async {
    if (localIds.isEmpty) {
      return 0;
    }

    final deletedIds = await _assetMediaRepository.deleteAll(localIds);
    if (deletedIds.isNotEmpty) {
      await _localAssetRepository.delete(deletedIds);
      return deletedIds.length;
    }

    return 0;
  }
}
