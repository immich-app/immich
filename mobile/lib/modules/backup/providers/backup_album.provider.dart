import 'package:immich_mobile/extensions/album_extensions.dart';
import 'package:immich_mobile/modules/album/models/album.model.dart';
import 'package:immich_mobile/modules/backup/models/backup_album.model.dart';
import 'package:immich_mobile/modules/backup/models/backup_album_state.model.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:isar/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'backup_album.provider.g.dart';

@riverpod
class BackupAlbums extends _$BackupAlbums {
  @override
  Future<BackupAlbumState> build() async {
    final db = ref.read(dbProvider);
    return BackupAlbumState(
      selectedBackupAlbums: await db.backupAlbums
          .filter()
          .selectionEqualTo(BackupSelection.select)
          .findAll(),
      excludedBackupAlbums: await db.backupAlbums
          .filter()
          .selectionEqualTo(BackupSelection.exclude)
          .findAll(),
    );
  }

  void addAlbumForBackup(LocalAlbum album, BackupSelection selection) async {
    final db = ref.read(dbProvider);
    final albumInDB =
        await db.backupAlbums.filter().idEqualTo(album.id).findFirst();
    albumInDB?.selection = selection;
    final backupAlbum = albumInDB ??
        BackupAlbum(
          id: album.id,
          lastBackup: DateTime.fromMillisecondsSinceEpoch(0, isUtc: true),
          selection: selection,
        );
    backupAlbum.album.value = album;
    await db.writeTxn(() => db.backupAlbums.store(backupAlbum));

    ref.invalidateSelf();
  }

  void updateAlbumSelection(
    BackupAlbum album,
    BackupSelection selection,
  ) async {
    final db = ref.read(dbProvider);
    album.selection = selection;
    await db.writeTxn(() => db.backupAlbums.put(album));

    ref.invalidateSelf();
  }
}
