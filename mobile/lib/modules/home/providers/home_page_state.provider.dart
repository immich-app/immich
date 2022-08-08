import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/models/home_page_state.model.dart';
import 'package:immich_mobile/shared/services/share.service.dart';
import 'package:immich_mobile/shared/ui/share_dialog.dart';
import 'package:openapi/api.dart';

class HomePageStateNotifier extends StateNotifier<HomePageState> {

  final ShareService _shareService;

  HomePageStateNotifier(this._shareService)
      : super(
          HomePageState(
            isMultiSelectEnable: false,
            selectedItems: {},
            selectedDateGroup: {},
          ),
        );

  void addSelectedDateGroup(String dateGroupTitle) {
    state = state.copyWith(
      selectedDateGroup: {...state.selectedDateGroup, dateGroupTitle},
    );
  }

  void removeSelectedDateGroup(String dateGroupTitle) {
    var currentDateGroup = state.selectedDateGroup;

    currentDateGroup.removeWhere((e) => e == dateGroupTitle);

    state = state.copyWith(selectedDateGroup: currentDateGroup);
  }

  void enableMultiSelect(Set<AssetResponseDto> selectedItems) {
    state =
        state.copyWith(isMultiSelectEnable: true, selectedItems: selectedItems);
  }

  void disableMultiSelect() {
    state = state.copyWith(
      isMultiSelectEnable: false,
      selectedItems: {},
      selectedDateGroup: {},
    );
  }

  void addSingleSelectedItem(AssetResponseDto asset) {
    state = state.copyWith(selectedItems: {...state.selectedItems, asset});
  }

  void addMultipleSelectedItems(List<AssetResponseDto> assets) {
    state = state.copyWith(selectedItems: {...state.selectedItems, ...assets});
  }

  void removeSingleSelectedItem(AssetResponseDto asset) {
    Set<AssetResponseDto> currentList = state.selectedItems;

    currentList.removeWhere((e) => e.id == asset.id);

    state = state.copyWith(selectedItems: currentList);
  }

  void removeMultipleSelectedItem(List<AssetResponseDto> assets) {
    Set<AssetResponseDto> currentList = state.selectedItems;

    for (AssetResponseDto asset in assets) {
      currentList.removeWhere((e) => e.id == asset.id);
    }

    state = state.copyWith(selectedItems: currentList);
  }

  void shareAssets(List<AssetResponseDto> assets, BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext buildContext) {
        _shareService
            .shareAssets(assets)
            .then((_) => Navigator.of(buildContext).pop());
        return const ShareDialog();
      },
      barrierDismissible: false,
    );
  }
}

final homePageStateProvider =
    StateNotifierProvider<HomePageStateNotifier, HomePageState>(
  ((ref) => HomePageStateNotifier(ref.watch(shareServiceProvider))),
);
