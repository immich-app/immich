import 'package:collection/collection.dart';
import 'package:immich_mobile/entities/asset.entity.dart';

class AssetSelectionPageResult {
  final Set<Asset> selectedAssets;

  AssetSelectionPageResult({
    required this.selectedAssets,
  });
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final setEquals = const DeepCollectionEquality().equals;

    return other is AssetSelectionPageResult &&
        setEquals(other.selectedAssets, selectedAssets);
  }

  @override
  int get hashCode => selectedAssets.hashCode;
}
