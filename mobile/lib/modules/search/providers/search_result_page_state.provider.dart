import 'dart:convert';

import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'package:immich_mobile/modules/search/services/search.service.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';
import 'package:intl/intl.dart';

class SearchresultPageState {
  final bool isLoading;
  final bool isSuccess;
  final bool isError;
  final List<ImmichAsset> searchResult;

  SearchresultPageState({
    required this.isLoading,
    required this.isSuccess,
    required this.isError,
    required this.searchResult,
  });

  SearchresultPageState copyWith({
    bool? isLoading,
    bool? isSuccess,
    bool? isError,
    List<ImmichAsset>? searchResult,
  }) {
    return SearchresultPageState(
      isLoading: isLoading ?? this.isLoading,
      isSuccess: isSuccess ?? this.isSuccess,
      isError: isError ?? this.isError,
      searchResult: searchResult ?? this.searchResult,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'isLoading': isLoading,
      'isSuccess': isSuccess,
      'isError': isError,
      'searchResult': searchResult.map((x) => x.toMap()).toList(),
    };
  }

  factory SearchresultPageState.fromMap(Map<String, dynamic> map) {
    return SearchresultPageState(
      isLoading: map['isLoading'] ?? false,
      isSuccess: map['isSuccess'] ?? false,
      isError: map['isError'] ?? false,
      searchResult: List<ImmichAsset>.from(map['searchResult']?.map((x) => ImmichAsset.fromMap(x))),
    );
  }

  String toJson() => json.encode(toMap());

  factory SearchresultPageState.fromJson(String source) => SearchresultPageState.fromMap(json.decode(source));

  @override
  String toString() {
    return 'SearchresultPageState(isLoading: $isLoading, isSuccess: $isSuccess, isError: $isError, searchResult: $searchResult)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return other is SearchresultPageState &&
        other.isLoading == isLoading &&
        other.isSuccess == isSuccess &&
        other.isError == isError &&
        listEquals(other.searchResult, searchResult);
  }

  @override
  int get hashCode {
    return isLoading.hashCode ^ isSuccess.hashCode ^ isError.hashCode ^ searchResult.hashCode;
  }
}

class SearchResultPageStateNotifier extends StateNotifier<SearchresultPageState> {
  SearchResultPageStateNotifier()
      : super(SearchresultPageState(searchResult: [], isError: false, isLoading: true, isSuccess: false));

  final SearchService _searchService = SearchService();

  search(String searchTerm) async {
    state = state.copyWith(searchResult: [], isError: false, isLoading: true, isSuccess: false);

    List<ImmichAsset>? assets = await _searchService.searchAsset(searchTerm);

    if (assets != null) {
      state = state.copyWith(searchResult: assets, isError: false, isLoading: false, isSuccess: true);
    } else {
      state = state.copyWith(searchResult: [], isError: true, isLoading: false, isSuccess: false);
    }
  }
}

final searchResultPageStateProvider =
    StateNotifierProvider<SearchResultPageStateNotifier, SearchresultPageState>((ref) {
  return SearchResultPageStateNotifier();
});

final searchResultGroupByDateTimeProvider = StateProvider((ref) {
  var assets = ref.watch(searchResultPageStateProvider).searchResult;

  assets.sortByCompare<DateTime>((e) => DateTime.parse(e.createdAt), (a, b) => b.compareTo(a));
  return assets.groupListsBy((element) => DateFormat('y-MM-dd').format(DateTime.parse(element.createdAt)));
});
