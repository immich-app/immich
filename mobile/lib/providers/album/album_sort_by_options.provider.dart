import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/generated/translations.g.dart';

// Store index allows us to re-arrange the values without affecting the saved prefs
enum AlbumSortMode {
  title(1, SortOrder.asc),
  assetCount(4, SortOrder.desc),
  lastModified(3, SortOrder.desc),
  created(0, SortOrder.desc),
  mostRecent(2, SortOrder.desc),
  mostOldest(5, SortOrder.asc);

  final int storeIndex;
  final SortOrder defaultOrder;

  const AlbumSortMode(this.storeIndex, this.defaultOrder);

  String label(Translations t) => switch (this) {
    AlbumSortMode.title => t.sort_title,
    AlbumSortMode.assetCount => t.sort_items,
    AlbumSortMode.lastModified => t.sort_modified,
    AlbumSortMode.created => t.sort_created,
    AlbumSortMode.mostRecent => t.sort_recent,
    AlbumSortMode.mostOldest => t.sort_oldest,
  };

  SortOrder effectiveOrder(bool isReverse) => isReverse ? defaultOrder.reverse() : defaultOrder;
}
