import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/search/search_result.model.dart';
import 'package:immich_mobile/services/timeline.service.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/services/search.service.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'paginated_search.provider.g.dart';

final paginatedSearchProvider =
    StateNotifierProvider<PaginatedSearchNotifier, SearchResult>(
  (ref) => PaginatedSearchNotifier(ref.watch(searchServiceProvider)),
);

class PaginatedSearchNotifier extends StateNotifier<SearchResult> {
  final SearchService _searchService;

  PaginatedSearchNotifier(this._searchService)
      : super(SearchResult(assets: [], nextPage: 1));

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
    );

    return true;
  }

  clear() {
    state = SearchResult(assets: [], nextPage: 1);
  }
}

@riverpod
Future<RenderList> paginatedSearchRenderList(
  Ref ref,
) {
  final result = ref.watch(paginatedSearchProvider);
  final timelineService = ref.watch(timelineServiceProvider);
  return timelineService.getTimelineFromAssets(
    result.assets,
    GroupAssetsBy.none,
  );
}
