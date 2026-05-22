import 'package:collection/collection.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'album_sort_by_options.provider.g.dart';

typedef AlbumSortFn = List<Album> Function(List<Album> albums, bool isReverse);

class _AlbumSortHandlers {
  const _AlbumSortHandlers._();

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
    final sorted = albums.sortedBy((album) => album.modifiedAt);
    return (isReverse ? sorted.reversed : sorted).toList();
  }

  static const AlbumSortFn assetCount = _sortByAssetCount;
  static List<Album> _sortByAssetCount(List<Album> albums, bool isReverse) {
    final sorted = albums.sorted((a, b) => a.assetCount.compareTo(b.assetCount));
    return (isReverse ? sorted.reversed : sorted).toList();
  }

  static const AlbumSortFn mostRecent = _sortByMostRecent;
  static List<Album> _sortByMostRecent(List<Album> albums, bool isReverse) {
    final sorted = albums.sorted((a, b) {
      if (a.endDate == null && b.endDate == null) {
        return 0;
      }

      if (a.endDate == null) {
        // Put nulls at the end for recent sorting
        return 1;
      }

      if (b.endDate == null) {
        return -1;
      }

      // Sort by descending recent date
      return b.endDate!.compareTo(a.endDate!);
    });
    return (isReverse ? sorted.reversed : sorted).toList();
  }

  static const AlbumSortFn mostOldest = _sortByMostOldest;
  static List<Album> _sortByMostOldest(List<Album> albums, bool isReverse) {
    final sorted = albums.sorted((a, b) {
      if (a.startDate != null && b.startDate != null) {
        return a.startDate!.compareTo(b.startDate!);
      }
      if (a.startDate == null) return 1;
      if (b.startDate == null) return -1;
      return 0;
    });
    return (isReverse ? sorted.reversed : sorted).toList();
  }
}

// Store index allows us to re-arrange the values without affecting the saved prefs
enum AlbumSortMode {
  title(1, "library_page_sort_title", _AlbumSortHandlers.title, SortOrder.asc),
  assetCount(4, "library_page_sort_asset_count", _AlbumSortHandlers.assetCount, SortOrder.desc),
  lastModified(3, "library_page_sort_last_modified", _AlbumSortHandlers.lastModified, SortOrder.desc),
  created(0, "library_page_sort_created", _AlbumSortHandlers.created, SortOrder.desc),
  mostRecent(2, "sort_recent", _AlbumSortHandlers.mostRecent, SortOrder.desc),
  mostOldest(5, "sort_oldest", _AlbumSortHandlers.mostOldest, SortOrder.asc);

  final int storeIndex;
  final String label;
  final AlbumSortFn sortFn;
  final SortOrder defaultOrder;

  const AlbumSortMode(this.storeIndex, this.label, this.sortFn, this.defaultOrder);

  SortOrder effectiveOrder(bool isReverse) => isReverse ? defaultOrder.reverse() : defaultOrder;
}

@riverpod
class AlbumSortByOptions extends _$AlbumSortByOptions {
  @override
  AlbumSortMode build() {
    final sortOpt = ref.watch(appSettingsServiceProvider).getSetting(AppSettingsEnum.selectedAlbumSortOrder);
    return AlbumSortMode.values.firstWhere((e) => e.storeIndex == sortOpt, orElse: () => AlbumSortMode.title);
  }

  void changeSortMode(AlbumSortMode sortOption) {
    state = sortOption;
    ref.watch(appSettingsServiceProvider).setSetting(AppSettingsEnum.selectedAlbumSortOrder, sortOption.storeIndex);
  }
}

@riverpod
class AlbumSortOrder extends _$AlbumSortOrder {
  @override
  bool build() {
    return ref.watch(appSettingsServiceProvider).getSetting(AppSettingsEnum.selectedAlbumSortReverse);
  }

  void changeSortDirection(bool isReverse) {
    state = isReverse;
    ref.watch(appSettingsServiceProvider).setSetting(AppSettingsEnum.selectedAlbumSortReverse, isReverse);
  }
}
