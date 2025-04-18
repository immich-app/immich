part of 'asset.model.dart';

class LocalAsset extends Asset {
  final String localId;

  const LocalAsset({
    required this.localId,
    required super.name,
    super.checksum,
    required super.type,
    required super.createdAt,
    required super.updatedAt,
    super.width,
    super.height,
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
    return super == other && localId == other.localId;
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
    int? width,
    int? height,
    int? durationInSeconds,
  }) {
    return LocalAsset(
      localId: localId ?? this.localId,
      name: name ?? this.name,
      checksum: checksum ?? this.checksum,
      type: type ?? this.type,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      width: width ?? this.width,
      height: height ?? this.height,
      durationInSeconds: durationInSeconds ?? this.durationInSeconds,
    );
  }
}
