import 'package:immich_mobile/domain/models/local_album.model.dart';

abstract final class LocalAlbumStub {
  const LocalAlbumStub();

  static LocalAlbum get album1 => LocalAlbum(
        id: "album1",
        name: "Album 1",
        updatedAt: DateTime(2023),
        assetCount: 1,
        thumbnailId: null,
        backupSelection: BackupSelection.none,
      );

  static LocalAlbum get album2 => LocalAlbum(
        id: "album2",
        name: "Album 2",
        updatedAt: DateTime(2025),
        assetCount: 2,
        thumbnailId: null,
        backupSelection: BackupSelection.selected,
      );

  static LocalAlbum get album3 => LocalAlbum(
        id: "album3",
        name: "Album 3",
        updatedAt: DateTime(2020),
        assetCount: 20,
        thumbnailId: "123",
        backupSelection: BackupSelection.excluded,
      );
}
