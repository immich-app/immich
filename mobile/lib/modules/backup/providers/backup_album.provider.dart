import 'package:immich_mobile/modules/album/models/album.model.dart';
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
      selectedBackupAlbums: await db.localAlbums
          .filter()
          .backupSelectionEqualTo(BackupSelection.select)
          .findAll(),
      excludedBackupAlbums: await db.localAlbums
          .filter()
          .backupSelectionEqualTo(BackupSelection.exclude)
          .findAll(),
    );
  }

  void addSelectedAlbumForBackup(LocalAlbum album) async {
    if (state.valueOrNull?.selectedBackupAlbums.any((a) => a.id == album.id) ??
        false) {
      removeAlbumForBackup(album);
    }

    album.backupSelection = BackupSelection.select;
    await ref
        .read(dbProvider)
        .writeTxn(() => ref.read(dbProvider).localAlbums.put(album));

    ref.invalidateSelf();
  }

  void addExcludedAlbumForBackup(LocalAlbum album) async {
    if (state.valueOrNull?.selectedBackupAlbums.any((a) => a.id == album.id) ??
        false) {
      removeAlbumForBackup(album);
    }

    album.backupSelection = BackupSelection.exclude;
    await ref
        .read(dbProvider)
        .writeTxn(() => ref.read(dbProvider).localAlbums.put(album));

    ref.invalidateSelf();
  }

  void removeAlbumForBackup(LocalAlbum album) async {
    album.backupSelection = BackupSelection.none;
    await ref
        .read(dbProvider)
        .writeTxn(() => ref.read(dbProvider).localAlbums.put(album));

    ref.invalidateSelf();
  }
}
