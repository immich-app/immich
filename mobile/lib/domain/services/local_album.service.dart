import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';

class LocalAlbumService {
  final DriftLocalAlbumRepository _repository;

  const LocalAlbumService(this._repository);

  Future<List<LocalAlbum>> getAll() {
    return _repository.getAll();
  }

  Future<LocalAsset?> getThumbnail(String albumId) {
    return _repository.getThumbnail(albumId);
  }
}
