import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
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

  Future<RemovalCandidatesResult> getRemovalCandidates(
    String userId,
    DateTime cutoffDate, {
    AssetKeepType keepMediaType = AssetKeepType.none,
    bool keepFavorites = true,
    Set<String> keepAlbumIds = const {},
  }) {
    return _localAssetRepository.getRemovalCandidates(
      userId,
      cutoffDate,
      keepMediaType: keepMediaType,
      keepFavorites: keepFavorites,
      keepAlbumIds: keepAlbumIds,
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

  /// Returns album IDs that should be kept by default (e.g., messaging app albums)
  Set<String> getDefaultKeepAlbumIds(List<(String id, String name)> albums) {
    const messagingApps = ['whatsapp', 'telegram', 'signal', 'messenger', 'viber', 'wechat', 'line'];

    final toKeep = <String>{};
    for (final (id, name) in albums) {
      final albumName = name.toLowerCase();
      if (messagingApps.any((app) => albumName.contains(app))) {
        toKeep.add(id);
      }
    }
    return toKeep;
  }
}
