import 'dart:convert';

import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'package:immich_mobile/modules/search/services/search.service.dart';

class SearchPageState {
  final String searchTerm;
  final bool isSearchEnabled;
  final List<String> searchSuggestion;
  final List<String> userSuggestedSearchTerms;

  SearchPageState({
    required this.searchTerm,
    required this.isSearchEnabled,
    required this.searchSuggestion,
    required this.userSuggestedSearchTerms,
  });

  SearchPageState copyWith({
    String? searchTerm,
    bool? isSearchEnabled,
    List<String>? searchSuggestion,
    List<String>? userSuggestedSearchTerms,
  }) {
    return SearchPageState(
      searchTerm: searchTerm ?? this.searchTerm,
      isSearchEnabled: isSearchEnabled ?? this.isSearchEnabled,
      searchSuggestion: searchSuggestion ?? this.searchSuggestion,
      userSuggestedSearchTerms: userSuggestedSearchTerms ?? this.userSuggestedSearchTerms,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'searchTerm': searchTerm,
      'isSearchEnabled': isSearchEnabled,
      'searchSuggestion': searchSuggestion,
      'userSuggestedSearchTerms': userSuggestedSearchTerms,
    };
  }

  factory SearchPageState.fromMap(Map<String, dynamic> map) {
    return SearchPageState(
      searchTerm: map['searchTerm'] ?? '',
      isSearchEnabled: map['isSearchEnabled'] ?? false,
      searchSuggestion: List<String>.from(map['searchSuggestion']),
      userSuggestedSearchTerms: List<String>.from(map['userSuggestedSearchTerms']),
    );
  }

  String toJson() => json.encode(toMap());

  factory SearchPageState.fromJson(String source) => SearchPageState.fromMap(json.decode(source));

  @override
  String toString() {
    return 'SearchPageState(searchTerm: $searchTerm, isSearchEnabled: $isSearchEnabled, searchSuggestion: $searchSuggestion, userSuggestedSearchTerms: $userSuggestedSearchTerms)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return other is SearchPageState &&
        other.searchTerm == searchTerm &&
        other.isSearchEnabled == isSearchEnabled &&
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
}

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
