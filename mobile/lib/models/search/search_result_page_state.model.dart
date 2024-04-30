import 'package:collection/collection.dart';
import 'package:immich_mobile/entities/asset.entity.dart';

class SearchResultPageState {
  final bool isLoading;
  final bool isSuccess;
  final bool isError;
  final bool isSmart;
  final List<Asset> searchResult;

  SearchResultPageState({
    required this.isLoading,
    required this.isSuccess,
    required this.isError,
    required this.isSmart,
    required this.searchResult,
  });

  SearchResultPageState copyWith({
    bool? isLoading,
    bool? isSuccess,
    bool? isError,
    bool? isSmart,
    List<Asset>? searchResult,
  }) {
    return SearchResultPageState(
      isLoading: isLoading ?? this.isLoading,
      isSuccess: isSuccess ?? this.isSuccess,
      isError: isError ?? this.isError,
      isSmart: isSmart ?? this.isSmart,
      searchResult: searchResult ?? this.searchResult,
    );
  }

  @override
  String toString() {
    return 'SearchresultPageState(isLoading: $isLoading, isSuccess: $isSuccess, isError: $isError, isSmart: $isSmart, searchResult: $searchResult)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return other is SearchResultPageState &&
        other.isLoading == isLoading &&
        other.isSuccess == isSuccess &&
        other.isError == isError &&
        other.isSmart == isSmart &&
        listEquals(other.searchResult, searchResult);
  }

  @override
  int get hashCode {
    return isLoading.hashCode ^
        isSuccess.hashCode ^
        isError.hashCode ^
        isSmart.hashCode ^
        searchResult.hashCode;
  }
}
