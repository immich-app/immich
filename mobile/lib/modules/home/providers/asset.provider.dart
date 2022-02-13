import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/services/asset.service.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';
import 'package:immich_mobile/shared/services/device_info.service.dart';
import 'package:collection/collection.dart';
import 'package:intl/intl.dart';

class AssetNotifier extends StateNotifier<List<ImmichAsset>> {
  final AssetService _assetService = AssetService();
  final DeviceInfoService _deviceInfoService = DeviceInfoService();

  AssetNotifier() : super([]);

  getAllAsset() async {
    List<ImmichAsset>? allAssets = await _assetService.getAllAsset();

    if (allAssets != null) {
      allAssets.sortByCompare<DateTime>((e) => DateTime.parse(e.createdAt), (a, b) => b.compareTo(a));
      state = allAssets;
    }
  }

  clearAllAsset() {
    state = [];
  }

  deleteAssets(Set<ImmichAsset> deleteAssets) async {
    var deviceInfo = await _deviceInfoService.getDeviceInfo();
    var deviceId = deviceInfo["deviceId"];

    // Delete asset on server

    // Delete asset from device
  }
}

final currentLocalPageProvider = StateProvider<int>((ref) => 0);

final assetProvider = StateNotifierProvider<AssetNotifier, List<ImmichAsset>>((ref) {
  return AssetNotifier();
});

final assetGroupByDateTimeProvider = StateProvider((ref) {
  var assetGroup = ref.watch(assetProvider);

  return assetGroup.groupListsBy((element) => DateFormat('y-MM-dd').format(DateTime.parse(element.createdAt)));
});
