import 'dart:convert';

import 'package:hooks_riverpod/hooks_riverpod.dart';

class SearchPageState {
  final String searchTerm;
  final bool isSearchEnabled;

  SearchPageState({
    required this.searchTerm,
    required this.isSearchEnabled,
  });

  SearchPageState copyWith({
    String? searchTerm,
    bool? isSearchActivated,
  }) {
    return SearchPageState(
      searchTerm: searchTerm ?? this.searchTerm,
      isSearchEnabled: isSearchActivated ?? isSearchEnabled,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'searchTerm': searchTerm,
      'isSearchActivated': isSearchEnabled,
    };
  }

  factory SearchPageState.fromMap(Map<String, dynamic> map) {
    return SearchPageState(
      searchTerm: map['searchTerm'] ?? '',
      isSearchEnabled: map['isSearchActivated'] ?? false,
    );
  }

  String toJson() => json.encode(toMap());

  factory SearchPageState.fromJson(String source) => SearchPageState.fromMap(json.decode(source));

  @override
  String toString() => 'SearchPageState(searchTerm: $searchTerm, isSearchActivated: $isSearchEnabled)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is SearchPageState && other.searchTerm == searchTerm && other.isSearchEnabled == isSearchEnabled;
  }

  @override
  int get hashCode => searchTerm.hashCode ^ isSearchEnabled.hashCode;
}

class SearchPageStateNotifier extends StateNotifier<SearchPageState> {
  SearchPageStateNotifier()
      : super(
          SearchPageState(
            searchTerm: "",
            isSearchEnabled: false,
          ),
        );

  void enableSearch() {
    state = state.copyWith(isSearchActivated: true);
  }

  void disableSearch() {
    state = state.copyWith(isSearchActivated: false);
  }
}

final searchPageStateProvider = StateNotifierProvider<SearchPageStateNotifier, SearchPageState>((ref) {
  return SearchPageStateNotifier();
});
