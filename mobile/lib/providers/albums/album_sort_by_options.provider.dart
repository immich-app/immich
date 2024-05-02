import 'package:collection/collection.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
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
    final sorted =
        albums.sorted((a, b) => a.assetCount.compareTo(b.assetCount));
    return (isReverse ? sorted.reversed : sorted).toList();
  }

  static const AlbumSortFn mostRecent = _sortByMostRecent;
  static List<Album> _sortByMostRecent(List<Album> albums, bool isReverse) {
    final sorted = albums.sorted((a, b) {
      if (a.endDate != null && b.endDate != null) {
        return a.endDate!.compareTo(b.endDate!);
      }
      if (a.endDate == null) return 1;
      if (b.endDate == null) return -1;
      return 0;
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
  title(1, "library_page_sort_title", _AlbumSortHandlers.title),
  assetCount(4, "library_page_sort_asset_count", _AlbumSortHandlers.assetCount),
  lastModified(
    3,
    "library_page_sort_last_modified",
    _AlbumSortHandlers.lastModified,
  ),
  created(0, "library_page_sort_created", _AlbumSortHandlers.created),
  mostRecent(
    2,
    "library_page_sort_most_recent_photo",
    _AlbumSortHandlers.mostRecent,
  ),
  mostOldest(
    5,
    "library_page_sort_most_oldest_photo",
    _AlbumSortHandlers.mostOldest,
  );

  final int storeIndex;
  final String label;
  final AlbumSortFn sortFn;

  const AlbumSortMode(this.storeIndex, this.label, this.sortFn);
}

@riverpod
class AlbumSortByOptions extends _$AlbumSortByOptions {
  @override
  AlbumSortMode build() {
    final sortOpt = ref
        .watch(appSettingsServiceProvider)
        .getSetting(AppSettingsEnum.selectedAlbumSortOrder);
    return AlbumSortMode.values.firstWhere(
      (e) => e.storeIndex == sortOpt,
      orElse: () => AlbumSortMode.title,
    );
  }

  void changeSortMode(AlbumSortMode sortOption) {
    state = sortOption;
    ref.watch(appSettingsServiceProvider).setSetting(
          AppSettingsEnum.selectedAlbumSortOrder,
          sortOption.storeIndex,
        );
  }
}

@riverpod
class AlbumSortOrder extends _$AlbumSortOrder {
  @override
  bool build() {
    return ref
        .watch(appSettingsServiceProvider)
        .getSetting(AppSettingsEnum.selectedAlbumSortReverse);
  }

  void changeSortDirection(bool isReverse) {
    state = isReverse;
    ref
        .watch(appSettingsServiceProvider)
        .setSetting(AppSettingsEnum.selectedAlbumSortReverse, isReverse);
  }
}
