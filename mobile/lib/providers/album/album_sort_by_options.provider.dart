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
    AlbumSortMode.title => t.library_page_sort_title,
    AlbumSortMode.assetCount => t.library_page_sort_asset_count,
    AlbumSortMode.lastModified => t.library_page_sort_last_modified,
    AlbumSortMode.created => t.library_page_sort_created,
    AlbumSortMode.mostRecent => t.sort_recent,
    AlbumSortMode.mostOldest => t.sort_oldest,
  };

  SortOrder effectiveOrder(bool isReverse) => isReverse ? defaultOrder.reverse() : defaultOrder;
}
