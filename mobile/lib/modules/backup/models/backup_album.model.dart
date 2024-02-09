import 'package:immich_mobile/modules/album/models/album.model.dart';
import 'package:immich_mobile/utils/hash.dart';
import 'package:isar/isar.dart';

part 'backup_album.model.g.dart';

enum BackupSelection {
  none,
  select,
  exclude;
}

@Collection(inheritance: false)
class BackupAlbum {
  Id get isarId => fastHash(id);
  String id;
  DateTime lastBackup;
  @enumerated
  BackupSelection selection;

  static const albumLinkId = 'album';
  final album = IsarLink<LocalAlbum>();

  BackupAlbum({
    required this.id,
    required this.lastBackup,
    this.selection = BackupSelection.none,
  });

  BackupAlbum copyWith({
    String? id,
    DateTime? lastBackup,
    BackupSelection? selection,
  }) {
    return BackupAlbum(
      id: id ?? this.id,
      lastBackup: lastBackup ?? this.lastBackup,
      selection: selection ?? this.selection,
    );
  }

  @override
  String toString() =>
      'BackupAlbum(id: $id, lastBackup: $lastBackup, selection: $selection)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is BackupAlbum &&
        other.id == id &&
        other.lastBackup == lastBackup &&
        other.selection == selection;
  }

  @override
  int get hashCode => id.hashCode ^ lastBackup.hashCode ^ selection.hashCode;
}
