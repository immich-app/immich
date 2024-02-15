import 'package:immich_mobile/modules/album/models/album.model.dart';
import 'package:immich_mobile/modules/backup/models/backup_album.model.dart';
import 'package:immich_mobile/modules/backup/models/backup_album_state.model.dart';
import 'package:immich_mobile/modules/backup/providers/device_assets.provider.dart';
import 'package:immich_mobile/modules/backup/services/backup_album.service.dart';
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

  void _reloadProviders() {
    ref.invalidateSelf();
    ref.invalidate(deviceAssetsProvider);
  }

  Future<void> addBackupAlbum(
    LocalAlbum album,
    BackupSelection selection,
  ) async {
    await ref.read(backupAlbumServiceProvider).addBackupAlbum(album, selection);
    _reloadProviders();
  }

  Future<void> syncWithLocalAlbum(LocalAlbum album) async {
    await ref.read(backupAlbumServiceProvider).syncWithLocalAlbum(album);
    _reloadProviders();
  }

  Future<void> _updateAlbumSelection(
    LocalAlbum localAlbum,
    BackupSelection selection,
  ) async {
    await ref
        .read(backupAlbumServiceProvider)
        .updateAlbumSelection(localAlbum, selection);
    _reloadProviders();
  }

  Future<void> selectAlbumForBackup(LocalAlbum album) =>
      _updateAlbumSelection(album, BackupSelection.select);

  Future<void> excludeAlbumFromBackup(LocalAlbum album) =>
      _updateAlbumSelection(album, BackupSelection.exclude);

  Future<void> deSelectAlbum(LocalAlbum album) =>
      _updateAlbumSelection(album, BackupSelection.none);
}
