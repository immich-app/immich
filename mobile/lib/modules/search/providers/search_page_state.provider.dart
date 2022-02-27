import 'dart:convert';

import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class SearchPageState {
  final String searchTerm;
  final bool isSearchEnabled;
  final List<String> searchSuggestion;

  SearchPageState({
    required this.searchTerm,
    required this.isSearchEnabled,
    required this.searchSuggestion,
  });

  SearchPageState copyWith({
    String? searchTerm,
    bool? isSearchEnabled,
    List<String>? searchSuggestion,
  }) {
    return SearchPageState(
      searchTerm: searchTerm ?? this.searchTerm,
      isSearchEnabled: isSearchEnabled ?? this.isSearchEnabled,
      searchSuggestion: searchSuggestion ?? this.searchSuggestion,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'searchTerm': searchTerm,
      'isSearchEnabled': isSearchEnabled,
      'searchSuggestion': searchSuggestion,
    };
  }

  factory SearchPageState.fromMap(Map<String, dynamic> map) {
    return SearchPageState(
      searchTerm: map['searchTerm'] ?? '',
      isSearchEnabled: map['isSearchEnabled'] ?? false,
      searchSuggestion: List<String>.from(map['searchSuggestion']),
    );
  }

  String toJson() => json.encode(toMap());

  factory SearchPageState.fromJson(String source) => SearchPageState.fromMap(json.decode(source));

  @override
  String toString() =>
      'SearchPageState(searchTerm: $searchTerm, isSearchEnabled: $isSearchEnabled, searchSuggestion: $searchSuggestion)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return other is SearchPageState &&
        other.searchTerm == searchTerm &&
        other.isSearchEnabled == isSearchEnabled &&
        listEquals(other.searchSuggestion, searchSuggestion);
  }

  @override
  int get hashCode => searchTerm.hashCode ^ isSearchEnabled.hashCode ^ searchSuggestion.hashCode;
}

class SearchPageStateNotifier extends StateNotifier<SearchPageState> {
  SearchPageStateNotifier()
      : super(
          SearchPageState(
            searchTerm: "",
            isSearchEnabled: false,
            searchSuggestion: [],
          ),
        );

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
    var searchList = ['January', '01 2022', 'feburary', "February", 'home', '3413'];

    var newList = searchList.where((e) => e.toLowerCase().contains(searchTerm));

    state = state.copyWith(searchSuggestion: [...newList]);

    if (searchTerm.isEmpty) {
      state = state.copyWith(searchSuggestion: []);
    }
  }
}

final searchPageStateProvider = StateNotifierProvider<SearchPageStateNotifier, SearchPageState>((ref) {
  return SearchPageStateNotifier();
});
