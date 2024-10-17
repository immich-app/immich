import 'package:flutter/foundation.dart';
import 'package:immich_mobile/utils/collection_util.dart';

@immutable
class DeviceAssetToHash {
  final int? id;
  final String localId;
  final String hash;
  final DateTime modifiedTime;

  const DeviceAssetToHash({
    this.id,
    required this.localId,
    required this.hash,
    required this.modifiedTime,
  });

  @override
  bool operator ==(covariant DeviceAssetToHash other) {
    if (identical(this, other)) return true;

    return other.id == id &&
        other.localId == localId &&
        other.hash == hash &&
        other.modifiedTime == modifiedTime;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        localId.hashCode ^
        hash.hashCode ^
        modifiedTime.hashCode;
  }

  DeviceAssetToHash copyWith({
    int? id,
    String? localId,
    String? hash,
    DateTime? modifiedTime,
  }) {
    return DeviceAssetToHash(
      id: id ?? this.id,
      localId: localId ?? this.localId,
      hash: hash ?? this.hash,
      modifiedTime: modifiedTime ?? this.modifiedTime,
    );
  }

  @override
  String toString() {
    return 'DeviceAssetToHash(id: ${id ?? "-"}, localId: $localId, hash: $hash, modifiedTime: $modifiedTime)';
  }

  static int compareByLocalId(DeviceAssetToHash a, DeviceAssetToHash b) =>
      CollectionUtil.compareToNullable(a.localId, b.localId);
}
