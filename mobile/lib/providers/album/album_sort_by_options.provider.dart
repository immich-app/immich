import 'package:immich_mobile/constants/enums.dart';

// Store index allows us to re-arrange the values without affecting the saved prefs
enum AlbumSortMode {
  title(1, "library_page_sort_title", SortOrder.asc),
  assetCount(4, "library_page_sort_asset_count", SortOrder.desc),
  lastModified(3, "library_page_sort_last_modified", SortOrder.desc),
  created(0, "library_page_sort_created", SortOrder.desc),
  mostRecent(2, "sort_recent", SortOrder.desc),
  mostOldest(5, "sort_oldest", SortOrder.asc);

  final int storeIndex;
  final String label;
  final SortOrder defaultOrder;

  const AlbumSortMode(this.storeIndex, this.label, this.defaultOrder);

  SortOrder effectiveOrder(bool isReverse) => isReverse ? defaultOrder.reverse() : defaultOrder;
}
