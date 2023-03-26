import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/render_list.provider.dart';
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
          ),
        );

  final SearchService _searchService;

  void search(String searchTerm) async {
    state = state.copyWith(
      searchResult: [],
      isError: false,
      isLoading: true,
      isSuccess: false,
    );

    List<Asset>? assets = await _searchService.searchAsset(searchTerm);

    if (assets != null) {
      state = state.copyWith(
        searchResult: assets,
        isError: false,
        isLoading: false,
        isSuccess: true,
      );
    } else {
      state = state.copyWith(
        searchResult: [],
        isError: true,
        isLoading: false,
        isSuccess: false,
      );
    }
  }
}

final searchResultPageProvider =
    StateNotifierProvider<SearchResultPageNotifier, SearchResultPageState>(
        (ref) {
  return SearchResultPageNotifier(ref.watch(searchServiceProvider));
});

final searchRenderListProvider = FutureProvider((ref) {
  final assets = ref.watch(searchResultPageProvider).searchResult;
  return ref.watch(renderListProvider(assets));
});
