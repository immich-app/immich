import 'package:immich_mobile/domain/models/asset/remote_deleted_local_asset.model.dart';
import 'package:immich_mobile/domain/models/trash_sync.model.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trash_sync.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trashed_local_asset.repository.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:immich_mobile/repositories/permission.repository.dart';
import 'package:logging/logging.dart';

typedef RemoteAssetTrashState = ({String id, DateTime? deletedAt});

class TrashSyncService {
  final Logger _logger = Logger('TrashSyncService');

  final DriftTrashedLocalAssetRepository _trashedLocalAssetRepository;
  final DriftTrashSyncRepository _trashSyncRepository;
  final AssetMediaRepository _assetMediaRepository;
  final IPermissionRepository _permissionRepository;
  final SettingsRepository _settingsRepository;

  TrashSyncService({
    required this._trashedLocalAssetRepository,
    required this._trashSyncRepository,
    required this._assetMediaRepository,
    required this._permissionRepository,
    required this._settingsRepository,
  });

  TrashSyncMode get mode => _settingsRepository.appConfig.trashSync.mode;

  bool get isAutoRestoreEnabled =>
      CurrentPlatform.isAndroid && (mode == TrashSyncMode.autoSync || mode == TrashSyncMode.review);

  Stream<int> watchPendingApprovalAssetCount() => _trashSyncRepository.watchPendingApprovalAssetCount();

  Stream<bool> watchIsAssetApprovalPending(String checksum) =>
      _trashSyncRepository.watchIsAssetApprovalPending(checksum);

  Future<void> syncRemoteTrashState(Iterable<RemoteAssetTrashState> remoteSyncAssets) async {
    final remoteDeletedAtByRemoteId = Map<String, DateTime>.fromEntries(
      remoteSyncAssets.where((e) => e.deletedAt != null).map((e) => MapEntry(e.id, e.deletedAt!)),
    );
    await applyRemoteRemovalToLocal(remoteDeletedAtByRemoteId);
    final deletedOutdated = await _trashSyncRepository.deleteOutdated(
      remoteSyncAssets.where((e) => e.deletedAt == null).map((e) => e.id),
    );
    if (deletedOutdated > 0) {
      _logger.info("syncTrashedAssets, outdated deleted: $deletedOutdated");
    }

    if (isAutoRestoreEnabled) {
      await _applyRemoteRestoreToLocal();
    }
  }

  Future<void> applyRemoteRemovalToLocal(Map<String, DateTime> remoteDeletedAtByRemoteId) async {
    if (remoteDeletedAtByRemoteId.isEmpty) {
      return;
    }

    final remoteTrashCandidates = await _trashSyncRepository.getRemoteTrashCandidates(remoteDeletedAtByRemoteId);
    if (remoteTrashCandidates.isEmpty) {
      _logger.info("No local assets found for remote assets: $remoteDeletedAtByRemoteId");
      return;
    }

    final unresolvedCandidates = await _tryAutoTrashLocalAssets(remoteTrashCandidates);
    if (unresolvedCandidates.isNotEmpty) {
      _logger.info(
        "Apply remote trash action to review for: ${unresolvedCandidates.map((e) => 'id:${e.asset.id}, name:${e.asset.name}').join('*')}",
      );
      await _trashSyncRepository.upsertReviewCandidates(unresolvedCandidates);
    }
  }

  Future<void> _applyRemoteRestoreToLocal() async {
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

  Future<List<RemoteDeletedLocalAsset>> _tryAutoTrashLocalAssets(List<RemoteDeletedLocalAsset> candidates) async {
    if (!await _canMoveLocalMediaToTrash()) {
      return candidates;
    }

    final selectedMoveCandidates = await _trashSyncRepository.getSelectedBackupRemoteTrashMoveCandidates(candidates);
    if (selectedMoveCandidates.isEmpty) {
      return candidates;
    }

    final localIds = selectedMoveCandidates.map((item) => item.candidate.asset.id).toSet().toList();
    _logger.info("Moving to trash ${localIds.join(", ")} assets");
    final movedIds = await _assetMediaRepository.deleteAll(localIds);
    if (movedIds.isEmpty) {
      return candidates;
    }

    final movedIdLookup = movedIds.toSet();
    final resolvedMoveCandidates = selectedMoveCandidates
        .where((item) => movedIdLookup.contains(item.candidate.asset.id))
        .toList(growable: false);

    await _trashSyncRepository.transaction<void>(() async {
      await _trashedLocalAssetRepository.trashLocalAssets(resolvedMoveCandidates);
      await _trashSyncRepository.deleteResolved(resolvedMoveCandidates.map((item) => item.candidate.asset.checksum!));
    });

    return candidates.where((candidate) => !movedIdLookup.contains(candidate.asset.id)).toList(growable: false);
  }

  Future<bool> _hasManageMediaPermission(String logContext) async {
    final hasPermission = await _permissionRepository.hasManageMediaPermission();
    if (!hasPermission) {
      _logger.warning("sync $logContext cannot proceed because MANAGE_MEDIA permission is missing");
    }

    return hasPermission;
  }

  Future<bool> _canMoveLocalMediaToTrash() async =>
      CurrentPlatform.isAndroid && mode == TrashSyncMode.autoSync && await _hasManageMediaPermission("move to trash");
}
