import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/search_result.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/search.service.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/providers/infrastructure/search.provider.dart';

final searchPreFilterProvider = NotifierProvider<SearchFilterProvider, SearchFilter?>(SearchFilterProvider.new);

class SearchFilterProvider extends Notifier<SearchFilter?> {
  @override
  SearchFilter? build() {
    return null;
  }

  void setFilter(SearchFilter? filter) {
    state = filter;
  }

  void clear() {
    state = null;
  }
}

final paginatedSearchProvider = StateNotifierProvider<PaginatedSearchNotifier, SearchResult>(
  (ref) => PaginatedSearchNotifier(ref.watch(searchServiceProvider)),
);

class PaginatedSearchNotifier extends StateNotifier<SearchResult> {
  final SearchService _searchService;

  PaginatedSearchNotifier(this._searchService) : super(const SearchResult(assets: [], nextPage: 1));

  Future<bool> search(SearchFilter filter) async {
    if (state.nextPage == null) {
      return false;
    }

    final result = await _searchService.search(filter, state.nextPage!);

    if (result == null) {
      return false;
    }

    state = SearchResult(
      assets: [...state.assets, ...result.assets],
      nextPage: result.nextPage,
      scrollOffset: state.scrollOffset,
    );

    return true;
  }

  void setScrollOffset(double offset) {
    state = state.copyWith(scrollOffset: offset);
  }

  clear() {
    state = const SearchResult(assets: [], nextPage: 1, scrollOffset: 0.0);
  }
}

/// A [TimelineService] for search results that stays alive across pagination.
/// Instead of recreating the service on each page load, it uses a long-lived
/// bucket stream that emits new buckets whenever the search assets change.
final paginatedSearchTimelineProvider = Provider.autoDispose<TimelineService>((ref) {
  final controller = StreamController<List<Bucket>>.broadcast();

  List<Bucket> generateBuckets(int count) {
    if (count == 0) return [];
    final buckets = List.filled(
      (count / kTimelineNoneSegmentSize).ceil(),
      const Bucket(assetCount: kTimelineNoneSegmentSize),
    );
    if (count % kTimelineNoneSegmentSize != 0) {
      buckets[buckets.length - 1] = Bucket(assetCount: count % kTimelineNoneSegmentSize);
    }
    return buckets;
  }

  // Emit new buckets whenever asset count changes
  ref.listen(paginatedSearchProvider.select((s) => s.assets.length), (_, count) {
    controller.add(generateBuckets(count));
  });

  // Each subscriber gets the current bucket state then follows updates
  Stream<List<Bucket>> bucketSource() async* {
    yield generateBuckets(ref.read(paginatedSearchProvider).assets.length);
    yield* controller.stream;
  }

  final service = TimelineService((
    bucketSource: bucketSource,
    assetSource: (offset, count) {
      final assets = ref.read(paginatedSearchProvider).assets;
      return Future.value(assets.skip(offset).take(count).toList(growable: false));
    },
    origin: TimelineOrigin.search,
  ));

  ref.onDispose(() {
    controller.close();
    service.dispose();
  });

  return service;
});
