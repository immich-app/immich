import 'package:collection/collection.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';

typedef AlbumSortFn = List<RemoteAlbum> Function(
  List<RemoteAlbum> albums,
  bool isReverse,
);

class _RemoteAlbumSortHandlers {
  const _RemoteAlbumSortHandlers._();

  static const AlbumSortFn created = _sortByCreated;
  static List<RemoteAlbum> _sortByCreated(
    List<RemoteAlbum> albums,
    bool isReverse,
  ) {
    final sorted = albums.sortedBy((album) => album.createdAt);
    return (isReverse ? sorted.reversed : sorted).toList();
  }

  static const AlbumSortFn title = _sortByTitle;
  static List<RemoteAlbum> _sortByTitle(
    List<RemoteAlbum> albums,
    bool isReverse,
  ) {
    final sorted = albums.sortedBy((album) => album.name);
    return (isReverse ? sorted.reversed : sorted).toList();
  }

  static const AlbumSortFn lastModified = _sortByLastModified;
  static List<RemoteAlbum> _sortByLastModified(
    List<RemoteAlbum> albums,
    bool isReverse,
  ) {
    final sorted = albums.sortedBy((album) => album.updatedAt);
    return (isReverse ? sorted.reversed : sorted).toList();
  }

  static const AlbumSortFn assetCount = _sortByAssetCount;
  static List<RemoteAlbum> _sortByAssetCount(
    List<RemoteAlbum> albums,
    bool isReverse,
  ) {
    final sorted =
        albums.sorted((a, b) => a.assetCount.compareTo(b.assetCount));
    return (isReverse ? sorted.reversed : sorted).toList();
  }

  static const AlbumSortFn mostRecent = _sortByMostRecent;
  static List<RemoteAlbum> _sortByMostRecent(
    List<RemoteAlbum> albums,
    bool isReverse,
  ) {
    final sorted = albums.sorted((a, b) {
      // For most recent, we sort by updatedAt in descending order
      return b.updatedAt.compareTo(a.updatedAt);
    });
    return (isReverse ? sorted.reversed : sorted).toList();
  }

  static const AlbumSortFn mostOldest = _sortByMostOldest;
  static List<RemoteAlbum> _sortByMostOldest(
    List<RemoteAlbum> albums,
    bool isReverse,
  ) {
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
