import 'package:collection/collection.dart';
import 'package:immich_mobile/modules/backup/models/backup_album.model.dart';

class BackupAlbumState {
  final List<BackupAlbum> selectedBackupAlbums;
  final List<BackupAlbum> excludedBackupAlbums;

  const BackupAlbumState({
    required this.selectedBackupAlbums,
    required this.excludedBackupAlbums,
  });

  BackupAlbumState copyWith({
    List<BackupAlbum>? selectedBackupAlbums,
    List<BackupAlbum>? excludedBackupAlbums,
  }) {
    return BackupAlbumState(
      selectedBackupAlbums: selectedBackupAlbums ?? this.selectedBackupAlbums,
      excludedBackupAlbums: excludedBackupAlbums ?? this.excludedBackupAlbums,
    );
  }

  @override
  String toString() =>
      'BackupAlbumState(selectedBackupAlbums: $selectedBackupAlbums, excludedBackupAlbums: $excludedBackupAlbums)';

  @override
  bool operator ==(covariant BackupAlbumState other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return listEquals(other.selectedBackupAlbums, selectedBackupAlbums) &&
        listEquals(other.excludedBackupAlbums, excludedBackupAlbums);
  }

  @override
  int get hashCode =>
      selectedBackupAlbums.hashCode ^ excludedBackupAlbums.hashCode;
}
