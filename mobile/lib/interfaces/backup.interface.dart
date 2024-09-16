import 'package:immich_mobile/entities/backup_album.entity.dart';

abstract interface class IBackupRepository {
  Future<List<String>> getIdsBySelection(BackupSelection backup);
}
