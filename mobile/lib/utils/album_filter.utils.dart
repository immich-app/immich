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
  AlbumSortMode mode;
  bool isReverse;

  AlbumSort({required this.mode, this.isReverse = false});

  AlbumSort copyWith({AlbumSortMode? mode, bool? isReverse}) {
    return AlbumSort(mode: mode ?? this.mode, isReverse: isReverse ?? this.isReverse);
  }
}
