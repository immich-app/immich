import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/sharing/models/asset_selection_state.model.dart';

import 'package:immich_mobile/shared/models/immich_asset.model.dart';

class AssetSelectionNotifier extends StateNotifier<AssetSelectionState> {
  AssetSelectionNotifier()
      : super(AssetSelectionState(
          selectedAssets: {},
          selectedMonths: {},
          newAssetsForAlbum: {},
          isAlbumExist: false,
        ));

  void setisAlbumExist(bool isAlbumExist) {
    state = state.copyWith(isAlbumExist: isAlbumExist);
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

  void addNewAssetToAlbum(List<ImmichAsset> assets) {
    state = state.copyWith(
      newAssetsForAlbum: {...state.newAssetsForAlbum, ...assets},
    );
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

  void removeSelectedNewAssetsForAlbum(List<ImmichAsset> assets) {
    Set<ImmichAsset> currentList = state.newAssetsForAlbum;

    for (ImmichAsset asset in assets) {
      currentList.removeWhere((e) => e.id == asset.id);
    }

    state = state.copyWith(newAssetsForAlbum: currentList);
  }

  void removeAll() {
    state = state.copyWith(selectedAssets: {}, selectedMonths: {}, newAssetsForAlbum: {}, isAlbumExist: false);
  }
}

final assetSelectionProvider = StateNotifierProvider<AssetSelectionNotifier, AssetSelectionState>((ref) {
  return AssetSelectionNotifier();
});
