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
    id = TestUtils.uuid(id);
    return LocalAlbum(
      id: id,
      name: name ?? 'local_album_$id',
      updatedAt: TestUtils.date(updatedAt),
      backupSelection: backupSelection ?? BackupSelection.none,
      isIosSharedAlbum: isIosSharedAlbum ?? false,
      linkedRemoteAlbumId: linkedRemoteAlbumId,
      assetCount: assetCount ?? 10,
    );
  }
}
