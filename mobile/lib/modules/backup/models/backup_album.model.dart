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
  @enumerated
  BackupSelection selection;

  static const albumLinkId = 'album';
  final album = IsarLink<LocalAlbum>();

  BackupAlbum({
    required this.id,
    this.selection = BackupSelection.none,
  });

  BackupAlbum copyWith({
    String? id,
    BackupSelection? selection,
  }) {
    return BackupAlbum(
      id: id ?? this.id,
      selection: selection ?? this.selection,
    );
  }

  @override
  String toString() => 'BackupAlbum(id: $id, selection: $selection)';

  @override
  bool operator ==(covariant BackupAlbum other) {
    if (identical(this, other)) return true;

    return other.id == id && other.selection == selection;
  }

  @override
  int get hashCode => id.hashCode ^ selection.hashCode;
}
