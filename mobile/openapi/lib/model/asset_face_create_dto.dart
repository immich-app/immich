// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetFaceCreateDto {
  const AssetFaceCreateDto({
    required this.assetId,
    required this.height,
    required this.imageHeight,
    required this.imageWidth,
    required this.personId,
    required this.width,
    required this.x,
    required this.y,
  });

  /// Asset ID
  final String assetId;

  /// Face bounding box height
  final int height;

  /// Image height in pixels
  final int imageHeight;

  /// Image width in pixels
  final int imageWidth;

  /// Person ID
  final String personId;

  /// Face bounding box width
  final int width;

  /// Face bounding box X coordinate
  final int x;

  /// Face bounding box Y coordinate
  final int y;

  static AssetFaceCreateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetFaceCreateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      assetId: json[r'assetId'] as String,
      height: json[r'height'] as int,
      imageHeight: json[r'imageHeight'] as int,
      imageWidth: json[r'imageWidth'] as int,
      personId: json[r'personId'] as String,
      width: json[r'width'] as int,
      x: json[r'x'] as int,
      y: json[r'y'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'assetId'] = assetId;
    json[r'height'] = height;
    json[r'imageHeight'] = imageHeight;
    json[r'imageWidth'] = imageWidth;
    json[r'personId'] = personId;
    json[r'width'] = width;
    json[r'x'] = x;
    json[r'y'] = y;
    return json;
  }

  AssetFaceCreateDto copyWith({
    String? assetId,
    int? height,
    int? imageHeight,
    int? imageWidth,
    String? personId,
    int? width,
    int? x,
    int? y,
  }) {
    return .new(
      assetId: assetId ?? this.assetId,
      height: height ?? this.height,
      imageHeight: imageHeight ?? this.imageHeight,
      imageWidth: imageWidth ?? this.imageWidth,
      personId: personId ?? this.personId,
      width: width ?? this.width,
      x: x ?? this.x,
      y: y ?? this.y,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetFaceCreateDto &&
            assetId == other.assetId &&
            height == other.height &&
            imageHeight == other.imageHeight &&
            imageWidth == other.imageWidth &&
            personId == other.personId &&
            width == other.width &&
            x == other.x &&
            y == other.y);
  }

  @override
  int get hashCode {
    return Object.hashAll([assetId, height, imageHeight, imageWidth, personId, width, x, y]);
  }

  @override
  String toString() =>
      'AssetFaceCreateDto(assetId=$assetId, height=$height, imageHeight=$imageHeight, imageWidth=$imageWidth, personId=$personId, width=$width, x=$x, y=$y)';
}
