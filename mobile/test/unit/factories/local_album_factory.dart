import 'package:immich_mobile/domain/models/album/local_album.model.dart';

import '../../utils.dart';

class LocalAlbumFactory {
  const LocalAlbumFactory();

  static LocalAlbum create({
    String? id,
    String? name,
    DateTime? updatedAt,
    BackupSelection? backupSelection,
    bool? isIosSharedAlbum,
    String? linkedRemoteAlbumId,
    int? assetCount,
  }) {
    final albumId = TestUtils.uuid(id);
    return LocalAlbum(
      id: albumId,
      name: name ?? 'local_album_$albumId',
      updatedAt: TestUtils.date(updatedAt),
      backupSelection: backupSelection ?? .none,
      isIosSharedAlbum: isIosSharedAlbum ?? false,
      linkedRemoteAlbumId: linkedRemoteAlbumId,
      assetCount: assetCount ?? 10,
    );
  }
}
