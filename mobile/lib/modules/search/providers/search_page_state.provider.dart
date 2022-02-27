import 'dart:convert';

import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

<<<<<<< HEAD
=======
import 'package:immich_mobile/modules/search/services/search.service.dart';

>>>>>>> bfde3084924e247bc8f7004babf38605fe341a18
class SearchPageState {
  final String searchTerm;
  final bool isSearchEnabled;
  final List<String> searchSuggestion;
<<<<<<< HEAD
=======
  final List<String> userSuggestedSearchTerms;
>>>>>>> bfde3084924e247bc8f7004babf38605fe341a18

  SearchPageState({
    required this.searchTerm,
    required this.isSearchEnabled,
    required this.searchSuggestion,
<<<<<<< HEAD
=======
    required this.userSuggestedSearchTerms,
>>>>>>> bfde3084924e247bc8f7004babf38605fe341a18
  });

  SearchPageState copyWith({
    String? searchTerm,
    bool? isSearchEnabled,
    List<String>? searchSuggestion,
<<<<<<< HEAD
=======
    List<String>? userSuggestedSearchTerms,
>>>>>>> bfde3084924e247bc8f7004babf38605fe341a18
  }) {
    return SearchPageState(
      searchTerm: searchTerm ?? this.searchTerm,
      isSearchEnabled: isSearchEnabled ?? this.isSearchEnabled,
      searchSuggestion: searchSuggestion ?? this.searchSuggestion,
<<<<<<< HEAD
=======
      userSuggestedSearchTerms: userSuggestedSearchTerms ?? this.userSuggestedSearchTerms,
>>>>>>> bfde3084924e247bc8f7004babf38605fe341a18
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'searchTerm': searchTerm,
      'isSearchEnabled': isSearchEnabled,
      'searchSuggestion': searchSuggestion,
<<<<<<< HEAD
=======
      'userSuggestedSearchTerms': userSuggestedSearchTerms,
>>>>>>> bfde3084924e247bc8f7004babf38605fe341a18
    };
  }

  factory SearchPageState.fromMap(Map<String, dynamic> map) {
    return SearchPageState(
      searchTerm: map['searchTerm'] ?? '',
      isSearchEnabled: map['isSearchEnabled'] ?? false,
      searchSuggestion: List<String>.from(map['searchSuggestion']),
<<<<<<< HEAD
=======
      userSuggestedSearchTerms: List<String>.from(map['userSuggestedSearchTerms']),
>>>>>>> bfde3084924e247bc8f7004babf38605fe341a18
    );
  }

  String toJson() => json.encode(toMap());

  factory SearchPageState.fromJson(String source) => SearchPageState.fromMap(json.decode(source));

  @override
<<<<<<< HEAD
  String toString() =>
      'SearchPageState(searchTerm: $searchTerm, isSearchEnabled: $isSearchEnabled, searchSuggestion: $searchSuggestion)';
=======
  String toString() {
    return 'SearchPageState(searchTerm: $searchTerm, isSearchEnabled: $isSearchEnabled, searchSuggestion: $searchSuggestion, userSuggestedSearchTerms: $userSuggestedSearchTerms)';
  }
>>>>>>> bfde3084924e247bc8f7004babf38605fe341a18

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return other is SearchPageState &&
        other.searchTerm == searchTerm &&
        other.isSearchEnabled == isSearchEnabled &&
<<<<<<< HEAD
        listEquals(other.searchSuggestion, searchSuggestion);
  }

  @override
  int get hashCode => searchTerm.hashCode ^ isSearchEnabled.hashCode ^ searchSuggestion.hashCode;
=======
        listEquals(other.searchSuggestion, searchSuggestion) &&
        listEquals(other.userSuggestedSearchTerms, userSuggestedSearchTerms);
  }

  @override
  int get hashCode {
    return searchTerm.hashCode ^
        isSearchEnabled.hashCode ^
        searchSuggestion.hashCode ^
        userSuggestedSearchTerms.hashCode;
  }
>>>>>>> bfde3084924e247bc8f7004babf38605fe341a18
}

class SearchPageStateNotifier extends StateNotifier<SearchPageState> {
  SearchPageStateNotifier()
      : super(
          SearchPageState(
            searchTerm: "",
            isSearchEnabled: false,
            searchSuggestion: [],
<<<<<<< HEAD
          ),
        );

=======
            userSuggestedSearchTerms: [],
          ),
        );

  final SearchService _searchService = SearchService();

>>>>>>> bfde3084924e247bc8f7004babf38605fe341a18
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
<<<<<<< HEAD
    var searchList = ['January', '01 2022', 'feburary', "February", 'home', '3413'];
=======
    var searchList = state.userSuggestedSearchTerms;
>>>>>>> bfde3084924e247bc8f7004babf38605fe341a18

    var newList = searchList.where((e) => e.toLowerCase().contains(searchTerm));

    state = state.copyWith(searchSuggestion: [...newList]);

    if (searchTerm.isEmpty) {
      state = state.copyWith(searchSuggestion: []);
    }
  }
<<<<<<< HEAD
=======

  void getSuggestedSearchTerms() async {
    var userSuggestedSearchTerms = await _searchService.getUserSuggestedSearchTerms();

    state = state.copyWith(userSuggestedSearchTerms: userSuggestedSearchTerms);
  }
>>>>>>> bfde3084924e247bc8f7004babf38605fe341a18
}

final searchPageStateProvider = StateNotifierProvider<SearchPageStateNotifier, SearchPageState>((ref) {
  return SearchPageStateNotifier();
});
