import 'package:immich_mobile/domain/services/remote_album.service.dart';
import 'package:immich_mobile/models/albums/album_search.model.dart';

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
