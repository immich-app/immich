// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Asset face with person
final class AssetFaceResponseDto {
  const AssetFaceResponseDto({
    required this.boundingBoxX1,
    required this.boundingBoxX2,
    required this.boundingBoxY1,
    required this.boundingBoxY2,
    required this.id,
    required this.imageHeight,
    required this.imageWidth,
    required this.person,
    this.sourceType,
  });

  /// Bounding box X1 coordinate
  final int boundingBoxX1;

  /// Bounding box X2 coordinate
  final int boundingBoxX2;

  /// Bounding box Y1 coordinate
  final int boundingBoxY1;

  /// Bounding box Y2 coordinate
  final int boundingBoxY2;

  /// Face ID
  final String id;

  /// Image height in pixels
  final int imageHeight;

  /// Image width in pixels
  final int imageWidth;

  final PersonResponseDto? person;

  final SourceType? sourceType;

  static const _undefined = Object();

  static AssetFaceResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetFaceResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      boundingBoxX1: json[r'boundingBoxX1'] as int,
      boundingBoxX2: json[r'boundingBoxX2'] as int,
      boundingBoxY1: json[r'boundingBoxY1'] as int,
      boundingBoxY2: json[r'boundingBoxY2'] as int,
      id: json[r'id'] as String,
      imageHeight: json[r'imageHeight'] as int,
      imageWidth: json[r'imageWidth'] as int,
      person: PersonResponseDto.fromJson(json[r'person']),
      sourceType: SourceType.fromJson(json[r'sourceType']),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'boundingBoxX1'] = boundingBoxX1;
    json[r'boundingBoxX2'] = boundingBoxX2;
    json[r'boundingBoxY1'] = boundingBoxY1;
    json[r'boundingBoxY2'] = boundingBoxY2;
    json[r'id'] = id;
    json[r'imageHeight'] = imageHeight;
    json[r'imageWidth'] = imageWidth;
    if (person != null) {
      json[r'person'] = person!.toJson();
    }
    if (sourceType != null) {
      json[r'sourceType'] = sourceType!.toJson();
    }
    return json;
  }

  AssetFaceResponseDto copyWith({
    int? boundingBoxX1,
    int? boundingBoxX2,
    int? boundingBoxY1,
    int? boundingBoxY2,
    String? id,
    int? imageHeight,
    int? imageWidth,
    Object? person = _undefined,
    Object? sourceType = _undefined,
  }) {
    return .new(
      boundingBoxX1: boundingBoxX1 ?? this.boundingBoxX1,
      boundingBoxX2: boundingBoxX2 ?? this.boundingBoxX2,
      boundingBoxY1: boundingBoxY1 ?? this.boundingBoxY1,
      boundingBoxY2: boundingBoxY2 ?? this.boundingBoxY2,
      id: id ?? this.id,
      imageHeight: imageHeight ?? this.imageHeight,
      imageWidth: imageWidth ?? this.imageWidth,
      person: identical(person, _undefined) ? this.person : person as PersonResponseDto?,
      sourceType: identical(sourceType, _undefined) ? this.sourceType : sourceType as SourceType?,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetFaceResponseDto &&
            boundingBoxX1 == other.boundingBoxX1 &&
            boundingBoxX2 == other.boundingBoxX2 &&
            boundingBoxY1 == other.boundingBoxY1 &&
            boundingBoxY2 == other.boundingBoxY2 &&
            id == other.id &&
            imageHeight == other.imageHeight &&
            imageWidth == other.imageWidth &&
            person == other.person &&
            sourceType == other.sourceType);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      boundingBoxX1,
      boundingBoxX2,
      boundingBoxY1,
      boundingBoxY2,
      id,
      imageHeight,
      imageWidth,
      person,
      sourceType,
    ]);
  }

  @override
  String toString() =>
      'AssetFaceResponseDto(boundingBoxX1=$boundingBoxX1, boundingBoxX2=$boundingBoxX2, boundingBoxY1=$boundingBoxY1, boundingBoxY2=$boundingBoxY2, id=$id, imageHeight=$imageHeight, imageWidth=$imageWidth, person=$person, sourceType=$sourceType)';
}
