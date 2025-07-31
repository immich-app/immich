import 'dart:async';

import 'package:immich_mobile/domain/models/album/shared_album.model.dart';
import 'package:immich_mobile/repositories/drift_album_api_repository.dart';

class RemoteSharedAlbumService {
  final DriftAlbumApiRepository _albumApiRepository;

  const RemoteSharedAlbumService(this._albumApiRepository);

  Future<SharedRemoteAlbum?> getSharedAlbum(String albumId) {
    return _albumApiRepository.getShared(albumId);
  }
}
