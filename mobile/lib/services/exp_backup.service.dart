import 'package:immich_mobile/domain/interfaces/backup.interface.dart';
import 'package:immich_mobile/domain/interfaces/local_album.interface.dart';
import 'package:immich_mobile/domain/models/local_album.model.dart';
import 'package:immich_mobile/infrastructure/repositories/backup.repository.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

final expBackupServiceProvider = Provider<ExpBackupService>(
  (ref) => ExpBackupService(
    ref.watch(backupRepositoryProvider),
  ),
);

class ExpBackupService {
  ExpBackupService(this._backupRepository);

  final IBackupRepository _backupRepository;

  Future<int> getTotalCount() async {
    final [selectedCount, excludedCount] = await Future.wait([
      _backupRepository.getTotalCount(BackupSelection.selected),
      _backupRepository.getTotalCount(BackupSelection.excluded),
    ]);

    return selectedCount - excludedCount;
  }

  Future<int> getBackupCount() {
    return _backupRepository.getBackupCount();
  }
}
