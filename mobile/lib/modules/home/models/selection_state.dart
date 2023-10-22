import 'package:immich_mobile/shared/models/asset.dart';

class SelectionAssetState {
  final bool hasRemote;
  final bool hasLocal;
  final bool hasMerged;

  const SelectionAssetState({
    this.hasRemote = false,
    this.hasLocal = false,
    this.hasMerged = false,
  });

  SelectionAssetState copyWith({
    bool? hasRemote,
    bool? hasLocal,
    bool? hasMerged,
  }) {
    return SelectionAssetState(
      hasRemote: hasRemote ?? this.hasRemote,
      hasLocal: hasLocal ?? this.hasLocal,
      hasMerged: hasMerged ?? this.hasMerged,
    );
  }

  SelectionAssetState.fromSelection(Set<Asset> selection)
      : hasLocal = selection.any((e) => e.storage == AssetState.local),
        hasMerged = selection.any((e) => e.storage == AssetState.merged),
        hasRemote = selection.any((e) => e.storage == AssetState.remote);

  @override
  String toString() =>
      'SelectionAssetState(hasRemote: $hasRemote, hasMerged: $hasMerged, hasMerged: $hasMerged)';

  @override
  bool operator ==(covariant SelectionAssetState other) {
    if (identical(this, other)) return true;

    return other.hasRemote == hasRemote &&
        other.hasLocal == hasLocal &&
        other.hasMerged == hasMerged;
  }

  @override
  int get hashCode =>
      hasRemote.hashCode ^ hasLocal.hashCode ^ hasMerged.hashCode;
}
