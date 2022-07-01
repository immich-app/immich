import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/search/models/curated_location.model.dart';
import 'package:immich_mobile/modules/search/models/curated_object.model.dart';
import 'package:immich_mobile/modules/search/models/search_page_state.model.dart';

import 'package:immich_mobile/modules/search/services/search.service.dart';

class SearchPageStateNotifier extends StateNotifier<SearchPageState> {
  SearchPageStateNotifier(this._searchService)
      : super(
          SearchPageState(
            searchTerm: "",
            isSearchEnabled: false,
            searchSuggestion: [],
            userSuggestedSearchTerms: [],
          ),
        );

  final SearchService _searchService;

  void enableSearch() {
    state = state.copyWith(isSearchEnabled: true);
  }

  void disableSearch() {
    state = state.copyWith(isSearchEnabled: false);
  }

  void setSearchTerm(String value) {
    state = state.copyWith(searchTerm: value);

    _getSearchSuggestion(state.searchTerm);
  }

  void _getSearchSuggestion(String searchTerm) {
    var searchList = state.userSuggestedSearchTerms;

    var newList = searchList.where((e) => e.toLowerCase().contains(searchTerm));

    state = state.copyWith(searchSuggestion: [...newList]);

    if (searchTerm.isEmpty) {
      state = state.copyWith(searchSuggestion: []);
    }
  }

  void getSuggestedSearchTerms() async {
    var userSuggestedSearchTerms =
        await _searchService.getUserSuggestedSearchTerms();

    state = state.copyWith(userSuggestedSearchTerms: userSuggestedSearchTerms);
  }
}

final searchPageStateProvider =
    StateNotifierProvider<SearchPageStateNotifier, SearchPageState>((ref) {
  return SearchPageStateNotifier(ref.watch(searchServiceProvider));
});

final getCuratedLocationProvider =
    FutureProvider.autoDispose<List<CuratedLocation>>((ref) async {
  final SearchService searchService = ref.watch(searchServiceProvider);

  var curatedLocation = await searchService.getCuratedLocation();
  return curatedLocation ?? [];
});

final getCuratedObjectProvider =
    FutureProvider.autoDispose<List<CuratedObject>>((ref) async {
  final SearchService searchService = ref.watch(searchServiceProvider);

  var curatedObject = await searchService.getCuratedObjects();

  return curatedObject ?? [];
});
