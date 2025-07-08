import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';

class LocalAlbumService {
  final DriftLocalAlbumRepository _repository;

  const LocalAlbumService(this._repository);

  Future<List<LocalAlbum>> getAll() {
    return _repository.getAll();
  }
}
