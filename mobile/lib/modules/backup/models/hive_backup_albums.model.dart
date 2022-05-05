import 'package:hive/hive.dart';

part 'hive_backup_albums.model.g.dart';

@HiveType(typeId: 1)
class HiveBackupAlbums {
  @HiveField(0)
  List<String> selectedAlbumIds;

  @HiveField(1)
  List<String> excludedAlbumsIds;

  HiveBackupAlbums({required this.selectedAlbumIds, required this.excludedAlbumsIds});

  @override
  String toString() {
    return 'HiveBackupAlbums(selectedAlbumIds: $selectedAlbumIds, excludedAlbumsIds: $excludedAlbumsIds)';
  }
}
