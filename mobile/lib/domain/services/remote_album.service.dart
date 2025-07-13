import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_album.repository.dart';
import 'package:immich_mobile/models/albums/album_search.model.dart';
import 'package:immich_mobile/repositories/drift_album_api_repository.dart';
import 'package:immich_mobile/utils/remote_album.utils.dart';

class RemoteAlbumService {
  final DriftRemoteAlbumRepository _repository;
  final DriftAlbumApiRepository _albumApiRepository;

  const RemoteAlbumService(this._repository, this._albumApiRepository);

  Future<List<RemoteAlbum>> getAll() {
    return _repository.getAll();
  }

  List<RemoteAlbum> sortAlbums(
    List<RemoteAlbum> albums,
    RemoteAlbumSortMode sortMode, {
    bool isReverse = false,
  }) {
    return sortMode.sortFn(albums, isReverse);
  }

  List<RemoteAlbum> searchAlbums(
    List<RemoteAlbum> albums,
    String query,
    String? userId, [
    QuickFilterMode filterMode = QuickFilterMode.all,
  ]) {
    final lowerQuery = query.toLowerCase();
    List<RemoteAlbum> filtered = albums;

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

  Future<RemoteAlbum> createAlbum({
    required String title,
    required List<String> assetIds,
    String? description,
  }) async {
    final album = await _albumApiRepository.createDriftAlbum(
      title,
      description: description,
      assetIds: assetIds,
    );

    await _repository.create(album, assetIds);

    return album;
  }
}
