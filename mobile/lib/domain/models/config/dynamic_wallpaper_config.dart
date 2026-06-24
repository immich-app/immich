class DynamicWallpaperConfig {
  final List<String> assetIds;
  final int intervalMinutes;

  const DynamicWallpaperConfig({
    this.assetIds = const [],
    this.intervalMinutes = 60,
  });

  DynamicWallpaperConfig copyWith({
    List<String>? assetIds,
    int? intervalMinutes,
  }) => DynamicWallpaperConfig(
    assetIds: assetIds ?? this.assetIds,
    intervalMinutes: intervalMinutes ?? this.intervalMinutes,
  );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is DynamicWallpaperConfig &&
          other.intervalMinutes == intervalMinutes &&
          _listEquals(other.assetIds, assetIds));

  @override
  int get hashCode => Object.hash(Object.hashAll(assetIds), intervalMinutes);

  @override
  String toString() => 'DynamicWallpaperConfig(assetIds: $assetIds, intervalMinutes: $intervalMinutes)';
}

bool _listEquals<T>(List<T> a, List<T> b) {
  if (a.length != b.length) {
    return false;
  }

  for (var i = 0; i < a.length; i++) {
    if (a[i] != b[i]) {
      return false;
    }
  }

  return true;
}
