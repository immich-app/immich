import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/models/home_page_state.model.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';

class HomePageStateNotifier extends StateNotifier<HomePageState> {
  HomePageStateNotifier()
      : super(
          HomePageState(
            isMultiSelectEnable: false,
            selectedItems: [],
          ),
        );

  void enableMultiSelect(List<ImmichAsset> selectedItems) {
    state = state.copyWith(isMultiSelectEnable: true, selectedItems: selectedItems);
  }

  void disableMultiSelect() {
    state = state.copyWith(isMultiSelectEnable: false, selectedItems: []);
  }

  void addSingleSelectedItem(ImmichAsset asset) {
    state = state.copyWith(selectedItems: [...state.selectedItems, asset]);
  }

  void addMultipleSelectedItems(List<ImmichAsset> assets) {
    state = state.copyWith(selectedItems: [...state.selectedItems, ...assets]);
  }

  void removeSingleSelectedItem(ImmichAsset asset) {
    List<ImmichAsset> currentList = state.selectedItems;

    currentList.removeWhere((e) => e.id == asset.id);

    state = state.copyWith(selectedItems: currentList);
  }

  void removeMultipleSelectedItem(List<ImmichAsset> assets) {
    List<ImmichAsset> currentList = state.selectedItems;

    for (ImmichAsset asset in assets) {
      currentList.removeWhere((e) => e.id == asset.id);
    }

    state = state.copyWith(selectedItems: currentList);
  }
}

final homePageStateProvider =
    StateNotifierProvider<HomePageStateNotifier, HomePageState>(((ref) => HomePageStateNotifier()));
