import 'package:flutter/foundation.dart';
import 'package:immich_mobile/utils/collection_util.dart';

@immutable
class Album {
  final int? id;
  final String? localId;
  final String? remoteId;
  final String name;
  final DateTime modifiedTime;
  final int? thumbnailAssetId;

  bool get isRemote => remoteId != null;
  bool get isLocal => localId != null;

  const Album({
    this.id,
    this.localId,
    this.remoteId,
    required this.name,
    required this.modifiedTime,
    this.thumbnailAssetId,
  });

  @override
  bool operator ==(covariant Album other) {
    if (identical(this, other)) return true;

    return other.id == id &&
        other.localId == localId &&
        other.remoteId == remoteId &&
        other.name == name &&
        other.modifiedTime == modifiedTime &&
        other.thumbnailAssetId == thumbnailAssetId;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        localId.hashCode ^
        remoteId.hashCode ^
        name.hashCode ^
        modifiedTime.hashCode ^
        thumbnailAssetId.hashCode;
  }

  Album copyWith({
    int? id,
    String? localId,
    String? remoteId,
    String? name,
    DateTime? modifiedTime,
    int? thumbnailAssetId,
  }) {
    return Album(
      id: id ?? this.id,
      localId: localId ?? this.localId,
      remoteId: remoteId ?? this.remoteId,
      name: name ?? this.name,
      modifiedTime: modifiedTime ?? this.modifiedTime,
      thumbnailAssetId: thumbnailAssetId ?? this.thumbnailAssetId,
    );
  }

  @override
  String toString() => """
{
  id: ${id ?? "-"},
  localId: "${localId ?? "-"}",
  remoteId: "${remoteId ?? "-"}",
  name: $name,
  modifiedTime:
  $modifiedTime,
  thumbnailAssetId: "${thumbnailAssetId ?? "-"}",
}""";

  static int compareByLocalId(Album a, Album b) =>
      CollectionUtil.compareToNullable(a.localId, b.localId);

  static int compareByRemoteId(Album a, Album b) =>
      CollectionUtil.compareToNullable(a.remoteId, b.remoteId);
}
