import 'package:immich_mobile/domain/models/album/local_album.model.dart';

abstract final class LocalAlbumStub {
  const LocalAlbumStub._();

  static final recent = LocalAlbum(
    id: "recent-local-id",
    name: "Recent",
    updatedAt: DateTime(2023),
    assetCount: 1000,
    backupSelection: BackupSelection.none,
    isIosSharedAlbum: false,
  );
}
