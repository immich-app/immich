// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class CropParameters {
  const CropParameters({required this.height, required this.width, required this.x, required this.y});

  /// Height of the crop
  final int height;

  /// Width of the crop
  final int width;

  /// Top-Left X coordinate of crop
  final int x;

  /// Top-Left Y coordinate of crop
  final int y;

  static CropParameters? fromJson(dynamic value) {
    ApiCompat.upgrade<CropParameters>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      height: json[r'height'] as int,
      width: json[r'width'] as int,
      x: json[r'x'] as int,
      y: json[r'y'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'height'] = height;
    json[r'width'] = width;
    json[r'x'] = x;
    json[r'y'] = y;
    return json;
  }

  CropParameters copyWith({int? height, int? width, int? x, int? y}) {
    return .new(height: height ?? this.height, width: width ?? this.width, x: x ?? this.x, y: y ?? this.y);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is CropParameters && height == other.height && width == other.width && x == other.x && y == other.y);
  }

  @override
  int get hashCode {
    return Object.hashAll([height, width, x, y]);
  }

  @override
  String toString() => 'CropParameters(height=$height, width=$width, x=$x, y=$y)';
}
