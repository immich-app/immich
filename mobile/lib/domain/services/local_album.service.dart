import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';

class LocalAlbumService {
  final DriftLocalAlbumRepository _repository;

  const LocalAlbumService(this._repository);

  Future<List<LocalAlbum>> getAll({Set<SortLocalAlbumsBy> sortBy = const {}}) {
    return _repository.getAll(sortBy: sortBy);
  }

  Future<LocalAsset?> getThumbnail(String albumId) {
    return _repository.getThumbnail(albumId);
  }

  Future<void> update(LocalAlbum album) {
    return _repository.upsert(album);
  }

  Future<int> getCount() {
    return _repository.getCount();
  }

  Future<void> unlinkRemoteAlbum(String id) async {
    return _repository.unlinkRemoteAlbum(id);
  }

  Future<void> linkRemoteAlbum(String localAlbumId, String remoteAlbumId) async {
    return _repository.linkRemoteAlbum(localAlbumId, remoteAlbumId);
  }

  Future<List<LocalAlbum>> getBackupAlbums() {
    return _repository.getBackupAlbums();
  }
}
