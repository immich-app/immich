import 'dart:convert';

import 'package:collection/collection.dart';

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
    Set<ImmichAsset>? selectedAssets,
  }) {
    return AssetSelectionState(
      selectedMonths: selectedMonths ?? this.selectedMonths,
      selectedAssets: selectedAssets ?? this.selectedAssets,
    );
  }

  Map<String, dynamic> toMap() {
    final result = <String, dynamic>{};

    result.addAll({'selectedMonths': selectedMonths.toList()});
    result.addAll({'selectedAssets': selectedAssets.map((x) => x.toMap()).toList()});

    return result;
  }

  factory AssetSelectionState.fromMap(Map<String, dynamic> map) {
    return AssetSelectionState(
      selectedMonths: Set<String>.from(map['selectedMonths']),
      selectedAssets: Set<ImmichAsset>.from(map['selectedAssets']?.map((x) => ImmichAsset.fromMap(x))),
    );
  }

  String toJson() => json.encode(toMap());

  factory AssetSelectionState.fromJson(String source) => AssetSelectionState.fromMap(json.decode(source));

  @override
  String toString() => 'AssetSelectionState(selectedMonths: $selectedMonths, selectedAssets: $selectedAssets)';

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
