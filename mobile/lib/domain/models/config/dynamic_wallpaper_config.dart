class DynamicWallpaperConfig {
  final List<String> assetIds;

  const DynamicWallpaperConfig({this.assetIds = const []});

  DynamicWallpaperConfig copyWith({List<String>? assetIds}) =>
      DynamicWallpaperConfig(assetIds: assetIds ?? this.assetIds);

  @override
  bool operator ==(Object other) =>
      identical(this, other) || (other is DynamicWallpaperConfig && _listEquals(other.assetIds, assetIds));

  @override
  int get hashCode => Object.hashAll(assetIds);

  @override
  String toString() => 'DynamicWallpaperConfig(assetIds: $assetIds)';
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
