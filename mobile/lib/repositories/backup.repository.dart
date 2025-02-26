import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/backup_album.entity.dart';
import 'package:immich_mobile/interfaces/backup_album.interface.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/repositories/database.repository.dart';
import 'package:isar/isar.dart';

final backupAlbumRepositoryProvider =
    Provider((ref) => BackupAlbumRepository(ref.watch(dbProvider)));

class BackupAlbumRepository extends DatabaseRepository
    implements IBackupAlbumRepository {
  BackupAlbumRepository(super.db);

  @override
  Future<List<BackupAlbum>> getAll({BackupAlbumSort? sort}) {
    final baseQuery = db.backupAlbums.where();
    final QueryBuilder<BackupAlbum, BackupAlbum, QAfterSortBy> query =
        switch (sort) {
      null => baseQuery.noOp(),
      BackupAlbumSort.id => baseQuery.sortById(),
    };
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
