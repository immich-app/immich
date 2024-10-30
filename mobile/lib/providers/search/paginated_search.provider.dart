import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/search/search_result.model.dart';
import 'package:immich_mobile/providers/asset_viewer/render_list.provider.dart';
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
      : super(SearchResult(assets: []));

  Future<SearchResult?> getNextPage(SearchFilter filter, int nextPage) async {
    final result = await _searchService.search(filter, nextPage);
    if (result == null) return null;

    state = SearchResult(
      assets: [...state.assets, ...result.assets],
      nextPage: result.nextPage,
    );

    return state;
  }

  clear() {
    state = SearchResult(assets: [], nextPage: null);
  }
}

@riverpod
AsyncValue<RenderList> paginatedSearchRenderList(
  PaginatedSearchRenderListRef ref,
) {
  final result = ref.watch(paginatedSearchProvider);
  // print("paginatedSearchRenderList: ${result.assets.length}");
  return ref.watch(
    renderListProviderWithGrouping(
      (result.assets, GroupAssetsBy.none),
    ),
  );
}
