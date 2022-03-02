import 'dart:convert';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/search/services/search.service.dart';

class SearchresultPageState {
  final bool isLoading = true;
  final bool isSuccess = false;
  final bool isError = false;
  final dynamic searchResult;
  SearchresultPageState({
    required this.searchResult,
  });

  SearchresultPageState copyWith({
    dynamic? searchResult,
  }) {
    return SearchresultPageState(
      searchResult: searchResult ?? this.searchResult,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'searchResult': searchResult,
    };
  }

  factory SearchresultPageState.fromMap(Map<String, dynamic> map) {
    return SearchresultPageState(
      searchResult: map['searchResult'],
    );
  }

  String toJson() => json.encode(toMap());

  factory SearchresultPageState.fromJson(String source) => SearchresultPageState.fromMap(json.decode(source));

  @override
  String toString() => 'SearchresultPageState(searchResult: $searchResult)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is SearchresultPageState && other.searchResult == searchResult;
  }

  @override
  int get hashCode => searchResult.hashCode;
}

class SearchResultPageStateNotifier extends StateNotifier<SearchresultPageState> {
  SearchResultPageStateNotifier() : super(SearchresultPageState(searchResult: null));

  final SearchService _searchService = SearchService();

  search(String searchTerm) async {
    var res = await _searchService.searchAsset(searchTerm);

    print(res);
  }
}

final searchResultPageStateProvider =
    StateNotifierProvider<SearchResultPageStateNotifier, SearchresultPageState>((ref) {
  return SearchResultPageStateNotifier();
});
