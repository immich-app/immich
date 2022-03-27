import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/search/models/curated_location.model.dart';
import 'package:immich_mobile/modules/search/models/curated_object.model.dart';
import 'package:immich_mobile/modules/search/models/search_page_state.model.dart';

import 'package:immich_mobile/modules/search/services/search.service.dart';

class SearchPageStateNotifier extends StateNotifier<SearchPageState> {
  SearchPageStateNotifier()
      : super(
          SearchPageState(
            searchTerm: "",
            isSearchEnabled: false,
            searchSuggestion: [],
            userSuggestedSearchTerms: [],
          ),
        );

  final SearchService _searchService = SearchService();

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
    var userSuggestedSearchTerms = await _searchService.getUserSuggestedSearchTerms();

    state = state.copyWith(userSuggestedSearchTerms: userSuggestedSearchTerms);
  }
}

final searchPageStateProvider = StateNotifierProvider<SearchPageStateNotifier, SearchPageState>((ref) {
  return SearchPageStateNotifier();
});

final getCuratedLocationProvider = FutureProvider.autoDispose<List<CuratedLocation>>((ref) async {
  final SearchService _searchService = SearchService();

  var curatedLocation = await _searchService.getCuratedLocation();
  if (curatedLocation != null) {
    return curatedLocation;
  } else {
    return [];
  }
});

final getCuratedObjectProvider = FutureProvider.autoDispose<List<CuratedObject>>((ref) async {
  final SearchService _searchService = SearchService();

  var curatedObject = await _searchService.getCuratedObjects();
  if (curatedObject != null) {
    return curatedObject;
  } else {
    return [];
  }
});
