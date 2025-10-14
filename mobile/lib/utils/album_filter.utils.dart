import 'package:immich_mobile/domain/services/remote_album.service.dart';
import 'package:immich_mobile/models/albums/album_search.model.dart';
import 'package:immich_mobile/providers/album/album_sort_by_options.provider.dart';

class AlbumFilter {
  String? userId;
  String? query;
  QuickFilterMode mode;

  AlbumFilter({required this.mode, this.userId, this.query});

  AlbumFilter copyWith({String? userId, String? query, QuickFilterMode? mode}) {
    return AlbumFilter(userId: userId ?? this.userId, query: query ?? this.query, mode: mode ?? this.mode);
  }
}

class AlbumSort {
  RemoteAlbumSortMode mode;
  bool isReverse;

  AlbumSort({required this.mode, this.isReverse = false});

  AlbumSort copyWith({RemoteAlbumSortMode? mode, bool? isReverse}) {
    return AlbumSort(mode: mode ?? this.mode, isReverse: isReverse ?? this.isReverse);
  }
}

RemoteAlbumSortMode toRemoteAlbumSortMode(AlbumSortMode mode) {
  switch (mode) {
    case AlbumSortMode.title:
      return RemoteAlbumSortMode.title;
    case AlbumSortMode.assetCount:
      return RemoteAlbumSortMode.assetCount;
    case AlbumSortMode.lastModified:
      return RemoteAlbumSortMode.lastModified;
    case AlbumSortMode.created:
      return RemoteAlbumSortMode.created;
    case AlbumSortMode.mostRecent:
      return RemoteAlbumSortMode.mostRecent;
    case AlbumSortMode.mostOldest:
      return RemoteAlbumSortMode.mostOldest;
  }
}

AlbumSortMode toAlbumSortMode(RemoteAlbumSortMode mode) {
  switch (mode) {
    case RemoteAlbumSortMode.title:
      return AlbumSortMode.title;
    case RemoteAlbumSortMode.assetCount:
      return AlbumSortMode.assetCount;
    case RemoteAlbumSortMode.lastModified:
      return AlbumSortMode.lastModified;
    case RemoteAlbumSortMode.created:
      return AlbumSortMode.created;
    case RemoteAlbumSortMode.mostRecent:
      return AlbumSortMode.mostRecent;
    case RemoteAlbumSortMode.mostOldest:
      return AlbumSortMode.mostOldest;
  }
}
