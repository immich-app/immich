import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/models/delete_asset_response.model.dart';
import 'package:immich_mobile/modules/home/services/asset.service.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';
import 'package:immich_mobile/shared/services/device_info.service.dart';
import 'package:collection/collection.dart';
import 'package:intl/intl.dart';
import 'package:photo_manager/photo_manager.dart';

class AssetNotifier extends StateNotifier<List<ImmichAsset>> {
  final AssetService _assetService = AssetService();
  final DeviceInfoService _deviceInfoService = DeviceInfoService();
  final Ref ref;

  AssetNotifier(this.ref) : super([]);

  getAllAsset() async {
    List<ImmichAsset>? allAssets = await _assetService.getAllAsset();

    if (allAssets != null) {
      state = allAssets;
    }
  }

  clearAllAsset() {
    state = [];
  }

  onNewAssetUploaded(ImmichAsset newAsset) {
    state = [...state, newAsset];
  }

  deleteAssets(Set<ImmichAsset> deleteAssets) async {
    var deviceInfo = await _deviceInfoService.getDeviceInfo();
    var deviceId = deviceInfo["deviceId"];
    List<String> deleteIdList = [];
    // Delete asset from device
    for (var asset in deleteAssets) {
      // Delete asset on device if present
      if (asset.deviceId == deviceId) {
        AssetEntity? localAsset = await AssetEntity.fromId(asset.deviceAssetId);

        if (localAsset != null) {
          deleteIdList.add(localAsset.id);
        }
      }
    }

    final List<String> result = await PhotoManager.editor.deleteWithIds(deleteIdList);

    // Delete asset on server
    List<DeleteAssetResponse>? deleteAssetResult = await _assetService.deleteAssets(deleteAssets);
    if (deleteAssetResult == null) {
      return;
    }

    for (var asset in deleteAssetResult) {
      if (asset.status == 'success') {
        state = state.where((immichAsset) => immichAsset.id != asset.id).toList();
      }
    }
  }
}

final assetProvider = StateNotifierProvider<AssetNotifier, List<ImmichAsset>>((ref) {
  return AssetNotifier(ref);
});

final assetGroupByDateTimeProvider = StateProvider((ref) {
  var assets = ref.watch(assetProvider);

  assets.sortByCompare<DateTime>((e) => DateTime.parse(e.createdAt), (a, b) => b.compareTo(a));
  return assets.groupListsBy((element) => DateFormat('y-MM-dd').format(DateTime.parse(element.createdAt)));
});
