// Model for an asset face stored in the server
class AssetFace {
  final String id;
  final String assetId;
  final String? personId;
  final int imageWidth;
  final int imageHeight;
  final int boundingBoxX1;
  final int boundingBoxY1;
  final int boundingBoxX2;
  final int boundingBoxY2;
  final String sourceType;

  const AssetFace({
    required this.id,
    required this.assetId,
    this.personId,
    required this.imageWidth,
    required this.imageHeight,
    required this.boundingBoxX1,
    required this.boundingBoxY1,
    required this.boundingBoxX2,
    required this.boundingBoxY2,
    required this.sourceType,
  });

  AssetFace copyWith({
    String? id,
    String? assetId,
    String? personId,
    int? imageWidth,
    int? imageHeight,
    int? boundingBoxX1,
    int? boundingBoxY1,
    int? boundingBoxX2,
    int? boundingBoxY2,
    String? sourceType,
  }) {
    return AssetFace(
      id: id ?? this.id,
      assetId: assetId ?? this.assetId,
      personId: personId ?? this.personId,
      imageWidth: imageWidth ?? this.imageWidth,
      imageHeight: imageHeight ?? this.imageHeight,
      boundingBoxX1: boundingBoxX1 ?? this.boundingBoxX1,
      boundingBoxY1: boundingBoxY1 ?? this.boundingBoxY1,
      boundingBoxX2: boundingBoxX2 ?? this.boundingBoxX2,
      boundingBoxY2: boundingBoxY2 ?? this.boundingBoxY2,
      sourceType: sourceType ?? this.sourceType,
    );
  }

  @override
  String toString() {
    return '''AssetFace {
    id: $id,
    assetId: $assetId,
    personId: ${personId ?? "<NA>"},
    imageWidth: $imageWidth,
    imageHeight: $imageHeight,
    boundingBoxX1: $boundingBoxX1,
    boundingBoxY1: $boundingBoxY1,
    boundingBoxX2: $boundingBoxX2,
    boundingBoxY2: $boundingBoxY2,
    sourceType: $sourceType,
}''';
  }

  @override
  bool operator ==(covariant AssetFace other) {
    if (identical(this, other)) return true;

    return other.id == id &&
        other.assetId == assetId &&
        other.personId == personId &&
        other.imageWidth == imageWidth &&
        other.imageHeight == imageHeight &&
        other.boundingBoxX1 == boundingBoxX1 &&
        other.boundingBoxY1 == boundingBoxY1 &&
        other.boundingBoxX2 == boundingBoxX2 &&
        other.boundingBoxY2 == boundingBoxY2 &&
        other.sourceType == sourceType;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        assetId.hashCode ^
        personId.hashCode ^
        imageWidth.hashCode ^
        imageHeight.hashCode ^
        boundingBoxX1.hashCode ^
        boundingBoxY1.hashCode ^
        boundingBoxX2.hashCode ^
        boundingBoxY2.hashCode ^
        sourceType.hashCode;
  }
}
