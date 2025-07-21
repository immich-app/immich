import 'package:immich_mobile/utils/hash.dart';
import 'package:isar/isar.dart';

part 'backup_album.entity.g.dart';

@Collection(inheritance: false)
class BackupAlbum {
  String id;
  DateTime lastBackup;
  @Enumerated(EnumType.ordinal)
  BackupSelection selection;

  BackupAlbum(this.id, this.lastBackup, this.selection);

  Id get isarId => fastHash(id);

  BackupAlbum copyWith({
    String? id,
    DateTime? lastBackup,
    BackupSelection? selection,
  }) {
    return BackupAlbum(
      id ?? this.id,
      lastBackup ?? this.lastBackup,
      selection ?? this.selection,
    );
  }
}

enum BackupSelection {
  none,
  select,
  exclude;
}
