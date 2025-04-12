part of 'asset.model.dart';

class RemoteAsset extends Asset {
  final String remoteId;

  const RemoteAsset({
    required this.remoteId,
    required super.name,
    required super.checksum,
    required super.type,
    required super.createdAt,
    required super.updatedAt,
    super.width,
    super.height,
    super.durationInSeconds,
  });

  @override
  String toString() {
    return '''RemoteAsset {
   remoteId: $remoteId,
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
    if (other is! RemoteAsset) return false;
    if (identical(this, other)) return true;
    return super == other && remoteId == other.remoteId;
  }

  @override
  int get hashCode {
    return super.hashCode ^ remoteId.hashCode;
  }
}
