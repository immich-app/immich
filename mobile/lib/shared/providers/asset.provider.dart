import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/services/album.service.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/exif_info.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/shared/services/asset.service.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:collection/collection.dart';
import 'package:intl/intl.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:photo_manager/photo_manager.dart';

class AssetsState {
  final List<Asset> allAssets;
  final RenderList? renderList;

  AssetsState(this.allAssets, {this.renderList});

  Future<AssetsState> withRenderDataStructure(
    AssetGridLayoutParameters layout,
  ) async {
    return AssetsState(
      allAssets,
      renderList: await RenderList.fromAssets(
        allAssets,
        layout,
      ),
    );
  }

  AssetsState withAdditionalAssets(List<Asset> toAdd) {
    return AssetsState([...allAssets, ...toAdd]);
  }

  static AssetsState fromAssetList(List<Asset> assets) {
    return AssetsState(assets);
  }

  static AssetsState empty() {
    return AssetsState([]);
  }
}

class AssetNotifier extends StateNotifier<AssetsState> {
  final AssetService _assetService;
  final AppSettingsService _settingsService;
  final AlbumService _albumService;
  final Isar _db;
  final log = Logger('AssetNotifier');
  bool _getAllAssetInProgress = false;
  bool _deleteInProgress = false;

  AssetNotifier(
    this._assetService,
    this._settingsService,
    this._albumService,
    this._db,
  ) : super(AssetsState.fromAssetList([]));

  Future<void> _updateAssetsState(List<Asset> newAssetList) async {
    final layout = AssetGridLayoutParameters(
      _settingsService.getSetting(AppSettingsEnum.tilesPerRow),
      _settingsService.getSetting(AppSettingsEnum.dynamicLayout),
      GroupAssetsBy
          .values[_settingsService.getSetting(AppSettingsEnum.groupAssetsBy)],
    );
    state = await AssetsState.fromAssetList(newAssetList)
        .withRenderDataStructure(layout);
  }

  // Just a little helper to trigger a rebuild of the state object
  Future<void> rebuildAssetGridDataStructure() async {
    await _updateAssetsState(state.allAssets);
  }

  getAllAsset() async {
    if (_getAllAssetInProgress || _deleteInProgress) {
      // guard against multiple calls to this method while it's still working
      return;
    }
    final stopwatch = Stopwatch();
    try {
      _getAllAssetInProgress = true;
      final User me = Store.get(StoreKey.currentUser);
      final int cachedCount =
          await _db.assets.filter().ownerIdEqualTo(me.isarId).count();
      stopwatch.start();
      if (cachedCount > 0 && cachedCount != state.allAssets.length) {
        await _updateAssetsState(await _getUserAssets(me.isarId));
        log.info(
          "Reading assets ${state.allAssets.length} from DB: ${stopwatch.elapsedMilliseconds}ms",
        );
        stopwatch.reset();
      }
      final bool newRemote = await _assetService.refreshRemoteAssets();
      final bool newLocal = await _albumService.refreshDeviceAlbums();
      log.info("Load assets: ${stopwatch.elapsedMilliseconds}ms");
      stopwatch.reset();
      if (!newRemote &&
          !newLocal &&
          state.allAssets.length ==
              await _db.assets.filter().ownerIdEqualTo(me.isarId).count()) {
        log.info("state is already up-to-date");
        return;
      }
      stopwatch.reset();
      final assets = await _getUserAssets(me.isarId);
      if (!const ListEquality().equals(assets, state.allAssets)) {
        log.info("setting new asset state");
        await _updateAssetsState(assets);
      }
    } finally {
      _getAllAssetInProgress = false;
    }
  }

  Future<List<Asset>> _getUserAssets(int userId) => _db.assets
      .filter()
      .ownerIdEqualTo(userId)
      .sortByFileCreatedAtDesc()
      .findAll();

  Future<void> clearAllAsset() {
    state = AssetsState.empty();
    return _db.writeTxn(() async {
      await _db.assets.clear();
      await _db.exifInfos.clear();
      await _db.albums.clear();
    });
  }

  Future<void> onNewAssetUploaded(Asset newAsset) async {
    final int i = state.allAssets.indexWhere(
      (a) =>
          a.isRemote ||
          (a.localId == newAsset.localId && a.deviceId == newAsset.deviceId),
    );

    if (i == -1 ||
        state.allAssets[i].localId != newAsset.localId ||
        state.allAssets[i].deviceId != newAsset.deviceId) {
      await _updateAssetsState([...state.allAssets, newAsset]);
    } else {
      // unify local/remote assets by replacing the
      // local-only asset in the DB with a local&remote asset
      final Asset? inDb = await _db.assets
          .where()
          .localIdDeviceIdEqualTo(newAsset.localId, newAsset.deviceId)
          .findFirst();
      if (inDb != null) {
        newAsset.id = inDb.id;
        newAsset.isLocal = inDb.isLocal;
      }

      // order is important to keep all local-only assets at the beginning!
      await _updateAssetsState([
        ...state.allAssets.slice(0, i),
        ...state.allAssets.slice(i + 1),
        newAsset,
      ]);
    }
    try {
      await _db.writeTxn(() => newAsset.put(_db));
    } on IsarError catch (e) {
      debugPrint(e.toString());
    }
  }

  Future<void> deleteAssets(Set<Asset> deleteAssets) async {
    _deleteInProgress = true;
    try {
      _updateAssetsState(
        state.allAssets.whereNot(deleteAssets.contains).toList(),
      );
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
    }
  }

  Future<List<String>> _deleteLocalAssets(Set<Asset> assetsToDelete) async {
    final int deviceId = Store.get(StoreKey.deviceIdHash);
    final List<String> local = [];
    // Delete asset from device
    for (final Asset asset in assetsToDelete) {
      if (asset.isLocal) {
        local.add(asset.localId);
      } else if (asset.deviceId == deviceId) {
        // Delete asset on device if it is still present
        var localAsset = await AssetEntity.fromId(asset.localId);
        if (localAsset != null) {
          local.add(localAsset.id);
        }
      }
    }
    if (local.isNotEmpty) {
      try {
        await PhotoManager.editor.deleteWithIds(local);
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

  Future<bool> toggleFavorite(Asset asset, bool status) async {
    final newAsset = await _assetService.changeFavoriteStatus(asset, status);

    if (newAsset == null) {
      log.severe("Change favorite status failed for asset ${asset.id}");
      return asset.isFavorite;
    }

    final index = state.allAssets.indexWhere((a) => asset.id == a.id);
    if (index > 0) {
      state.allAssets[index] = newAsset;
      _updateAssetsState(state.allAssets);
    }

    return newAsset.isFavorite;
  }
}

final assetProvider = StateNotifierProvider<AssetNotifier, AssetsState>((ref) {
  return AssetNotifier(
    ref.watch(assetServiceProvider),
    ref.watch(appSettingsServiceProvider),
    ref.watch(albumServiceProvider),
    ref.watch(dbProvider),
  );
});

final assetGroupByMonthYearProvider = StateProvider((ref) {
  // TODO: remove `where` once temporary workaround is no longer needed (to only
  // allow remote assets to be added to album). Keep `toList()` as to NOT sort
  // the original list/state
  final assets =
      ref.watch(assetProvider).allAssets.where((e) => e.isRemote).toList();

  assets.sortByCompare<DateTime>(
    (e) => e.fileCreatedAt,
    (a, b) => b.compareTo(a),
  );

  return assets.groupListsBy(
    (element) => DateFormat('MMMM, y').format(element.fileCreatedAt.toLocal()),
  );
});
