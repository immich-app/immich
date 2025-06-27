import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_album.repository.dart';
import 'package:immich_mobile/models/albums/album_search.model.dart';
import 'package:immich_mobile/utils/remote_album.utils.dart';

class RemoteAlbumService {
  final DriftRemoteAlbumRepository _repository;

  const RemoteAlbumService(this._repository);

  Future<List<Album>> getAll() {
    return _repository.getAll();
  }

  List<Album> sortAlbums(
    List<Album> albums,
    RemoteAlbumSortMode sortMode, {
    bool isReverse = false,
  }) {
    return sortMode.sortFn(albums, isReverse);
  }

  List<Album> searchAlbums(
    List<Album> albums,
    String query,
    String? userId, [
    QuickFilterMode filterMode = QuickFilterMode.all,
  ]) {
    final lowerQuery = query.toLowerCase();
    List<Album> filtered = albums;

    // Apply text search filter
    if (query.isNotEmpty) {
      filtered = filtered
          .where(
            (album) =>
                album.name.toLowerCase().contains(lowerQuery) ||
                album.description.toLowerCase().contains(lowerQuery),
          )
          .toList();
    }

    if (userId != null) {
      switch (filterMode) {
        case QuickFilterMode.myAlbums:
          filtered =
              filtered.where((album) => album.ownerId == userId).toList();
          break;
        case QuickFilterMode.sharedWithMe:
          filtered =
              filtered.where((album) => album.ownerId != userId).toList();
          break;
        case QuickFilterMode.all:
          break;
      }
    }

    return filtered;
  }
}
