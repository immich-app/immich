import 'dart:convert';

import 'package:collection/collection.dart';

import 'package:immich_mobile/shared/models/immich_asset.model.dart';

class AssetSelectionState {
  final Set<String> selectedMonths;
  final Set<ImmichAsset> selectedNewAssetsForAlbum;
  final Set<ImmichAsset> selectedAdditionalAssetsForAlbum;
  final Set<ImmichAsset> selectedAssetsInAlbumViewer;
  final bool isMultiselectEnable;

  /// Indicate the asset selection page is navigated from existing album
  final bool isAlbumExist;
  AssetSelectionState({
    required this.selectedMonths,
    required this.selectedNewAssetsForAlbum,
    required this.selectedAdditionalAssetsForAlbum,
    required this.selectedAssetsInAlbumViewer,
    required this.isMultiselectEnable,
    required this.isAlbumExist,
  });

  AssetSelectionState copyWith({
    Set<String>? selectedMonths,
    Set<ImmichAsset>? selectedNewAssetsForAlbum,
    Set<ImmichAsset>? selectedAdditionalAssetsForAlbum,
    Set<ImmichAsset>? selectedAssetsInAlbumViewer,
    bool? isMultiselectEnable,
    bool? isAlbumExist,
  }) {
    return AssetSelectionState(
      selectedMonths: selectedMonths ?? this.selectedMonths,
      selectedNewAssetsForAlbum:
          selectedNewAssetsForAlbum ?? this.selectedNewAssetsForAlbum,
      selectedAdditionalAssetsForAlbum: selectedAdditionalAssetsForAlbum ??
          this.selectedAdditionalAssetsForAlbum,
      selectedAssetsInAlbumViewer:
          selectedAssetsInAlbumViewer ?? this.selectedAssetsInAlbumViewer,
      isMultiselectEnable: isMultiselectEnable ?? this.isMultiselectEnable,
      isAlbumExist: isAlbumExist ?? this.isAlbumExist,
    );
  }

  Map<String, dynamic> toMap() {
    final result = <String, dynamic>{};

    result.addAll({'selectedMonths': selectedMonths.toList()});
    result.addAll({
      'selectedNewAssetsForAlbum':
          selectedNewAssetsForAlbum.map((x) => x.toMap()).toList()
    });
    result.addAll({
      'selectedAdditionalAssetsForAlbum':
          selectedAdditionalAssetsForAlbum.map((x) => x.toMap()).toList()
    });
    result.addAll({
      'selectedAssetsInAlbumViewer':
          selectedAssetsInAlbumViewer.map((x) => x.toMap()).toList()
    });
    result.addAll({'isMultiselectEnable': isMultiselectEnable});
    result.addAll({'isAlbumExist': isAlbumExist});

    return result;
  }

  factory AssetSelectionState.fromMap(Map<String, dynamic> map) {
    return AssetSelectionState(
      selectedMonths: Set<String>.from(map['selectedMonths']),
      selectedNewAssetsForAlbum: Set<ImmichAsset>.from(
          map['selectedNewAssetsForAlbum']?.map((x) => ImmichAsset.fromMap(x))),
      selectedAdditionalAssetsForAlbum: Set<ImmichAsset>.from(
          map['selectedAdditionalAssetsForAlbum']
              ?.map((x) => ImmichAsset.fromMap(x))),
      selectedAssetsInAlbumViewer: Set<ImmichAsset>.from(
          map['selectedAssetsInAlbumViewer']
              ?.map((x) => ImmichAsset.fromMap(x))),
      isMultiselectEnable: map['isMultiselectEnable'] ?? false,
      isAlbumExist: map['isAlbumExist'] ?? false,
    );
  }

  String toJson() => json.encode(toMap());

  factory AssetSelectionState.fromJson(String source) =>
      AssetSelectionState.fromMap(json.decode(source));

  @override
  String toString() {
    return 'AssetSelectionState(selectedMonths: $selectedMonths, selectedNewAssetsForAlbum: $selectedNewAssetsForAlbum, selectedAdditionalAssetsForAlbum: $selectedAdditionalAssetsForAlbum, selectedAssetsInAlbumViewer: $selectedAssetsInAlbumViewer, isMultiselectEnable: $isMultiselectEnable, isAlbumExist: $isAlbumExist)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final setEquals = const DeepCollectionEquality().equals;

    return other is AssetSelectionState &&
        setEquals(other.selectedMonths, selectedMonths) &&
        setEquals(other.selectedNewAssetsForAlbum, selectedNewAssetsForAlbum) &&
        setEquals(other.selectedAdditionalAssetsForAlbum,
            selectedAdditionalAssetsForAlbum) &&
        setEquals(
            other.selectedAssetsInAlbumViewer, selectedAssetsInAlbumViewer) &&
        other.isMultiselectEnable == isMultiselectEnable &&
        other.isAlbumExist == isAlbumExist;
  }

  @override
  int get hashCode {
    return selectedMonths.hashCode ^
        selectedNewAssetsForAlbum.hashCode ^
        selectedAdditionalAssetsForAlbum.hashCode ^
        selectedAssetsInAlbumViewer.hashCode ^
        isMultiselectEnable.hashCode ^
        isAlbumExist.hashCode;
  }
}
