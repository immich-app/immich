import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/models/get_all_asset_respose.model.dart';
import 'package:immich_mobile/modules/home/services/asset.service.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';
import 'package:intl/intl.dart';
import 'package:collection/collection.dart';

class AssetNotifier extends StateNotifier<List<ImmichAssetGroupByDate>> {
  final AssetService _assetService = AssetService();

  AssetNotifier() : super([]);

  late String? nextPageKey = "";
  bool isFetching = false;

  // Get All assets
  getImmichAssets() async {
    GetAllAssetResponse? res = await _assetService.getAllAsset();
    nextPageKey = res?.nextPageKey;

    if (res != null) {
      for (var assets in res.data) {
        state = [...state, assets];
      }
    }
  }

  // Get Asset From The Past
  getOlderAsset() async {
    if (nextPageKey != null && !isFetching) {
      isFetching = true;
      GetAllAssetResponse? res = await _assetService.getOlderAsset(nextPageKey);

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

  // Get newer asset from the current time
  getNewAsset() async {
    if (state.isNotEmpty) {
      var latestGroup = state.first;

      // Sort the last asset group and put the lastest asset in front.
      latestGroup.assets.sortByCompare<DateTime>((e) => DateTime.parse(e.createdAt), (a, b) => b.compareTo(a));
      var latestAsset = latestGroup.assets.first;
      var formatDateTemplate = 'y-MM-dd';
      var latestAssetDateText = DateFormat(formatDateTemplate).format(DateTime.parse(latestAsset.createdAt));

      List<ImmichAsset> newAssets = await _assetService.getNewAsset(latestAsset.createdAt);

      if (newAssets.isEmpty) {
        return;
      }

      // Grouping by data
      var groupByDateList = groupBy<ImmichAsset, String>(
          newAssets, (asset) => DateFormat(formatDateTemplate).format(DateTime.parse(asset.createdAt)));

      groupByDateList.forEach((groupDateInFormattedText, assets) {
        if (groupDateInFormattedText != latestAssetDateText) {
          ImmichAssetGroupByDate newGroup = ImmichAssetGroupByDate(assets: assets, date: groupDateInFormattedText);
          state = [newGroup, ...state];
        } else {
          latestGroup.assets.insertAll(0, assets);

          state = [latestGroup, ...state.sublist(1)];
        }
      });
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
