part of 'asset.model.dart';

class MergedAsset extends Asset {
  final String remoteId;
  final String localId;

  const MergedAsset({
    required this.remoteId,
    required this.localId,
    required super.name,
    required super.checksum,
    required super.type,
    required super.createdAt,
    required super.updatedAt,
    super.durationInSeconds,
  });

  @override
  String toString() {
    return '''MergedAsset {
   remoteId: $remoteId,
   localId: $localId,
   name: $name,
   type: $type,
   createdAt: $createdAt,
   updatedAt: $updatedAt,
   durationInSeconds: ${durationInSeconds ?? "<NA>"}
 }''';
  }

  @override
  bool operator ==(Object other) {
    if (other is! MergedAsset) return false;
    if (identical(this, other)) return true;
    return super == other &&
        remoteId == other.remoteId &&
        localId == other.localId;
  }

  @override
  int get hashCode {
    return super.hashCode ^ remoteId.hashCode ^ localId.hashCode;
  }
}
