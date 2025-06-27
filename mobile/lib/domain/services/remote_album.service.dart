import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_album.repository.dart';
import 'package:immich_mobile/models/albums/album_search.model.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';

final remoteAlbumServiceProvider = Provider<RemoteAlbumService>(
  (ref) => RemoteAlbumService(ref.watch(remoteAlbumRepository)),
  dependencies: [remoteAlbumRepository],
);

class RemoteAlbumService {
  final DriftRemoteAlbumRepository _repository;

  RemoteAlbumService(this._repository);

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

/// SORTING

typedef AlbumSortFn = List<Album> Function(List<Album> albums, bool isReverse);

class _RemoteAlbumSortHandlers {
  const _RemoteAlbumSortHandlers._();

  static const AlbumSortFn created = _sortByCreated;
  static List<Album> _sortByCreated(List<Album> albums, bool isReverse) {
    final sorted = albums.sortedBy((album) => album.createdAt);
    return (isReverse ? sorted.reversed : sorted).toList();
  }

  static const AlbumSortFn title = _sortByTitle;
  static List<Album> _sortByTitle(List<Album> albums, bool isReverse) {
    final sorted = albums.sortedBy((album) => album.name);
    return (isReverse ? sorted.reversed : sorted).toList();
  }

  static const AlbumSortFn lastModified = _sortByLastModified;
  static List<Album> _sortByLastModified(List<Album> albums, bool isReverse) {
    final sorted = albums.sortedBy((album) => album.updatedAt);
    return (isReverse ? sorted.reversed : sorted).toList();
  }

  static const AlbumSortFn assetCount = _sortByAssetCount;
  static List<Album> _sortByAssetCount(List<Album> albums, bool isReverse) {
    final sorted =
        albums.sorted((a, b) => a.assetCount.compareTo(b.assetCount));
    return (isReverse ? sorted.reversed : sorted).toList();
  }

  static const AlbumSortFn mostRecent = _sortByMostRecent;
  static List<Album> _sortByMostRecent(List<Album> albums, bool isReverse) {
    final sorted = albums.sorted((a, b) {
      // For most recent, we sort by updatedAt in descending order
      return b.updatedAt.compareTo(a.updatedAt);
    });
    return (isReverse ? sorted.reversed : sorted).toList();
  }

  static const AlbumSortFn mostOldest = _sortByMostOldest;
  static List<Album> _sortByMostOldest(List<Album> albums, bool isReverse) {
    final sorted = albums.sorted((a, b) {
      // For oldest, we sort by createdAt in ascending order
      return a.createdAt.compareTo(b.createdAt);
    });
    return (isReverse ? sorted.reversed : sorted).toList();
  }
}

enum RemoteAlbumSortMode {
  title("Title", _RemoteAlbumSortHandlers.title),
  assetCount("Asset Count", _RemoteAlbumSortHandlers.assetCount),
  lastModified("Last Modified", _RemoteAlbumSortHandlers.lastModified),
  created("Created Date", _RemoteAlbumSortHandlers.created),
  mostRecent("Most Recent", _RemoteAlbumSortHandlers.mostRecent),
  mostOldest("Oldest", _RemoteAlbumSortHandlers.mostOldest);

  final String label;
  final AlbumSortFn sortFn;

  const RemoteAlbumSortMode(this.label, this.sortFn);
}
