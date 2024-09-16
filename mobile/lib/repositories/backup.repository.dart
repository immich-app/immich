import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/backup_album.entity.dart';
import 'package:immich_mobile/interfaces/backup.interface.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:isar/isar.dart';

final backupRepositoryProvider =
    Provider((ref) => BackupRepository(ref.watch(dbProvider)));

class BackupRepository implements IBackupRepository {
  final Isar _db;

  BackupRepository(
    this._db,
  );

  @override
  Future<List<String>> getIdsBySelection(BackupSelection backup) =>
      _db.backupAlbums.filter().selectionEqualTo(backup).idProperty().findAll();
}
