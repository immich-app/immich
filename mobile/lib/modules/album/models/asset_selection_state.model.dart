import 'package:collection/collection.dart';
import 'package:immich_mobile/shared/models/asset.dart';

class AssetSelectionState {
  final Set<String> selectedMonths;
  final Set<Asset> selectedNewAssetsForAlbum;
  final Set<Asset> selectedAdditionalAssetsForAlbum;
  final Set<Asset> selectedAssetsInAlbumViewer;
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
    Set<Asset>? selectedNewAssetsForAlbum,
    Set<Asset>? selectedAdditionalAssetsForAlbum,
    Set<Asset>? selectedAssetsInAlbumViewer,
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
        setEquals(
          other.selectedAdditionalAssetsForAlbum,
          selectedAdditionalAssetsForAlbum,
        ) &&
        setEquals(
          other.selectedAssetsInAlbumViewer,
          selectedAssetsInAlbumViewer,
        ) &&
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
