import 'package:immich_mobile/entities/asset.entity.dart';

class AssetSelectionState {
  final bool hasRemote;
  final bool hasLocal;
  final bool hasMerged;
  final int selectedCount;

  const AssetSelectionState({
    this.hasRemote = false,
    this.hasLocal = false,
    this.hasMerged = false,
    this.selectedCount = 0,
  });

  AssetSelectionState copyWith({
    bool? hasRemote,
    bool? hasLocal,
    bool? hasMerged,
    int? selectedCount,
  }) {
    return AssetSelectionState(
      hasRemote: hasRemote ?? this.hasRemote,
      hasLocal: hasLocal ?? this.hasLocal,
      hasMerged: hasMerged ?? this.hasMerged,
      selectedCount: selectedCount ?? this.selectedCount,
    );
  }

  AssetSelectionState.fromSelection(Set<Asset> selection)
      : hasLocal = selection.any((e) => e.storage == AssetState.local),
        hasMerged = selection.any((e) => e.storage == AssetState.merged),
        hasRemote = selection.any((e) => e.storage == AssetState.remote),
        selectedCount = selection.length;

  @override
  String toString() =>
      'SelectionAssetState(hasRemote: $hasRemote, hasMerged: $hasMerged, hasMerged: $hasMerged, selectedCount: $selectedCount)';

  @override
  bool operator ==(covariant AssetSelectionState other) {
    if (identical(this, other)) return true;

    return other.hasRemote == hasRemote &&
        other.hasLocal == hasLocal &&
        other.hasMerged == hasMerged &&
        other.selectedCount == selectedCount;
  }

  @override
  int get hashCode =>
      hasRemote.hashCode ^
      hasLocal.hashCode ^
      hasMerged.hashCode ^
      selectedCount.hashCode;
}
