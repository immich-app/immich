// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncAssetFaceV2 {
  const SyncAssetFaceV2({
    required this.assetId,
    required this.boundingBoxX1,
    required this.boundingBoxX2,
    required this.boundingBoxY1,
    required this.boundingBoxY2,
    required this.deletedAt,
    required this.id,
    required this.imageHeight,
    required this.imageWidth,
    required this.isVisible,
    required this.personId,
    required this.sourceType,
  });

  /// Asset ID
  final String assetId;

  /// Bounding box X1
  final int boundingBoxX1;

  /// Bounding box X2
  final int boundingBoxX2;

  /// Bounding box Y1
  final int boundingBoxY1;

  /// Bounding box Y2
  final int boundingBoxY2;

  /// Face deleted at
  final DateTime? deletedAt;

  /// Asset face ID
  final String id;

  /// Image height
  final int imageHeight;

  /// Image width
  final int imageWidth;

  /// Is the face visible in the asset
  final bool isVisible;

  /// Person ID
  final String? personId;

  /// Source type
  final String sourceType;

  static const _undefined = Object();

  static SyncAssetFaceV2? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncAssetFaceV2>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      assetId: json[r'assetId'] as String,
      boundingBoxX1: json[r'boundingBoxX1'] as int,
      boundingBoxX2: json[r'boundingBoxX2'] as int,
      boundingBoxY1: json[r'boundingBoxY1'] as int,
      boundingBoxY2: json[r'boundingBoxY2'] as int,
      deletedAt: (json[r'deletedAt'] == null ? null : DateTime.parse(json[r'deletedAt'] as String)),
      id: json[r'id'] as String,
      imageHeight: json[r'imageHeight'] as int,
      imageWidth: json[r'imageWidth'] as int,
      isVisible: json[r'isVisible'] as bool,
      personId: (json[r'personId'] as String?),
      sourceType: json[r'sourceType'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'assetId'] = assetId;
    json[r'boundingBoxX1'] = boundingBoxX1;
    json[r'boundingBoxX2'] = boundingBoxX2;
    json[r'boundingBoxY1'] = boundingBoxY1;
    json[r'boundingBoxY2'] = boundingBoxY2;
    if (deletedAt != null) {
      json[r'deletedAt'] = deletedAt!.toUtc().toIso8601String();
    }
    json[r'id'] = id;
    json[r'imageHeight'] = imageHeight;
    json[r'imageWidth'] = imageWidth;
    json[r'isVisible'] = isVisible;
    if (personId != null) {
      json[r'personId'] = personId!;
    }
    json[r'sourceType'] = sourceType;
    return json;
  }

  SyncAssetFaceV2 copyWith({
    String? assetId,
    int? boundingBoxX1,
    int? boundingBoxX2,
    int? boundingBoxY1,
    int? boundingBoxY2,
    Object? deletedAt = _undefined,
    String? id,
    int? imageHeight,
    int? imageWidth,
    bool? isVisible,
    Object? personId = _undefined,
    String? sourceType,
  }) {
    return .new(
      assetId: assetId ?? this.assetId,
      boundingBoxX1: boundingBoxX1 ?? this.boundingBoxX1,
      boundingBoxX2: boundingBoxX2 ?? this.boundingBoxX2,
      boundingBoxY1: boundingBoxY1 ?? this.boundingBoxY1,
      boundingBoxY2: boundingBoxY2 ?? this.boundingBoxY2,
      deletedAt: identical(deletedAt, _undefined) ? this.deletedAt : deletedAt as DateTime?,
      id: id ?? this.id,
      imageHeight: imageHeight ?? this.imageHeight,
      imageWidth: imageWidth ?? this.imageWidth,
      isVisible: isVisible ?? this.isVisible,
      personId: identical(personId, _undefined) ? this.personId : personId as String?,
      sourceType: sourceType ?? this.sourceType,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SyncAssetFaceV2 &&
            assetId == other.assetId &&
            boundingBoxX1 == other.boundingBoxX1 &&
            boundingBoxX2 == other.boundingBoxX2 &&
            boundingBoxY1 == other.boundingBoxY1 &&
            boundingBoxY2 == other.boundingBoxY2 &&
            deletedAt == other.deletedAt &&
            id == other.id &&
            imageHeight == other.imageHeight &&
            imageWidth == other.imageWidth &&
            isVisible == other.isVisible &&
            personId == other.personId &&
            sourceType == other.sourceType);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      assetId,
      boundingBoxX1,
      boundingBoxX2,
      boundingBoxY1,
      boundingBoxY2,
      deletedAt,
      id,
      imageHeight,
      imageWidth,
      isVisible,
      personId,
      sourceType,
    ]);
  }

  @override
  String toString() =>
      'SyncAssetFaceV2(assetId=$assetId, boundingBoxX1=$boundingBoxX1, boundingBoxX2=$boundingBoxX2, boundingBoxY1=$boundingBoxY1, boundingBoxY2=$boundingBoxY2, deletedAt=$deletedAt, id=$id, imageHeight=$imageHeight, imageWidth=$imageWidth, isVisible=$isVisible, personId=$personId, sourceType=$sourceType)';
}
