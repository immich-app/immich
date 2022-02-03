import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/models/get_all_asset_respose.model.dart';
import 'package:immich_mobile/modules/home/services/asset.service.dart';

class AssetNotifier extends StateNotifier<List<ImmichAssetGroupByDate>> {
  final imagePerPage = 100;
  final AssetService _assetService = AssetService();

  AssetNotifier() : super([]);
  late String? nextPageKey = "";
  bool isFetching = false;

  getImmichAssets() async {
    GetAllAssetResponse? res = await _assetService.getAllAsset();
    nextPageKey = res?.nextPageKey;

    if (res != null) {
      for (var assets in res.data) {
        state = [...state, assets];
      }
    }
  }

  getMoreAsset() async {
    if (nextPageKey != null && !isFetching) {
      isFetching = true;
      GetAllAssetResponse? res = await _assetService.getMoreAsset(nextPageKey);

      if (res != null) {
        nextPageKey = res.nextPageKey;

        List<ImmichAssetGroupByDate> previousState = state;
        List<ImmichAssetGroupByDate> currentState = [];

        for (var assets in res.data) {
          currentState = [...currentState, assets];
        }

        if (previousState.last.date == currentState.first.date) {
          previousState.last.assets = [...previousState.last.assets, ...currentState.first.assets];
          state = [...previousState, ...currentState.sublist(1)];
        } else {
          state = [...previousState, ...currentState];
        }
      }

      isFetching = false;
    }
  }

  clearAllAsset() {
    state = [];
  }
}

final currentLocalPageProvider = StateProvider<int>((ref) => 0);

final assetProvider = StateNotifierProvider<AssetNotifier, List<ImmichAssetGroupByDate>>((ref) {
  return AssetNotifier();
});
