import 'package:flutter/foundation.dart';
import 'package:immich_mobile/modules/backup/models/backup_album.model.dart';
import 'package:isar/isar.dart';

part 'device_asset.g.dart';

@Collection()
class DeviceAsset {
  DeviceAsset({
    required this.id,
    required this.hash,
    this.backupSelection = BackupSelection.none,
  });

  Id get isarId => Isar.autoIncrement;
  @Index(replace: true, unique: true, type: IndexType.hash)
  String id;

  @Index(unique: false, type: IndexType.hash)
  List<byte> hash;

  @enumerated
  BackupSelection backupSelection;

  @override
  String toString() {
    return 'DeviceAsset(id: $id, hash: $hash, backupSelection: $backupSelection)';
  }

  @override
  bool operator ==(covariant DeviceAsset other) {
    if (identical(this, other)) return true;

    return other.id == id &&
        listEquals(other.hash, hash) &&
        other.backupSelection == backupSelection;
  }

  @override
  @ignore
  int get hashCode {
    return id.hashCode ^ hash.hashCode ^ backupSelection.hashCode;
  }
}
