class DeviceAssetState {
  final int uniqueAssetsToBackup;
  final int backedUpAssets;

  const DeviceAssetState({
    required this.uniqueAssetsToBackup,
    required this.backedUpAssets,
  });

  int get assetsRemaining => uniqueAssetsToBackup - backedUpAssets;

  DeviceAssetState copyWith({
    int? uniqueAssetsToBackup,
    int? backedUpAssets,
  }) {
    return DeviceAssetState(
      uniqueAssetsToBackup: uniqueAssetsToBackup ?? this.uniqueAssetsToBackup,
      backedUpAssets: backedUpAssets ?? this.backedUpAssets,
    );
  }

  @override
  String toString() =>
      'DeviceAssetState(uniqueAssetsToBackup: $uniqueAssetsToBackup, backedUpAssets: $backedUpAssets)';

  @override
  bool operator ==(covariant DeviceAssetState other) {
    if (identical(this, other)) return true;

    return other.uniqueAssetsToBackup == uniqueAssetsToBackup &&
        other.backedUpAssets == backedUpAssets;
  }

  @override
  int get hashCode => uniqueAssetsToBackup.hashCode ^ backedUpAssets.hashCode;
}
