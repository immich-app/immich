import 'dart:convert';

import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'package:immich_mobile/shared/models/immich_asset.model.dart';

class AssetSelectionState {
  final Set<String> selectedMonths;
  final Set<ImmichAsset> selectedAsset;
  AssetSelectionState({
    required this.selectedMonths,
    required this.selectedAsset,
  });

  AssetSelectionState copyWith({
    Set<String>? selectedMonths,
    Set<ImmichAsset>? selectedAsset,
  }) {
    return AssetSelectionState(
      selectedMonths: selectedMonths ?? this.selectedMonths,
      selectedAsset: selectedAsset ?? this.selectedAsset,
    );
  }

  Map<String, dynamic> toMap() {
    final result = <String, dynamic>{};

    result.addAll({'selectedMonths': selectedMonths.toList()});
    result.addAll({'selectedAsset': selectedAsset.map((x) => x.toMap()).toList()});

    return result;
  }

  factory AssetSelectionState.fromMap(Map<String, dynamic> map) {
    return AssetSelectionState(
      selectedMonths: Set<String>.from(map['selectedMonths']),
      selectedAsset: Set<ImmichAsset>.from(map['selectedAsset']?.map((x) => ImmichAsset.fromMap(x))),
    );
  }

  String toJson() => json.encode(toMap());

  factory AssetSelectionState.fromJson(String source) => AssetSelectionState.fromMap(json.decode(source));

  @override
  String toString() => 'AssetSelectionState(selectedMonths: $selectedMonths, selectedAsset: $selectedAsset)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final setEquals = const DeepCollectionEquality().equals;

    return other is AssetSelectionState &&
        setEquals(other.selectedMonths, selectedMonths) &&
        setEquals(other.selectedAsset, selectedAsset);
  }

  @override
  int get hashCode => selectedMonths.hashCode ^ selectedAsset.hashCode;
}

class AssetSelectionNotifier extends StateNotifier<AssetSelectionState> {
  AssetSelectionNotifier()
      : super(AssetSelectionState(
          selectedAsset: {},
          selectedMonths: {},
        ));

  void addAssetsInMonth(String month, List<ImmichAsset> assetsInMonth) {
    state = state.copyWith(
      selectedMonths: {...state.selectedMonths, month},
      selectedAsset: {...state.selectedAsset, ...assetsInMonth},
    );
  }

  void addSingleAsset(ImmichAsset asset) {
    state = state.copyWith(
      selectedAsset: {...state.selectedAsset, asset},
    );
  }

  void removeSingleSelectedItem(ImmichAsset asset) {
    Set<ImmichAsset> currentList = state.selectedAsset;

    currentList.removeWhere((e) => e.id == asset.id);

    state = state.copyWith(selectedAsset: currentList);
  }

  void removeMultipleSelectedItem(List<ImmichAsset> assets) {
    Set<ImmichAsset> currentList = state.selectedAsset;

    for (ImmichAsset asset in assets) {
      currentList.removeWhere((e) => e.id == asset.id);
    }

    state = state.copyWith(selectedAsset: currentList);
  }
}

final assetSelectionProvider = StateNotifierProvider<AssetSelectionNotifier, AssetSelectionState>((ref) {
  return AssetSelectionNotifier();
});
