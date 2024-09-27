import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/backup_album.entity.dart';
import 'package:immich_mobile/interfaces/backup.interface.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/repositories/database.repository.dart';
import 'package:isar/isar.dart';

final backupRepositoryProvider =
    Provider((ref) => BackupRepository(ref.watch(dbProvider)));

class BackupRepository extends DatabaseRepository implements IBackupRepository {
  BackupRepository(super.db);

  @override
  Future<List<BackupAlbum>> getAll({BackupAlbumSort? sort}) {
    final baseQuery = db.backupAlbums.where();
    final QueryBuilder<BackupAlbum, BackupAlbum, QAfterSortBy> query;
    switch (sort) {
      case null:
        query = baseQuery.noOp();
      case BackupAlbumSort.id:
        query = baseQuery.sortById();
    }
    return query.findAll();
  }

  @override
  Future<List<String>> getIdsBySelection(BackupSelection backup) =>
      db.backupAlbums.filter().selectionEqualTo(backup).idProperty().findAll();

  @override
  Future<List<BackupAlbum>> getAllBySelection(BackupSelection backup) =>
      db.backupAlbums.filter().selectionEqualTo(backup).findAll();

  @override
  Future<void> deleteAll(List<int> ids) =>
      txn(() => db.backupAlbums.deleteAll(ids));

  @override
  Future<void> updateAll(List<BackupAlbum> backupAlbums) =>
      txn(() => db.backupAlbums.putAll(backupAlbums));
}
