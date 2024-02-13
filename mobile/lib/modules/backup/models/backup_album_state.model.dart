import 'package:collection/collection.dart';
import 'package:immich_mobile/modules/backup/models/backup_album.model.dart';

class BackupAlbumState {
  final List<BackupAlbum> selectedBackupAlbums;
  final List<BackupAlbum> excludedBackupAlbums;
  final int uniqueAssetsToBackup;
  final int backedUpAssets;

  const BackupAlbumState({
    required this.selectedBackupAlbums,
    required this.excludedBackupAlbums,
    required this.uniqueAssetsToBackup,
    required this.backedUpAssets,
  });

  int get assetsRemaining => uniqueAssetsToBackup - backedUpAssets;

  BackupAlbumState copyWith({
    List<BackupAlbum>? selectedBackupAlbums,
    List<BackupAlbum>? excludedBackupAlbums,
    int? uniqueAssetsToBackup,
    int? backedUpAssets,
  }) {
    return BackupAlbumState(
      selectedBackupAlbums: selectedBackupAlbums ?? this.selectedBackupAlbums,
      excludedBackupAlbums: excludedBackupAlbums ?? this.excludedBackupAlbums,
      uniqueAssetsToBackup: uniqueAssetsToBackup ?? this.uniqueAssetsToBackup,
      backedUpAssets: backedUpAssets ?? this.backedUpAssets,
    );
  }

  @override
  String toString() {
    return 'BackupAlbumState(selectedBackupAlbums: $selectedBackupAlbums, excludedBackupAlbums: $excludedBackupAlbums, uniqueAssetsToBackup: $uniqueAssetsToBackup, backedUpAssets: $backedUpAssets)';
  }

  @override
  bool operator ==(covariant BackupAlbumState other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return listEquals(other.selectedBackupAlbums, selectedBackupAlbums) &&
        listEquals(other.excludedBackupAlbums, excludedBackupAlbums) &&
        other.uniqueAssetsToBackup == uniqueAssetsToBackup &&
        other.backedUpAssets == backedUpAssets;
  }

  @override
  int get hashCode {
    return selectedBackupAlbums.hashCode ^
        excludedBackupAlbums.hashCode ^
        uniqueAssetsToBackup.hashCode ^
        backedUpAssets.hashCode;
  }
}
