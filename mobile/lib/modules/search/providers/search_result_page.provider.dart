import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/render_list.provider.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/modules/search/models/search_result_page_state.model.dart';

import 'package:immich_mobile/modules/search/services/search.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';

class SearchResultPageNotifier extends StateNotifier<SearchResultPageState> {
  SearchResultPageNotifier(this._searchService)
      : super(
          SearchResultPageState(
            searchResult: [],
            isError: false,
            isLoading: true,
            isSuccess: false,
            isSmart: false,
          ),
        );

  final SearchService _searchService;

  Future<void> search(String searchTerm, {bool smartSearch = true}) async {
    state = state.copyWith(
      searchResult: [],
      isError: false,
      isLoading: true,
      isSuccess: false,
    );

    List<Asset>? assets =
        await _searchService.searchAsset(searchTerm, smartSearch: smartSearch);

    if (assets != null) {
      state = state.copyWith(
        searchResult: assets,
        isError: false,
        isLoading: false,
        isSuccess: true,
        isSmart: smartSearch,
      );
    } else {
      state = state.copyWith(
        searchResult: [],
        isError: true,
        isLoading: false,
        isSuccess: false,
        isSmart: smartSearch,
      );
    }
  }
}

final searchResultPageProvider =
    StateNotifierProvider<SearchResultPageNotifier, SearchResultPageState>(
        (ref) {
  return SearchResultPageNotifier(ref.watch(searchServiceProvider));
});

final searchRenderListProvider = Provider((ref) {
  final result = ref.watch(searchResultPageProvider);
  return ref.watch(
    renderListProviderWithGrouping(
      (result.searchResult, result.isSmart ? GroupAssetsBy.none : null),
    ),
  );
});
