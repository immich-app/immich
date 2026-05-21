import 'package:collection/collection.dart';
import 'package:immich_mobile/domain/models/asset/remote_deleted_local_asset.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trash_sync.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trashed_local_asset.repository.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:logging/logging.dart';

typedef RemoteAssetTrashState = ({String id, DateTime? deletedAt});

enum TrashSyncMode { off, autoSync, review }

class TrashSyncService {
  final Logger _logger = Logger('TrashSyncService');

  final DriftLocalAssetRepository _localAssetRepository;
  final DriftTrashedLocalAssetRepository _trashedLocalAssetRepository;
  final DriftTrashSyncRepository _trashSyncRepository;
  final AssetMediaRepository _assetMediaRepository;

  TrashSyncService({
    required DriftLocalAssetRepository localAssetRepository,
    required DriftTrashedLocalAssetRepository trashedLocalAssetRepository,
    required DriftTrashSyncRepository trashSyncRepository,
    required AssetMediaRepository assetMediaRepository,
  }) : _localAssetRepository = localAssetRepository,
       _trashedLocalAssetRepository = trashedLocalAssetRepository,
       _trashSyncRepository = trashSyncRepository,
       _assetMediaRepository = assetMediaRepository;

  TrashSyncMode get mode {
    if (Store.get(StoreKey.reviewOutOfSyncChangesAndroid, false)) {
      return TrashSyncMode.review;
    }
    if (Store.get(StoreKey.manageLocalMediaAndroid, false)) {
      return TrashSyncMode.autoSync;
    }
    return TrashSyncMode.off;
  }

  Stream<int> watchPendingApprovalAssetCount() => _trashSyncRepository.watchPendingApprovalAssetCount();

  Stream<bool> watchIsAssetApprovalPending(String checksum) =>
      _trashSyncRepository.watchIsAssetApprovalPending(checksum);

  Future<void> handleRemoteAssetTrashState(Iterable<RemoteAssetTrashState> remoteSyncAssets) async {
    final remoteDeletedAtByRemoteId = Map<String, DateTime>.fromEntries(
      remoteSyncAssets.where((e) => e.deletedAt != null).map((e) => MapEntry(e.id, e.deletedAt!)),
    );
    await handleRemoteDeletedOrTrashed(remoteDeletedAtByRemoteId);
    await _deleteOutdatedTrashSyncEntries(remoteSyncAssets.where((e) => e.deletedAt == null).map((e) => e.id));

    if (mode == TrashSyncMode.autoSync || mode == TrashSyncMode.review) {
      await applyRemoteRestoreToLocal();
    }
  }

  Future<void> handleRemoteDeletedOrTrashed(Map<String, DateTime> remoteDeletedAtByRemoteId) async {
    if (remoteDeletedAtByRemoteId.isEmpty) {
      return Future.value();
    } else {
      final remoteTrashCandidatesByAlbum = await _localAssetRepository.getRemoteTrashCandidatesByAlbum(
        remoteDeletedAtByRemoteId,
      );
      if (remoteTrashCandidatesByAlbum.isNotEmpty) {
        final unresolvedCandidatesByAlbum = await _tryAutoTrashLocalAssets(remoteTrashCandidatesByAlbum);

        await _upsertTrashSyncCandidates(unresolvedCandidatesByAlbum);
      } else {
        _logger.info("No assets found in backup-enabled albums for remote assets: $remoteDeletedAtByRemoteId");
      }
    }
  }

  Future<void> applyRemoteRestoreToLocal() async {
    final assetsToRestore = await _trashedLocalAssetRepository.getToRestore();
    if (assetsToRestore.isEmpty) {
      _logger.fine("No remote assets found for restoration");
      return;
    }
    if (!await _hasManageMediaPermission("restore from trash")) {
      return;
    }
    final restoredIds = await _assetMediaRepository.restoreAssetsFromTrash(assetsToRestore);
    await _trashedLocalAssetRepository.applyRestoredAssets(restoredIds);
  }

  Future<void> _upsertTrashSyncCandidates(Map<String, Iterable<RemoteDeletedLocalAsset>> candidatesByAlbum) async {
    final candidates = candidatesByAlbum.values.flattened;
    final reviewCandidates = candidates.where((la) => la.asset.checksum?.isNotEmpty == true);
    if (reviewCandidates.isEmpty) {
      return;
    }
    _logger.info(
      "Apply remote trash action to review for: ${reviewCandidates.map((e) => 'id:${e.asset.id}, name:${e.asset.name}').join('*')}",
    );
    await _trashSyncRepository.upsertReviewCandidates(reviewCandidates);
  }

  Future<Map<String, Iterable<RemoteDeletedLocalAsset>>> _tryAutoTrashLocalAssets(
    Map<String, Iterable<RemoteDeletedLocalAsset>> candidatesByAlbum,
  ) async {
    if (!await _canMoveLocalMediaToTrash()) {
      return candidatesByAlbum;
    }

    final moveCandidates = candidatesByAlbum.entries.expand(
      (entry) => entry.value.map((candidate) => (albumId: entry.key, candidate: candidate)),
    );
    if (moveCandidates.isEmpty) {
      return candidatesByAlbum;
    }

    final localIds = moveCandidates.map((item) => item.candidate.asset.id).toList();
    _logger.info("Moving to trash ${localIds.join(", ")} assets");
    final movedIds = await _assetMediaRepository.deleteAll(localIds);
    if (movedIds.isEmpty) {
      return candidatesByAlbum;
    }

    final movedIdSet = movedIds.toSet();
    final candidatesByMoveResult = groupBy(moveCandidates, (item) => movedIdSet.contains(item.candidate.asset.id));
    final resolvedMoveCandidates = candidatesByMoveResult[true] ?? [];
    final unresolvedCandidates = candidatesByMoveResult[false] ?? [];

    final movedByAlbum = groupBy(
      resolvedMoveCandidates,
      (item) => item.albumId,
    ).map((albumId, items) => MapEntry(albumId, items.map((item) => item.candidate)));
    await _trashedLocalAssetRepository.trashLocalAssets(movedByAlbum);
    await _trashSyncRepository.deleteResolved(
      resolvedMoveCandidates
          .map((item) => item.candidate.asset.checksum)
          .nonNulls
          .where((checksum) => checksum.isNotEmpty),
    );

    return groupBy(
      unresolvedCandidates,
      (item) => item.albumId,
    ).map((albumId, items) => MapEntry(albumId, items.map((item) => item.candidate)));
  }

  Future<void> _deleteOutdatedTrashSyncEntries(Iterable<String> remoteIds) async {
    final result = await _trashSyncRepository.deleteOutdated(remoteIds);
    if (result > 0) {
      _logger.info("syncTrashedAssets, outdated deleted: $result");
    }
  }

  Future<bool> _hasManageMediaPermission(String logContext) async {
    final hasPermission = await _assetMediaRepository.hasManageMediaPermission();
    if (!hasPermission) {
      _logger.warning("sync $logContext cannot proceed because MANAGE_MEDIA permission is missing");
    }

    return hasPermission;
  }

  Future<bool> _canMoveLocalMediaToTrash() async =>
      mode == TrashSyncMode.autoSync && await _hasManageMediaPermission("move to trash");
}
