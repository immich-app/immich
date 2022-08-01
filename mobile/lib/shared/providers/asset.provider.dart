import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/home/services/asset.service.dart';
import 'package:immich_mobile/shared/services/device_info.service.dart';
import 'package:collection/collection.dart';
import 'package:intl/intl.dart';
import 'package:openapi/api.dart';
import 'package:photo_manager/photo_manager.dart';

class AssetNotifier extends StateNotifier<List<AssetResponseDto>> {
  final AssetService _assetService;
  final DeviceInfoService _deviceInfoService = DeviceInfoService();

  final cacheBox = Hive.box(hiveAssetsCacheBox);

  AssetNotifier(this._assetService) : super([]);

  @override
  List<AssetResponseDto> get state {
    try {
      if (state.isEmpty && cacheBox.containsKey(hiveAssetsCacheKey)) {
        List<dynamic> jsonResponseList = json.decode(cacheBox.get(hiveAssetsCacheKey));
        return jsonResponseList.map((e) => AssetResponseDto.fromJson(e)!).toList();
      }
    } catch (e) {
      debugPrint('${e}');
    }
    return super.state;
  }

  getAllAsset() async {
    var allAssets = await _assetService.getAllAsset();

    if (allAssets != null) {
      state = allAssets;
      cacheBox.put(hiveAssetsCacheKey, json.encode(allAssets.sublist(0, 40)));
    }
  }

  clearAllAsset() {
    state = [];
  }

  onNewAssetUploaded(AssetResponseDto newAsset) {
    state = [...state, newAsset];
  }

  deleteAssets(Set<AssetResponseDto> deleteAssets) async {
    var deviceInfo = await _deviceInfoService.getDeviceInfo();
    var deviceId = deviceInfo["deviceId"];
    var deleteIdList = <String>[];
    // Delete asset from device
    for (var asset in deleteAssets) {
      // Delete asset on device if present
      if (asset.deviceId == deviceId) {
        var localAsset = await AssetEntity.fromId(asset.deviceAssetId);

        if (localAsset != null) {
          deleteIdList.add(localAsset.id);
        }
      }
    }

    try {
      await PhotoManager.editor.deleteWithIds(deleteIdList);
    } catch (e) {
      debugPrint("Delete asset from device failed: $e");
    }

    // Delete asset on server
    List<DeleteAssetResponseDto>? deleteAssetResult =
        await _assetService.deleteAssets(deleteAssets);

    if (deleteAssetResult == null) {
      return;
    }

    for (var asset in deleteAssetResult) {
      if (asset.status == DeleteAssetStatus.SUCCESS) {
        state =
            state.where((immichAsset) => immichAsset.id != asset.id).toList();
      }
    }
  }
}

final assetProvider =
    StateNotifierProvider<AssetNotifier, List<AssetResponseDto>>((ref) {
  return AssetNotifier(ref.watch(assetServiceProvider));
});

final assetGroupByDateTimeProvider = StateProvider((ref) {
  var assets = ref.watch(assetProvider);

  assets.sortByCompare<DateTime>(
    (e) => DateTime.parse(e.createdAt),
    (a, b) => b.compareTo(a),
  );
  return assets.groupListsBy(
    (element) =>
        DateFormat('y-MM-dd').format(DateTime.parse(element.createdAt)),
  );
});

final assetGroupByMonthYearProvider = StateProvider((ref) {
  var assets = ref.watch(assetProvider);

  assets.sortByCompare<DateTime>(
    (e) => DateTime.parse(e.createdAt),
    (a, b) => b.compareTo(a),
  );

  return assets.groupListsBy(
    (element) =>
        DateFormat('MMMM, y').format(DateTime.parse(element.createdAt)),
  );
});
