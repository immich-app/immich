import 'dart:convert';

import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'package:immich_mobile/shared/models/immich_asset.model.dart';

class AssetSelectionState {
  final Set<String> selectedMonths;
  final Set<ImmichAsset> selectedAssets;
  AssetSelectionState({
    required this.selectedMonths,
    required this.selectedAssets,
  });

  AssetSelectionState copyWith({
    Set<String>? selectedMonths,
    Set<ImmichAsset>? selectedAsset,
  }) {
    return AssetSelectionState(
      selectedMonths: selectedMonths ?? this.selectedMonths,
      selectedAssets: selectedAsset ?? selectedAssets,
    );
  }

  Map<String, dynamic> toMap() {
    final result = <String, dynamic>{};

    result.addAll({'selectedMonths': selectedMonths.toList()});
    result.addAll({'selectedAsset': selectedAssets.map((x) => x.toMap()).toList()});

    return result;
  }

  factory AssetSelectionState.fromMap(Map<String, dynamic> map) {
    return AssetSelectionState(
      selectedMonths: Set<String>.from(map['selectedMonths']),
      selectedAssets: Set<ImmichAsset>.from(map['selectedAsset']?.map((x) => ImmichAsset.fromMap(x))),
    );
  }

  String toJson() => json.encode(toMap());

  factory AssetSelectionState.fromJson(String source) => AssetSelectionState.fromMap(json.decode(source));

  @override
  String toString() => 'AssetSelectionState(selectedMonths: $selectedMonths, selectedAsset: $selectedAssets)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final setEquals = const DeepCollectionEquality().equals;

    return other is AssetSelectionState &&
        setEquals(other.selectedMonths, selectedMonths) &&
        setEquals(other.selectedAssets, selectedAssets);
  }

  @override
  int get hashCode => selectedMonths.hashCode ^ selectedAssets.hashCode;
}

class AssetSelectionNotifier extends StateNotifier<AssetSelectionState> {
  AssetSelectionNotifier()
      : super(AssetSelectionState(
          selectedAssets: {},
          selectedMonths: {},
        ));

  void removeAssetsInMonth(String removedMonth, List<ImmichAsset> assetsInMonth) {
    Set<ImmichAsset> currentAssetList = state.selectedAssets;
    Set<String> currentMonthList = state.selectedMonths;

    currentMonthList.removeWhere((selectedMonth) => selectedMonth == removedMonth);

    for (ImmichAsset asset in assetsInMonth) {
      currentAssetList.removeWhere((e) => e.id == asset.id);
    }

    state = state.copyWith(selectedAsset: currentAssetList, selectedMonths: currentMonthList);
  }

  void addAssetsInMonth(String month, List<ImmichAsset> assetsInMonth) {
    state = state.copyWith(
      selectedMonths: {...state.selectedMonths, month},
      selectedAsset: {...state.selectedAssets, ...assetsInMonth},
    );
  }

  void addSingleAsset(ImmichAsset asset) {
    state = state.copyWith(
      selectedAsset: {...state.selectedAssets, asset},
    );
  }

  void removeSingleSelectedItem(ImmichAsset asset) {
    Set<ImmichAsset> currentList = state.selectedAssets;

    currentList.removeWhere((e) => e.id == asset.id);

    state = state.copyWith(selectedAsset: currentList);
  }

  void removeMultipleSelectedItem(List<ImmichAsset> assets) {
    Set<ImmichAsset> currentList = state.selectedAssets;

    for (ImmichAsset asset in assets) {
      currentList.removeWhere((e) => e.id == asset.id);
    }

    state = state.copyWith(selectedAsset: currentList);
  }

  void removeAll() {
    state = state.copyWith(selectedAsset: {}, selectedMonths: {});
  }
}

final assetSelectionProvider = StateNotifierProvider<AssetSelectionNotifier, AssetSelectionState>((ref) {
  return AssetSelectionNotifier();
});
