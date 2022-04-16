import 'dart:convert';

import 'package:collection/collection.dart';

import 'package:immich_mobile/shared/models/immich_asset.model.dart';

class AssetSelectionState {
  final Set<String> selectedMonths;
  final Set<ImmichAsset> selectedAssets;

  /// Indicate the asset selection page is navigated from existing album
  final bool isNavigatedFromAlbum;

  AssetSelectionState({
    required this.selectedMonths,
    required this.selectedAssets,
    this.isNavigatedFromAlbum = false,
  });

  AssetSelectionState copyWith({
    Set<String>? selectedMonths,
    Set<ImmichAsset>? selectedAssets,
    bool? isNavigatedFromAlbum,
  }) {
    return AssetSelectionState(
      selectedMonths: selectedMonths ?? this.selectedMonths,
      selectedAssets: selectedAssets ?? this.selectedAssets,
      isNavigatedFromAlbum: isNavigatedFromAlbum ?? this.isNavigatedFromAlbum,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'selectedMonths': selectedMonths.toList(),
      'selectedAssets': selectedAssets.map((x) => x.toMap()).toList(),
      'isNavigatedFromAlbum': isNavigatedFromAlbum,
    };
  }

  factory AssetSelectionState.fromMap(Map<String, dynamic> map) {
    return AssetSelectionState(
      selectedMonths: Set<String>.from(map['selectedMonths']),
      selectedAssets: Set<ImmichAsset>.from(map['selectedAssets']?.map((x) => ImmichAsset.fromMap(x))),
      isNavigatedFromAlbum: map['isNavigatedFromAlbum'] ?? false,
    );
  }

  String toJson() => json.encode(toMap());

  factory AssetSelectionState.fromJson(String source) => AssetSelectionState.fromMap(json.decode(source));

  @override
  String toString() =>
      'AssetSelectionState(selectedMonths: $selectedMonths, selectedAssets: $selectedAssets, isNavigatedFromAlbum: $isNavigatedFromAlbum)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final setEquals = const DeepCollectionEquality().equals;

    return other is AssetSelectionState &&
        setEquals(other.selectedMonths, selectedMonths) &&
        setEquals(other.selectedAssets, selectedAssets) &&
        other.isNavigatedFromAlbum == isNavigatedFromAlbum;
  }

  @override
  int get hashCode => selectedMonths.hashCode ^ selectedAssets.hashCode ^ isNavigatedFromAlbum.hashCode;
}
