import 'package:immich_mobile/entities/backup_album.entity.dart';

abstract interface class IBackupAlbumRepository {
  Future<List<String>> getIdsBySelection(BackupSelection backup);
}
