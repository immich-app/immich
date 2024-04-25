import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/search/models/curated_content.dart';
import 'package:immich_mobile/modules/search/models/search_page_state.model.dart';

import 'package:immich_mobile/modules/search/services/search.service.dart';
import 'package:openapi/api.dart';

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

final getPlacesProvider =
    FutureProvider.autoDispose<List<CuratedContent>>((ref) async {
  final SearchService searchService = ref.watch(searchServiceProvider);

  final exploreData = await searchService.getExploreData();

  if (exploreData == null) {
    return [];
  }

  final locations =
      exploreData.firstWhere((data) => data.fieldName == "exifInfo.city").items;

  final curatedContent = locations
      .map(
        (l) => CuratedContent(
          label: l.value,
          id: l.data.id,
        ),
      )
      .toList();

  return curatedContent;
});
