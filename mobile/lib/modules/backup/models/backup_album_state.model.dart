import 'package:collection/collection.dart';
import 'package:immich_mobile/modules/album/models/album.model.dart';

class BackupAlbumState {
  final List<LocalAlbum> selectedBackupAlbums;
  final List<LocalAlbum> excludedBackupAlbums;

  const BackupAlbumState({
    required this.selectedBackupAlbums,
    required this.excludedBackupAlbums,
  });

  BackupAlbumState copyWith({
    List<LocalAlbum>? selectedBackupAlbums,
    List<LocalAlbum>? excludedBackupAlbums,
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
    final setEquals = const DeepCollectionEquality().equals;

    return setEquals(other.selectedBackupAlbums, selectedBackupAlbums) &&
        setEquals(other.excludedBackupAlbums, excludedBackupAlbums);
  }

  @override
  int get hashCode =>
      selectedBackupAlbums.hashCode ^ excludedBackupAlbums.hashCode;
}
