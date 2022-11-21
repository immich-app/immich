import 'dart:collection';

import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/services/asset.service.dart';
import 'package:immich_mobile/modules/home/services/asset_cache.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/services/device_info.service.dart';
import 'package:collection/collection.dart';
import 'package:intl/intl.dart';
import 'package:openapi/api.dart';
import 'package:photo_manager/photo_manager.dart';

class AssetNotifier extends StateNotifier<List<Asset>> {
  final AssetService _assetService;
  final AssetCacheService _assetCacheService;

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
      if (isCacheValid && state.isEmpty) {
        stopwatch.start();
        state = await _assetCacheService.get();
        debugPrint(
          "Reading assets from cache: ${stopwatch.elapsedMilliseconds}ms",
        );
        stopwatch.reset();
      }

      stopwatch.start();
      var allAssets = await _assetService.getAllAsset(urgent: !isCacheValid);
      debugPrint("Query assets from API: ${stopwatch.elapsedMilliseconds}ms");
      stopwatch.reset();

      state = allAssets;
    } finally {
      _getAllAssetInProgress = false;
    }
    debugPrint("[getAllAsset] setting new asset state");

    stopwatch.start();
    _cacheState();
    debugPrint("Store assets in cache: ${stopwatch.elapsedMilliseconds}ms");
    stopwatch.reset();
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
      } catch (e) {
        debugPrint("Delete asset from device failed: $e");
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
