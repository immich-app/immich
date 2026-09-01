import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trash_sync.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/trash_sync.provider.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';

final actionServiceProvider = Provider<ActionService>(
  (ref) => ActionService(
    ref.watch(assetApiRepositoryProvider),
    ref.watch(driftProvider).remoteAssetRepository,
    ref.watch(driftProvider).localAssetRepository,
    ref.watch(assetMediaRepositoryProvider),
    ref.watch(trashSyncRepositoryProvider),
  ),
);

class ActionService {
  final AssetApiRepository _assetApiRepository;
  final RemoteAssetRepository _remoteAssetRepository;
  final LocalAssetRepository _localAssetRepository;
  final AssetMediaRepository _assetMediaRepository;
  final TrashSyncRepository _trashSyncRepository;

  const ActionService(
    this._assetApiRepository,
    this._remoteAssetRepository,
    this._localAssetRepository,
    this._assetMediaRepository,
    this._trashSyncRepository,
  );

  Future<int> emptyTrash(String userId) async {
    final count = await _assetApiRepository.emptyTrash();
    await _remoteAssetRepository.emptyTrash(userId);
    return count;
  }

  Future<int> restoreAllTrash(String userId) async {
    final count = await _assetApiRepository.restoreAllTrash();
    await _remoteAssetRepository.restoreAllTrash(userId);
    return count;
  }

  /// Resolves remote-trash review decisions for the given local asset ids.
  ///
  /// When [keep] is true the assets are marked as rejected and stay on device.
  /// Otherwise the still-reviewable assets are moved to the OS trash, their
  /// markers are approved and the local rows are removed.
  Future<({int displayCount, bool success})> resolveRemoteTrash(Iterable<String> assetIds, {required bool keep}) async {
    if (keep) {
      final rejectedCount = await _trashSyncRepository.rejectReviewAssets(assetIds);
      return (displayCount: rejectedCount, success: rejectedCount > 0);
    }

    final reviewableAssetIds = await _trashSyncRepository.getReviewableAssetIds(assetIds);
    if (reviewableAssetIds.isEmpty) {
      return const (displayCount: 0, success: false);
    }

    final trashedAssetIds = await _assetMediaRepository.deleteAll(reviewableAssetIds);
    if (trashedAssetIds.isEmpty) {
      return const (displayCount: 0, success: false);
    }

    await _trashSyncRepository.markReviewAssetsApproved(trashedAssetIds);
    await _localAssetRepository.deleteAssets(trashedAssetIds);
    return (displayCount: trashedAssetIds.length, success: true);
  }

  Future<bool> updateDescription(String assetId, String description) async {
    // update remote first, then local to ensure consistency
    await _assetApiRepository.updateDescription(assetId, description);
    await _remoteAssetRepository.updateDescription(assetId, description);

    return true;
  }

  Future<bool> updateRating(String assetId, int? rating) async {
    // update remote first, then local to ensure consistency
    await _assetApiRepository.updateRating(assetId, rating);
    await _remoteAssetRepository.updateRating(assetId, rating);

    return true;
  }
}
