import 'package:collection/collection.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';

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
  title("library_page_sort_title", _RemoteAlbumSortHandlers.title),
  assetCount(
    "library_page_sort_asset_count",
    _RemoteAlbumSortHandlers.assetCount,
  ),
  lastModified(
    "library_page_sort_last_modified",
    _RemoteAlbumSortHandlers.lastModified,
  ),
  created("library_page_sort_created", _RemoteAlbumSortHandlers.created),
  mostRecent("sort_recent", _RemoteAlbumSortHandlers.mostRecent),
  mostOldest("sort_oldest", _RemoteAlbumSortHandlers.mostOldest);

  final String key;
  final AlbumSortFn sortFn;

  const RemoteAlbumSortMode(this.key, this.sortFn);
}
