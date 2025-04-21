part of 'asset.model.dart';

class LocalAsset extends Asset {
  final String localId;
  final int? width;
  final int? height;

  const LocalAsset({
    required this.localId,
    required super.name,
    super.checksum,
    required super.type,
    required super.createdAt,
    required super.updatedAt,
    this.width,
    this.height,
    super.durationInSeconds,
  });

  @override
  String toString() {
    return '''LocalAsset {
   localId: $localId,
   name: $name,
   type: $type,
   createdAt: $createdAt,
   updatedAt: $updatedAt,
   width: ${width ?? "<NA>"},
   height: ${height ?? "<NA>"},
   durationInSeconds: ${durationInSeconds ?? "<NA>"}
 }''';
  }

  @override
  bool operator ==(Object other) {
    if (other is! LocalAsset) return false;
    if (identical(this, other)) return true;
    return super == other &&
        localId == other.localId &&
        width == other.width &&
        height == other.height;
  }

  @override
  int get hashCode {
    return super.hashCode ^ localId.hashCode;
  }

  LocalAsset copyWith({
    String? localId,
    String? name,
    String? checksum,
    AssetType? type,
    DateTime? createdAt,
    DateTime? updatedAt,
    NullableValue<int> width = const NullableValue.absent(),
    NullableValue<int> height = const NullableValue.absent(),
    NullableValue<int> durationInSeconds = const NullableValue.absent(),
  }) {
    return LocalAsset(
      localId: localId ?? this.localId,
      name: name ?? this.name,
      checksum: checksum ?? this.checksum,
      type: type ?? this.type,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      width: width.getOrDefault(this.width),
      height: height.getOrDefault(this.height),
      durationInSeconds: durationInSeconds.getOrDefault(this.durationInSeconds),
    );
  }
}
