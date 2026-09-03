import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trash_sync.repository.dart';
import 'package:immich_mobile/platform/asset_media_api.g.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:immich_mobile/repositories/permission.repository.dart';
import 'package:logging/logging.dart';

class TrashSyncService {
  final TrashSyncRepository _repo;
  final LocalAssetRepository _localAssets;
  final AssetMediaApi _assetMediaApi;
  final AssetMediaRepository _assetMediaRepository;
  final DevicePermissionRepository _permission;
  final SettingsRepository _settings;
  final Logger _log = Logger('TrashSyncService');

  TrashSyncService({
    required this._repo,
    required this._localAssets,
    required this._assetMediaApi,
    required this._assetMediaRepository,
    required this._permission,
    required this._settings,
  });

  Future<void> reconcile() async {
    try {
      await _prune();

      switch (_settings.appConfig.trashSyncMode) {
        case TrashSyncMode.off:
          return;
        case TrashSyncMode.autoSync:
          if (!await _canApplyToOsTrash()) {
            return;
          }
          await _recordAuto();
          await _act();
        case TrashSyncMode.review:
          await _recordReview();
          if (CurrentPlatform.isAndroid && await _canApplyToOsTrash()) {
            await _restoreAssets();
            await _reconcileWithOSTrash();
          }
      }
    } catch (error, stack) {
      _log.severe("Trash reconcile failed", error, stack);
    }
  }

  Future<int> keepReviewAssets(Iterable<String> assetIds) => _repo.rejectReviewAssets(assetIds);

  Future<int> trashReviewAssets(Iterable<String> assetIds) async {
    final reviewableAssetIds = await _repo.getReviewableAssetIds(assetIds);
    if (reviewableAssetIds.isEmpty) {
      return 0;
    }

    final Set<String> trashedAssetIds;
    if (CurrentPlatform.isAndroid) {
      final results = await _assetMediaApi.trash(reviewableAssetIds);
      trashedAssetIds = results.whereStatusIn(const {.done, .alreadyInState});
      final missingAssetIds = results.whereStatusIn(const {.notFound});
      if (missingAssetIds.isNotEmpty) {
        await _repo.deleteMarkers(missingAssetIds);
      }
    } else {
      trashedAssetIds = (await _assetMediaRepository.deleteAll(reviewableAssetIds)).toSet();
    }

    if (trashedAssetIds.isNotEmpty) {
      await _repo.markReviewAssetsApproved(trashedAssetIds);
      await _localAssets.deleteAssets(trashedAssetIds.toList(growable: false));
    }

    return trashedAssetIds.length;
  }

  Future<void> _prune() async {
    await _repo.pruneStaleMarkers();
    await _repo.pruneDismissedMarkers();
    await _repo.prunePendingMarkers();
  }

  Future<void> _act() async {
    await _trashAssets();
    await _restoreAssets();
    await _reconcileWithOSTrash();
  }

  Future<void> _trashAssets() async {
    final pending = await _repo.getPendingAssetIds();
    if (pending.isEmpty) {
      return;
    }

    final results = await _assetMediaApi.trash(pending);
    final movedIds = results.whereStatusIn(const {.done, .alreadyInState});
    final removedIds = results.whereStatusIn(const {.notFound});

    if (movedIds.isNotEmpty) {
      await _repo.markTrashed(movedIds);
    }

    if (removedIds.isNotEmpty) {
      await _repo.deleteMarkers(removedIds);
    }

    _log.fine("Trashed ${movedIds.length}, dropped ${removedIds.length} out of ${pending.length} pending");
  }

  Future<void> _restoreAssets() async {
    final restorable = await _repo.getRestorableAssetIds();
    if (restorable.isEmpty) {
      return;
    }

    final results = await _assetMediaApi.restore(restorable);
    final restoredIds = results.whereStatusIn(const {.done, .alreadyInState});
    final goneIds = results.whereStatusIn(const {.notFound});

    if (restoredIds.isNotEmpty) {
      await _repo.markRestored(restoredIds);
    }

    if (goneIds.isNotEmpty) {
      await _repo.deleteMarkers(goneIds);
    }
  }

  Future<void> _reconcileWithOSTrash() async {
    final trashed = await _repo.getTrashedAssetIds();
    if (trashed.isEmpty) {
      return;
    }

    final stillTrashed = (await _assetMediaApi.trashedAmong(trashed)).toSet();
    final gone = trashed.where((id) => !stillTrashed.contains(id)).toList();
    if (gone.isNotEmpty) {
      await _repo.reconcileTrashed(gone);
    }
  }

  Future<bool> _canApplyToOsTrash() async {
    if (!CurrentPlatform.isAndroid) {
      return false;
    }

    final hasPermission = await _permission.hasManageMediaPermission();
    if (!hasPermission) {
      _log.fine("OS trash sync skipped: MANAGE_MEDIA permission not granted");
    }

    return hasPermission;
  }

  Future<void> _recordAuto() async {
    await _repo.recordSoftDeleteAssets();
    await _repo.recordHardDeletedAssets();
  }

  Future<void> _recordReview() async {
    await _repo.recordSoftDeleteReviewAssets();
    await _repo.recordHardDeletedReviewAssets();
  }
}

extension on Iterable<AssetMediaActionResult> {
  Set<String> whereStatusIn(Set<AssetMediaActionStatus> statuses) =>
      where((r) => statuses.contains(r.status)).map((r) => r.id).toSet();
}
