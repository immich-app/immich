import 'package:collection/collection.dart';
import 'package:immich_mobile/shared/models/asset.dart';

class AssetSelectionPageResult {
  final Set<Asset> selectedNewAsset;
  final Set<Asset> selectedAdditionalAsset;
  final bool isAlbumExist;

  AssetSelectionPageResult({
    required this.selectedNewAsset,
    required this.selectedAdditionalAsset,
    required this.isAlbumExist,
  });

  AssetSelectionPageResult copyWith({
    Set<Asset>? selectedNewAsset,
    Set<Asset>? selectedAdditionalAsset,
    bool? isAlbumExist,
  }) {
    return AssetSelectionPageResult(
      selectedNewAsset: selectedNewAsset ?? this.selectedNewAsset,
      selectedAdditionalAsset:
          selectedAdditionalAsset ?? this.selectedAdditionalAsset,
      isAlbumExist: isAlbumExist ?? this.isAlbumExist,
    );
  }

  @override
  String toString() =>
      'AssetSelectionPageResult(selectedNewAsset: $selectedNewAsset, selectedAdditionalAsset: $selectedAdditionalAsset, isAlbumExist: $isAlbumExist)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final setEquals = const DeepCollectionEquality().equals;

    return other is AssetSelectionPageResult &&
        setEquals(other.selectedNewAsset, selectedNewAsset) &&
        setEquals(other.selectedAdditionalAsset, selectedAdditionalAsset) &&
        other.isAlbumExist == isAlbumExist;
  }

  @override
  int get hashCode =>
      selectedNewAsset.hashCode ^
      selectedAdditionalAsset.hashCode ^
      isAlbumExist.hashCode;
}
