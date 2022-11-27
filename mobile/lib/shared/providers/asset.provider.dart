import 'dart:collection';

import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/home/services/asset.service.dart';
import 'package:immich_mobile/modules/home/services/asset_cache.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/services/device_info.service.dart';
import 'package:collection/collection.dart';
import 'package:intl/intl.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:photo_manager/photo_manager.dart';

class AssetNotifier extends StateNotifier<List<Asset>> {
  final AssetService _assetService;
  final AssetCacheService _assetCacheService;
  final log = Logger('AssetNotifier');
  final DeviceInfoService _deviceInfoService = DeviceInfoService();
  bool _getAllAssetInProgress = false;
  bool _deleteInProgress = false;

  AssetNotifier(this._assetService, this._assetCacheService) : super([]);

  _cacheState() {
    _assetCacheService.put(state);
  }

  getAllAsset() async {
    if (_getAllAssetInProgress || _deleteInProgress) {
      // guard against multiple calls to this method while it's still working
      return;
    }
    final stopwatch = Stopwatch();
    try {
      _getAllAssetInProgress = true;
      final bool isCacheValid = await _assetCacheService.isValid();
      stopwatch.start();
      final localTask = _assetService.getLocalAssets(urgent: !isCacheValid);
      final remoteTask = _assetService.getRemoteAssets();
      if (isCacheValid && state.isEmpty) {
        state = await _assetCacheService.get();
        log.info(
          "Reading assets from cache: ${stopwatch.elapsedMilliseconds}ms",
        );
        stopwatch.reset();
      }

      int remoteBegin = state.indexWhere((a) => a.isRemote);
      remoteBegin = remoteBegin == -1 ? state.length : remoteBegin;
      final List<Asset> currentLocal = state.slice(0, remoteBegin);
      List<Asset>? newRemote = await remoteTask;
      List<Asset>? newLocal = await localTask;
      log.info("Load assets: ${stopwatch.elapsedMilliseconds}ms");
      stopwatch.reset();
      if (newRemote == null &&
          (newLocal == null || currentLocal.equals(newLocal))) {
        log.info("state is already up-to-date");
        return;
      }
      newRemote ??= state.slice(remoteBegin);
      newLocal ??= [];
      state = _combineLocalAndRemoteAssets(local: newLocal, remote: newRemote);
      log.info("Combining assets: ${stopwatch.elapsedMilliseconds}ms");
    } finally {
      _getAllAssetInProgress = false;
    }
    log.info("setting new asset state");

    stopwatch.reset();
    _cacheState();
    log.info("Store assets in cache: ${stopwatch.elapsedMilliseconds}ms");
  }

  List<Asset> _combineLocalAndRemoteAssets({
    required Iterable<Asset> local,
    required List<Asset> remote,
  }) {
    final List<Asset> assets = [];
    if (remote.isNotEmpty && local.isNotEmpty) {
      final String deviceId = Hive.box(userInfoBox).get(deviceIdKey);
      final Set<String> existingIds = remote
          .where((e) => e.deviceId == deviceId)
          .map((e) => e.deviceAssetId)
          .toSet();
      local = local.where((e) => !existingIds.contains(e.id));
    }
    assets.addAll(local);
    // the order (first all local, then remote assets) is important!
    assets.addAll(remote);
    return assets;
  }

  clearAllAsset() {
    state = [];
    _cacheState();
  }

  onNewAssetUploaded(AssetResponseDto newAsset) {
    final int i = state.indexWhere(
      (a) =>
          a.isRemote ||
          (a.id == newAsset.deviceAssetId && a.deviceId == newAsset.deviceId),
    );

    if (i == -1 || state[i].deviceAssetId != newAsset.deviceAssetId) {
      state = [...state, Asset.remote(newAsset)];
    } else {
      // order is important to keep all local-only assets at the beginning!
      state = [
        ...state.slice(0, i),
        ...state.slice(i + 1),
        Asset.remote(newAsset),
      ];
      // TODO here is a place to unify local/remote assets by replacing the
      // local-only asset in the state with a local&remote asset
    }
    _cacheState();
  }

  deleteAssets(Set<Asset> deleteAssets) async {
    _deleteInProgress = true;
    try {
      final localDeleted = await _deleteLocalAssets(deleteAssets);
      final remoteDeleted = await _deleteRemoteAssets(deleteAssets);
      final Set<String> deleted = HashSet();
      deleted.addAll(localDeleted);
      deleted.addAll(remoteDeleted);
      if (deleted.isNotEmpty) {
        state = state.where((a) => !deleted.contains(a.id)).toList();
        _cacheState();
      }
    } finally {
      _deleteInProgress = false;
    }
  }

  Future<List<String>> _deleteLocalAssets(Set<Asset> assetsToDelete) async {
    var deviceInfo = await _deviceInfoService.getDeviceInfo();
    var deviceId = deviceInfo["deviceId"];
    final List<String> local = [];
    // Delete asset from device
    for (final Asset asset in assetsToDelete) {
      if (asset.isLocal) {
        local.add(asset.id);
      } else if (asset.deviceId == deviceId) {
        // Delete asset on device if it is still present
        var localAsset = await AssetEntity.fromId(asset.deviceAssetId);
        if (localAsset != null) {
          local.add(localAsset.id);
        }
      }
    }
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
    final Iterable<AssetResponseDto> remote =
        assetsToDelete.where((e) => e.isRemote).map((e) => e.remote!);
    final List<DeleteAssetResponseDto> deleteAssetResult =
        await _assetService.deleteAssets(remote) ?? [];
    return deleteAssetResult
        .where((a) => a.status == DeleteAssetStatus.SUCCESS)
        .map((a) => a.id);
  }
}

final assetProvider = StateNotifierProvider<AssetNotifier, List<Asset>>((ref) {
  return AssetNotifier(
    ref.watch(assetServiceProvider),
    ref.watch(assetCacheServiceProvider),
  );
});

final assetGroupByDateTimeProvider = StateProvider((ref) {
  final assets = ref.watch(assetProvider).toList();
  // `toList()` ist needed to make a copy as to NOT sort the original list/state

  assets.sortByCompare<DateTime>(
    (e) => e.createdAt,
    (a, b) => b.compareTo(a),
  );
  return assets.groupListsBy(
    (element) => DateFormat('y-MM-dd').format(element.createdAt.toLocal()),
  );
});

final assetGroupByMonthYearProvider = StateProvider((ref) {
  // TODO: remove `where` once temporary workaround is no longer needed (to only
  // allow remote assets to be added to album). Keep `toList()` as to NOT sort
  // the original list/state
  final assets = ref.watch(assetProvider).where((e) => e.isRemote).toList();

  assets.sortByCompare<DateTime>(
    (e) => e.createdAt,
    (a, b) => b.compareTo(a),
  );

  return assets.groupListsBy(
    (element) => DateFormat('MMMM, y').format(element.createdAt.toLocal()),
  );
});
