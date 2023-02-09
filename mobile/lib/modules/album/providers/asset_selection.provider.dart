import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/models/asset_selection_state.model.dart';
import 'package:immich_mobile/shared/models/asset.dart';

class AssetSelectionNotifier extends StateNotifier<AssetSelectionState> {
  AssetSelectionNotifier()
      : super(
          AssetSelectionState(
            selectedNewAssetsForAlbum: {},
            selectedMonths: {},
            selectedAdditionalAssetsForAlbum: {},
            selectedAssetsInAlbumViewer: {},
            isAlbumExist: false,
            isMultiselectEnable: false,
          ),
        );

  void setIsAlbumExist(bool isAlbumExist) {
    state = state.copyWith(isAlbumExist: isAlbumExist);
  }

  void removeAssetsInMonth(
    String removedMonth,
    List<Asset> assetsInMonth,
  ) {
    Set<Asset> currentAssetList = state.selectedNewAssetsForAlbum;
    Set<String> currentMonthList = state.selectedMonths;

    currentMonthList
        .removeWhere((selectedMonth) => selectedMonth == removedMonth);

    for (Asset asset in assetsInMonth) {
      currentAssetList.removeWhere((e) => e.id == asset.id);
    }

    state = state.copyWith(
      selectedNewAssetsForAlbum: currentAssetList,
      selectedMonths: currentMonthList,
    );
  }

  void addAdditionalAssets(List<Asset> assets) {
    state = state.copyWith(
      selectedAdditionalAssetsForAlbum: {
        ...state.selectedAdditionalAssetsForAlbum,
        ...assets
      },
    );
  }

  void addAllAssetsInMonth(String month, List<Asset> assetsInMonth) {
    state = state.copyWith(
      selectedMonths: {...state.selectedMonths, month},
      selectedNewAssetsForAlbum: {
        ...state.selectedNewAssetsForAlbum,
        ...assetsInMonth
      },
    );
  }

  void addNewAssets(Iterable<Asset> assets) {
    state = state.copyWith(
      selectedNewAssetsForAlbum: {
        ...state.selectedNewAssetsForAlbum,
        ...assets
      },
    );
  }

  void removeSelectedNewAssets(List<Asset> assets) {
    Set<Asset> currentList = state.selectedNewAssetsForAlbum;

    for (Asset asset in assets) {
      currentList.removeWhere((e) => e.id == asset.id);
    }

    state = state.copyWith(selectedNewAssetsForAlbum: currentList);
  }

  void removeSelectedAdditionalAssets(List<Asset> assets) {
    Set<Asset> currentList = state.selectedAdditionalAssetsForAlbum;

    for (Asset asset in assets) {
      currentList.removeWhere((e) => e.id == asset.id);
    }

    state = state.copyWith(selectedAdditionalAssetsForAlbum: currentList);
  }

  void removeAll() {
    state = state.copyWith(
      selectedNewAssetsForAlbum: {},
      selectedMonths: {},
      selectedAdditionalAssetsForAlbum: {},
      selectedAssetsInAlbumViewer: {},
      isAlbumExist: false,
    );
  }

  void enableMultiselection() {
    state = state.copyWith(isMultiselectEnable: true);
  }

  void disableMultiselection() {
    state = state.copyWith(
      isMultiselectEnable: false,
      selectedAssetsInAlbumViewer: {},
    );
  }

  void addAssetsInAlbumViewer(List<Asset> assets) {
    state = state.copyWith(
      selectedAssetsInAlbumViewer: {
        ...state.selectedAssetsInAlbumViewer,
        ...assets
      },
    );
  }

  void removeAssetsInAlbumViewer(List<Asset> assets) {
    Set<Asset> currentList = state.selectedAssetsInAlbumViewer;

    for (Asset asset in assets) {
      currentList.removeWhere((e) => e.id == asset.id);
    }

    state = state.copyWith(selectedAssetsInAlbumViewer: currentList);
  }
}

final assetSelectionProvider =
    StateNotifierProvider<AssetSelectionNotifier, AssetSelectionState>((ref) {
  return AssetSelectionNotifier();
});
