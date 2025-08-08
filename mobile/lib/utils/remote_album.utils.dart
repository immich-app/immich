import 'dart:async';

import 'package:collection/collection.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

typedef GetAssetsFn = Future<List<RemoteAsset>> Function(String albumId);
typedef AlbumSortFn =
    FutureOr<List<RemoteAlbum>> Function(List<RemoteAlbum> albums, GetAssetsFn getAssets, bool isReverse);

class _RemoteAlbumSortHandlers {
  const _RemoteAlbumSortHandlers._();

  static const AlbumSortFn created = _sortByCreated;
  static List<RemoteAlbum> _sortByCreated(List<RemoteAlbum> albums, GetAssetsFn getAssets, bool isReverse) {
    final sorted = albums.sortedBy((album) => album.createdAt);
    return (isReverse ? sorted.reversed : sorted).toList();
  }

  static const AlbumSortFn title = _sortByTitle;
  static List<RemoteAlbum> _sortByTitle(List<RemoteAlbum> albums, GetAssetsFn getAssets, bool isReverse) {
    final sorted = albums.sortedBy((album) => album.name);
    return (isReverse ? sorted.reversed : sorted).toList();
  }

  static const AlbumSortFn lastModified = _sortByLastModified;
  static List<RemoteAlbum> _sortByLastModified(List<RemoteAlbum> albums, GetAssetsFn getAssets, bool isReverse) {
    final sorted = albums.sortedBy((album) => album.updatedAt);
    return (isReverse ? sorted.reversed : sorted).toList();
  }

  static const AlbumSortFn assetCount = _sortByAssetCount;
  static List<RemoteAlbum> _sortByAssetCount(List<RemoteAlbum> albums, GetAssetsFn getAssets, bool isReverse) {
    final sorted = albums.sorted((a, b) => a.assetCount.compareTo(b.assetCount));
    return (isReverse ? sorted.reversed : sorted).toList();
  }

  //
  // mostRecent and mostOldest are special cases that require fetching assets
  // to determine the most recent or oldest asset in each album.
  // This is necessary because the album's createdAt or updatedAt may not reflect
  // the most recent asset's date.
  //
  // These methods are asynchronous and will fetch assets for each album.
  // getAssets function is passed in instead of passing the assets directly
  // to avoid fetching assets for sorts that do not require it.
  //

  static const AlbumSortFn mostRecent = _sortByMostRecent;
  static Future<List<RemoteAlbum>> _sortByMostRecent(
    List<RemoteAlbum> albums,
    GetAssetsFn getAssets,
    bool isReverse,
  ) async {
    DateTime getNewestAssetDate(List<RemoteAsset> assets) {
      if (assets.isEmpty) return DateTime.fromMillisecondsSinceEpoch(0);
      final dates = assets.map((asset) => asset.createdAt);
      return dates.reduce((a, b) => a.isAfter(b) ? a : b);
    }

    // map album IDs to their assets
    final Map<String, DateTime> albumAssets = {
      for (var album in albums) album.id: getNewestAssetDate(await getAssets(album.id)),
    };

    final sorted = albums.sorted((a, b) {
      final aDate = albumAssets[a.id] ?? DateTime.fromMillisecondsSinceEpoch(0);
      final bDate = albumAssets[b.id] ?? DateTime.fromMillisecondsSinceEpoch(0);
      return aDate.compareTo(bDate);
    });

    return (isReverse ? sorted.reversed : sorted).toList();
  }

  static const AlbumSortFn mostOldest = _sortByMostOldest;
  static Future<List<RemoteAlbum>> _sortByMostOldest(
    List<RemoteAlbum> albums,
    GetAssetsFn getAssets,
    bool isReverse,
  ) async {
    return await _sortByMostRecent(albums, getAssets, !isReverse);
  }
}

enum RemoteAlbumSortMode {
  title("library_page_sort_title", _RemoteAlbumSortHandlers.title),
  assetCount("library_page_sort_asset_count", _RemoteAlbumSortHandlers.assetCount),
  lastModified("library_page_sort_last_modified", _RemoteAlbumSortHandlers.lastModified),
  created("library_page_sort_created", _RemoteAlbumSortHandlers.created),
  mostRecent("sort_newest", _RemoteAlbumSortHandlers.mostRecent),
  mostOldest("sort_oldest", _RemoteAlbumSortHandlers.mostOldest);

  final String key;
  final AlbumSortFn sortFn;

  const RemoteAlbumSortMode(this.key, this.sortFn);
}
