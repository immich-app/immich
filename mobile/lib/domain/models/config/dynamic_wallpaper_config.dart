import 'dart:convert';
import 'dart:ui';

class DynamicWallpaperConfig {
  final List<String> assetIds;
  final Map<String, DynamicWallpaperAssetLayout> assetLayouts;

  const DynamicWallpaperConfig({this.assetIds = const [], this.assetLayouts = const {}});

  DynamicWallpaperConfig copyWith({List<String>? assetIds, Map<String, DynamicWallpaperAssetLayout>? assetLayouts}) =>
      DynamicWallpaperConfig(assetIds: assetIds ?? this.assetIds, assetLayouts: assetLayouts ?? this.assetLayouts);

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is DynamicWallpaperConfig &&
          _listEquals(other.assetIds, assetIds) &&
          _mapEquals(other.assetLayouts, assetLayouts));

  @override
  int get hashCode => Object.hash(Object.hashAll(assetIds), Object.hashAll(assetLayouts.entries));

  @override
  String toString() => 'DynamicWallpaperConfig(assetIds: $assetIds, assetLayouts: $assetLayouts)';
}

class DynamicWallpaperAssetLayout {
  final int rotationDegrees;
  final double cropLeft;
  final double cropTop;
  final double cropRight;
  final double cropBottom;

  static const identity = DynamicWallpaperAssetLayout();

  const DynamicWallpaperAssetLayout({
    this.rotationDegrees = 0,
    this.cropLeft = 0,
    this.cropTop = 0,
    this.cropRight = 1,
    this.cropBottom = 1,
  });

  factory DynamicWallpaperAssetLayout.fromJson(Map<String, dynamic> json) {
    return DynamicWallpaperAssetLayout(
      rotationDegrees: _normalizeRotation((json['rotationDegrees'] as num?)?.toInt() ?? 0),
      cropLeft: _clampUnit((json['cropLeft'] as num?)?.toDouble() ?? 0),
      cropTop: _clampUnit((json['cropTop'] as num?)?.toDouble() ?? 0),
      cropRight: _clampUnit((json['cropRight'] as num?)?.toDouble() ?? 1),
      cropBottom: _clampUnit((json['cropBottom'] as num?)?.toDouble() ?? 1),
    ).normalized();
  }

  DynamicWallpaperAssetLayout copyWith({
    int? rotationDegrees,
    double? cropLeft,
    double? cropTop,
    double? cropRight,
    double? cropBottom,
  }) {
    return DynamicWallpaperAssetLayout(
      rotationDegrees: _normalizeRotation(rotationDegrees ?? this.rotationDegrees),
      cropLeft: cropLeft ?? this.cropLeft,
      cropTop: cropTop ?? this.cropTop,
      cropRight: cropRight ?? this.cropRight,
      cropBottom: cropBottom ?? this.cropBottom,
    ).normalized();
  }

  DynamicWallpaperAssetLayout normalized() {
    final left = _clampUnit(cropLeft);
    final top = _clampUnit(cropTop);
    final right = _clampUnit(cropRight);
    final bottom = _clampUnit(cropBottom);

    return DynamicWallpaperAssetLayout(
      rotationDegrees: _normalizeRotation(rotationDegrees),
      cropLeft: left < right ? left : 0,
      cropTop: top < bottom ? top : 0,
      cropRight: left < right ? right : 1,
      cropBottom: top < bottom ? bottom : 1,
    );
  }

  Rect get crop => Rect.fromLTRB(cropLeft, cropTop, cropRight, cropBottom);

  bool get isIdentity => this == identity;

  Map<String, dynamic> toJson() => {
    'rotationDegrees': rotationDegrees,
    'cropLeft': cropLeft,
    'cropTop': cropTop,
    'cropRight': cropRight,
    'cropBottom': cropBottom,
  };

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is DynamicWallpaperAssetLayout &&
            other.rotationDegrees == rotationDegrees &&
            other.cropLeft == cropLeft &&
            other.cropTop == cropTop &&
            other.cropRight == cropRight &&
            other.cropBottom == cropBottom);
  }

  @override
  int get hashCode => Object.hash(rotationDegrees, cropLeft, cropTop, cropRight, cropBottom);

  @override
  String toString() => jsonEncode(toJson());
}

int _normalizeRotation(int degrees) => ((degrees % 360) + 360) % 360 ~/ 90 * 90;

double _clampUnit(double value) => value.clamp(0.0, 1.0).toDouble();

bool _mapEquals<K, V>(Map<K, V> a, Map<K, V> b) {
  if (a.length != b.length) {
    return false;
  }

  for (final entry in a.entries) {
    if (b[entry.key] != entry.value) {
      return false;
    }
  }

  return true;
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
