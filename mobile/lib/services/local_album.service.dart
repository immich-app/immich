import 'package:immich_mobile/domain/interfaces/local_album.interface.dart';
import 'package:immich_mobile/domain/models/local_album.model.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

final localAlbumsServiceProvider = Provider<LocalAlbumService>(
  (ref) => LocalAlbumService(
    ref.watch(localAlbumRepository),
  ),
);

class LocalAlbumService {
  LocalAlbumService(this._localAlbumRepository);

  final ILocalAlbumRepository _localAlbumRepository;

  Future<List<LocalAlbum>> getAll() {
    return _localAlbumRepository.getAll();
  }

  Future<void> update(LocalAlbum album) {
    return _localAlbumRepository.update(album);
  }
}
