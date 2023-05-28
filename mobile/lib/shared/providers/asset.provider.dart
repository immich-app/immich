import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/services/album.service.dart';
import 'package:immich_mobile/shared/models/exif_info.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/shared/services/asset.service.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/services/sync.service.dart';
import 'package:immich_mobile/shared/services/user.service.dart';
import 'package:immich_mobile/utils/db.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:photo_manager/photo_manager.dart';

class AssetNotifier extends StateNotifier<bool> {
  final AssetService _assetService;
  final AlbumService _albumService;
  final UserService _userService;
  final SyncService _syncService;
  final Isar _db;
  final log = Logger('AssetNotifier');
  bool _getAllAssetInProgress = false;
  bool _deleteInProgress = false;

  AssetNotifier(
    this._assetService,
    this._albumService,
    this._userService,
    this._syncService,
    this._db,
  ) : super(false);

  Future<void> getAllAsset({bool clear = false}) async {
    if (_getAllAssetInProgress || _deleteInProgress) {
      // guard against multiple calls to this method while it's still working
      return;
    }
    final stopwatch = Stopwatch()..start();
    try {
      _getAllAssetInProgress = true;
      state = true;
      if (clear) {
        await clearAssetsAndAlbums(_db);
        log.info("Manual refresh requested, cleared assets and albums from db");
      }
      await _userService.refreshUsers();
      final bool newRemote = await _assetService.refreshRemoteAssets();
      final bool newLocal = await _albumService.refreshDeviceAlbums();
      debugPrint("newRemote: $newRemote, newLocal: $newLocal");
      final List<User> partners =
          await _db.users.filter().isPartnerSharedWithEqualTo(true).findAll();
      for (User u in partners) {
        await _assetService.refreshRemoteAssets(u);
      }
      log.info("Load assets: ${stopwatch.elapsedMilliseconds}ms");
    } finally {
      _getAllAssetInProgress = false;
      state = false;
    }
  }

  Future<void> clearAllAsset() {
    return clearAssetsAndAlbums(_db);
  }

  Future<void> onNewAssetUploaded(Asset newAsset) async {
    // eTag on device is not valid after partially modifying the assets
    Store.delete(StoreKey.assetETag);
    await _syncService.syncNewAssetToDb(newAsset);
  }

  Future<void> deleteAssets(Set<Asset> deleteAssets) async {
    _deleteInProgress = true;
    state = true;
    try {
      final localDeleted = await _deleteLocalAssets(deleteAssets);
      final remoteDeleted = await _deleteRemoteAssets(deleteAssets);
      if (localDeleted.isNotEmpty || remoteDeleted.isNotEmpty) {
        final dbIds = deleteAssets.map((e) => e.id).toList();
        await _db.writeTxn(() async {
          await _db.exifInfos.deleteAll(dbIds);
          await _db.assets.deleteAll(dbIds);
        });
      }
    } finally {
      _deleteInProgress = false;
      state = false;
    }
  }

  Future<List<String>> _deleteLocalAssets(Set<Asset> assetsToDelete) async {
    final List<String> local =
        assetsToDelete.where((a) => a.isLocal).map((a) => a.localId!).toList();
    // Delete asset from device
    if (local.isNotEmpty) {
      try {
        return await PhotoManager.editor.deleteWithIds(local);
      } catch (e, stack) {
        log.severe("Failed to delete asset from device", e, stack);
      }
    }
    return [];
  }

  Future<Iterable<String>> _deleteRemoteAssets(
    Set<Asset> assetsToDelete,
  ) async {
    final Iterable<Asset> remote = assetsToDelete.where((e) => e.isRemote);
    final List<DeleteAssetResponseDto> deleteAssetResult =
        await _assetService.deleteAssets(remote) ?? [];
    return deleteAssetResult
        .where((a) => a.status == DeleteAssetStatus.SUCCESS)
        .map((a) => a.id);
  }

  Future<void> toggleFavorite(List<Asset> assets, bool status) async {
    final newAssets = await _assetService.changeFavoriteStatus(assets, status);
    for (Asset? newAsset in newAssets) {
      if (newAsset == null) {
        log.severe("Change favorite status failed for asset");
        continue;
      }
    }
  }

  Future<void> toggleArchive(List<Asset> assets, bool status) async {
    final newAssets = await _assetService.changeArchiveStatus(assets, status);
    int i = 0;
    for (Asset oldAsset in assets) {
      final newAsset = newAssets[i++];
      if (newAsset == null) {
        log.severe("Change archive status failed for asset ${oldAsset.id}");
        continue;
      }
    }
  }
}

final assetProvider = StateNotifierProvider<AssetNotifier, bool>((ref) {
  return AssetNotifier(
    ref.watch(assetServiceProvider),
    ref.watch(albumServiceProvider),
    ref.watch(userServiceProvider),
    ref.watch(syncServiceProvider),
    ref.watch(dbProvider),
  );
});

final assetDetailProvider =
    StreamProvider.autoDispose.family<Asset, Asset>((ref, asset) async* {
  yield await ref.watch(assetServiceProvider).loadExif(asset);
  final db = ref.watch(dbProvider);
  await for (final a in db.assets.watchObject(asset.id)) {
    if (a != null) yield await ref.watch(assetServiceProvider).loadExif(a);
  }
});

final assetsProvider =
    StreamProvider.family<RenderList, int?>((ref, userId) async* {
  if (userId == null) return;
  final query = ref
      .watch(dbProvider)
      .assets
      .filter()
      .ownerIdEqualTo(userId)
      .isArchivedEqualTo(false)
      .sortByFileCreatedAtDesc();
  final settings = ref.watch(appSettingsServiceProvider);
  final groupBy =
      GroupAssetsBy.values[settings.getSetting(AppSettingsEnum.groupAssetsBy)];
  yield await RenderList.fromQuery(query, groupBy);
  await for (final _ in query.watchLazy()) {
    yield await RenderList.fromQuery(query, groupBy);
  }
});

final remoteAssetsProvider =
    StreamProvider.family<RenderList, int?>((ref, userId) async* {
  if (userId == null) return;
  final query = ref
      .watch(dbProvider)
      .assets
      .where()
      .remoteIdIsNotNull()
      .filter()
      .ownerIdEqualTo(userId)
      .sortByFileCreatedAt();
  final settings = ref.watch(appSettingsServiceProvider);
  final groupBy =
      GroupAssetsBy.values[settings.getSetting(AppSettingsEnum.groupAssetsBy)];
  yield await RenderList.fromQuery(query, groupBy);
  await for (final _ in query.watchLazy()) {
    yield await RenderList.fromQuery(query, groupBy);
  }
});
