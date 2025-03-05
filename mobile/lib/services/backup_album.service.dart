import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/backup_album.entity.dart';
import 'package:immich_mobile/interfaces/backup_album.interface.dart';
import 'package:immich_mobile/repositories/backup.repository.dart';

final backupAlbumServiceProvider = Provider<BackupAlbumService>((ref) {
  return BackupAlbumService(ref.watch(backupAlbumRepositoryProvider));
});

class BackupAlbumService {
  final IBackupAlbumRepository _backupAlbumRepository;

  BackupAlbumService(this._backupAlbumRepository);

  Future<List<BackupAlbum>> getAll({BackupAlbumSort? sort}) {
    return _backupAlbumRepository.getAll(sort: sort);
  }

  Future<List<String>> getIdsBySelection(BackupSelection backup) {
    return _backupAlbumRepository.getIdsBySelection(backup);
  }

  Future<List<BackupAlbum>> getAllBySelection(BackupSelection backup) {
    return _backupAlbumRepository.getAllBySelection(backup);
  }

  Future<void> deleteAll(List<int> ids) {
    return _backupAlbumRepository.deleteAll(ids);
  }

  Future<void> updateAll(List<BackupAlbum> backupAlbums) {
    return _backupAlbumRepository.updateAll(backupAlbums);
  }
}
