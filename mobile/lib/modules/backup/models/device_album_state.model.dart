import 'package:collection/collection.dart';

class DeviceAssetState {
  final List<String> assetIdsForBackup;
  final int uniqueAssetsToBackup;
  final int backedUpAssets;

  const DeviceAssetState({
    required this.assetIdsForBackup,
    required this.uniqueAssetsToBackup,
    required this.backedUpAssets,
  });

  int get assetsRemaining => uniqueAssetsToBackup - backedUpAssets;

  DeviceAssetState copyWith({
    List<String>? assetIdsForBackup,
    int? uniqueAssetsToBackup,
    int? backedUpAssets,
  }) {
    return DeviceAssetState(
      assetIdsForBackup: assetIdsForBackup ?? this.assetIdsForBackup,
      uniqueAssetsToBackup: uniqueAssetsToBackup ?? this.uniqueAssetsToBackup,
      backedUpAssets: backedUpAssets ?? this.backedUpAssets,
    );
  }

  @override
  String toString() =>
      'DeviceAssetState(assetIdsForBackup: $assetIdsForBackup, uniqueAssetsToBackup: $uniqueAssetsToBackup, backedUpAssets: $backedUpAssets)';

  @override
  bool operator ==(covariant DeviceAssetState other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return listEquals(other.assetIdsForBackup, assetIdsForBackup) &&
        other.uniqueAssetsToBackup == uniqueAssetsToBackup &&
        other.backedUpAssets == backedUpAssets;
  }

  @override
  int get hashCode =>
      assetIdsForBackup.hashCode ^
      uniqueAssetsToBackup.hashCode ^
      backedUpAssets.hashCode;
}
