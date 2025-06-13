import 'package:immich_mobile/domain/interfaces/local_album.interface.dart';
import 'package:immich_mobile/domain/interfaces/remote_album.interface.dart';
import 'package:immich_mobile/domain/models/album/base_album.model.dart';

typedef AlbumSource = Future<List<BaseAlbum>> Function();

class AlbumService {
  final AlbumSource _albumSource;

  AlbumService({
    required AlbumSource albumSource,
  })  : _albumSource = albumSource;

  factory AlbumService.remoteAlbum({
    required IRemoteAlbumRepository repository,
  }) {
    return AlbumService(
      albumSource: () => repository.getAll(),
    );
  }

  factory AlbumService.localAlbum({
    required ILocalAlbumRepository repository,
  }) {
    return AlbumService(
      albumSource: () => repository.getAll(),
    );
  }

  Future<List<BaseAlbum>> loadAlbums() async {
    return await _albumSource();
  }
}
