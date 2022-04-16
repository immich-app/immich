import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/sharing/models/asset_selection_state.model.dart';

import 'package:immich_mobile/shared/models/immich_asset.model.dart';

class AssetSelectionNotifier extends StateNotifier<AssetSelectionState> {
  AssetSelectionNotifier()
      : super(AssetSelectionState(
          selectedAssets: {},
          selectedMonths: {},
          isNavigatedFromAlbum: false,
        ));

  void setIsNavigatedFromAlbum(bool isNavigatedFromAlbum) {
    state = state.copyWith(isNavigatedFromAlbum: isNavigatedFromAlbum);
  }

  void removeAssetsInMonth(String removedMonth, List<ImmichAsset> assetsInMonth) {
    Set<ImmichAsset> currentAssetList = state.selectedAssets;
    Set<String> currentMonthList = state.selectedMonths;

    currentMonthList.removeWhere((selectedMonth) => selectedMonth == removedMonth);

    for (ImmichAsset asset in assetsInMonth) {
      currentAssetList.removeWhere((e) => e.id == asset.id);
    }

    state = state.copyWith(selectedAssets: currentAssetList, selectedMonths: currentMonthList);
  }

  void addAssetsInMonth(String month, List<ImmichAsset> assetsInMonth) {
    state = state.copyWith(
      selectedMonths: {...state.selectedMonths, month},
      selectedAssets: {...state.selectedAssets, ...assetsInMonth},
    );
  }

  void addSingleAsset(ImmichAsset asset) {
    state = state.copyWith(
      selectedAssets: {...state.selectedAssets, asset},
    );
  }

  void addMultipleAssets(List<ImmichAsset> assets) {
    state = state.copyWith(
      selectedAssets: {...state.selectedAssets, ...assets},
    );
  }

  void removeSingleSelectedItem(ImmichAsset asset) {
    Set<ImmichAsset> currentList = state.selectedAssets;

    currentList.removeWhere((e) => e.id == asset.id);

    state = state.copyWith(selectedAssets: currentList);
  }

  void removeMultipleSelectedItem(List<ImmichAsset> assets) {
    Set<ImmichAsset> currentList = state.selectedAssets;

    for (ImmichAsset asset in assets) {
      currentList.removeWhere((e) => e.id == asset.id);
    }

    state = state.copyWith(selectedAssets: currentList);
  }

  void removeAll() {
    state = state.copyWith(selectedAssets: {}, selectedMonths: {}, isNavigatedFromAlbum: false);
  }
}

final assetSelectionProvider = StateNotifierProvider<AssetSelectionNotifier, AssetSelectionState>((ref) {
  return AssetSelectionNotifier();
});
