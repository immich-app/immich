import 'dart:convert';

import 'package:collection/collection.dart';

import 'package:immich_mobile/shared/models/immich_asset.model.dart';

class AssetSelectionState {
  final Set<String> selectedMonths;
  final Set<ImmichAsset> selectedAssets;
  final Set<ImmichAsset> newAssetsForAlbum;

  /// Indicate the asset selection page is navigated from existing album
  final bool isAlbumExist;

  AssetSelectionState({
    required this.selectedMonths,
    required this.selectedAssets,
    required this.newAssetsForAlbum,
    required this.isAlbumExist,
  });

  AssetSelectionState copyWith({
    Set<String>? selectedMonths,
    Set<ImmichAsset>? selectedAssets,
    Set<ImmichAsset>? newAssetsForAlbum,
    bool? isAlbumExist,
  }) {
    return AssetSelectionState(
      selectedMonths: selectedMonths ?? this.selectedMonths,
      selectedAssets: selectedAssets ?? this.selectedAssets,
      newAssetsForAlbum: newAssetsForAlbum ?? this.newAssetsForAlbum,
      isAlbumExist: isAlbumExist ?? this.isAlbumExist,
    );
  }

  Map<String, dynamic> toMap() {
    final result = <String, dynamic>{};

    result.addAll({'selectedMonths': selectedMonths.toList()});
    result.addAll({'selectedAssets': selectedAssets.map((x) => x.toMap()).toList()});
    result.addAll({'newAssetsForAlbum': newAssetsForAlbum.map((x) => x.toMap()).toList()});
    result.addAll({'isAlbumExist': isAlbumExist});

    return result;
  }

  factory AssetSelectionState.fromMap(Map<String, dynamic> map) {
    return AssetSelectionState(
      selectedMonths: Set<String>.from(map['selectedMonths']),
      selectedAssets: Set<ImmichAsset>.from(map['selectedAssets']?.map((x) => ImmichAsset.fromMap(x))),
      newAssetsForAlbum: Set<ImmichAsset>.from(map['newAssetsForAlbum']?.map((x) => ImmichAsset.fromMap(x))),
      isAlbumExist: map['isAlbumExist'] ?? false,
    );
  }

  String toJson() => json.encode(toMap());

  factory AssetSelectionState.fromJson(String source) => AssetSelectionState.fromMap(json.decode(source));

  @override
  String toString() {
    return 'AssetSelectionState(selectedMonths: $selectedMonths, selectedAssets: $selectedAssets, newAssetsForAlbum: $newAssetsForAlbum, isAlbumExist: $isAlbumExist)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final setEquals = const DeepCollectionEquality().equals;

    return other is AssetSelectionState &&
        setEquals(other.selectedMonths, selectedMonths) &&
        setEquals(other.selectedAssets, selectedAssets) &&
        setEquals(other.newAssetsForAlbum, newAssetsForAlbum) &&
        other.isAlbumExist == isAlbumExist;
  }

  @override
  int get hashCode {
    return selectedMonths.hashCode ^ selectedAssets.hashCode ^ newAssetsForAlbum.hashCode ^ isAlbumExist.hashCode;
  }
}
