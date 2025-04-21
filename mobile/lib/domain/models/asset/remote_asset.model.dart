part of 'asset.model.dart';

class RemoteAsset extends Asset {
  final String remoteId;
  final bool isFavorite;
  final String ownerId;
  final DateTime localDateTime;
  final String? thumbhash;
  final DateTime? deletedAt;

  const RemoteAsset({
    required this.remoteId,
    required this.ownerId,
    required super.name,
    required super.checksum,
    required super.type,
    required this.isFavorite,
    required this.localDateTime,
    required super.createdAt,
    required super.updatedAt,
    this.deletedAt,
    this.thumbhash,
    super.durationInSeconds,
  });

  @override
  String toString() {
    return '''RemoteAsset {
   remoteId: $remoteId,
   ownerId: $ownerId,
   name: $name,
   type: $type,
   isFavorite: $isFavorite,
   createdAt: $createdAt,
   updatedAt: $updatedAt,
   localDateTime: $localDateTime,
   deletedAt: ${deletedAt ?? "<NA>"},
   durationInSeconds: ${durationInSeconds ?? "<NA>"},
 }''';
  }

  @override
  bool operator ==(Object other) {
    if (other is! RemoteAsset) return false;
    if (identical(this, other)) return true;
    return super == other &&
        remoteId == other.remoteId &&
        isFavorite == other.isFavorite &&
        ownerId == other.ownerId &&
        localDateTime == other.localDateTime &&
        deletedAt == other.deletedAt &&
        thumbhash == other.thumbhash;
  }

  @override
  int get hashCode {
    return super.hashCode ^
        remoteId.hashCode ^
        isFavorite.hashCode ^
        ownerId.hashCode ^
        localDateTime.hashCode ^
        deletedAt.hashCode ^
        thumbhash.hashCode;
  }
}
