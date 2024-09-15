import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/backup_album.entity.dart';
import 'package:immich_mobile/interfaces/backupalbum.interface.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:isar/isar.dart';

final backupAlbumRepositoryProvider =
    Provider((ref) => BackupAlbumRepository(ref.watch(dbProvider)));

class BackupAlbumRepository implements IBackupAlbumRepository {
  final Isar _db;

  BackupAlbumRepository(
    this._db,
  );

  @override
  Future<List<String>> getIdsBySelection(BackupSelection backup) =>
      _db.backupAlbums.filter().selectionEqualTo(backup).idProperty().findAll();
}
