import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trash_sync.repository.dart';
import 'package:immich_mobile/platform/asset_media_api.g.dart';
import 'package:immich_mobile/repositories/permission.repository.dart';
import 'package:logging/logging.dart';

class TrashSyncService {
  final DriftTrashSyncRepository _repo;
  final AssetMediaApi _assetMediaApi;
  final PermissionRepository _permission;
  final SettingsRepository _settings;
  final Logger _log = Logger('TrashSyncService');

  TrashSyncService({
    required this._repo,
    required this._assetMediaApi,
    required this._permission,
    required this._settings,
  });

  Future<void> reconcile() async {
    try {
      await _prune();

      if (!_settings.appConfig.trashSyncEnabled || !await _canApplyToOsTrash()) {
        return;
      }

      await _record();
      await _act();
    } catch (error, stack) {
      _log.severe("Trash reconcile failed", error, stack);
    }
  }

  Future<void> _prune() async {
    await _repo.pruneStaleMarkers();
    await _repo.pruneDismissedMarkers();
    await _repo.prunePendingMarkers();
  }

  Future<void> _record() async {
    await _repo.recordSoftDeleteAssets();
    await _repo.recordHardDeletedAssets();
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
}

extension on Iterable<AssetMediaActionResult> {
  Set<String> whereStatusIn(Set<AssetMediaActionStatus> statuses) =>
      where((r) => statuses.contains(r.status)).map((r) => r.id).toSet();
}
