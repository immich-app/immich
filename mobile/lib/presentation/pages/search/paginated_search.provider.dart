import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/search_result.model.dart';
import 'package:immich_mobile/domain/services/search.service.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/providers/infrastructure/search.provider.dart';

final paginatedSearchProvider =
    StateNotifierProvider<PaginatedSearchNotifier, SearchResult>(
  (ref) => PaginatedSearchNotifier(ref.watch(searchServiceProvider)),
);

class PaginatedSearchNotifier extends StateNotifier<SearchResult> {
  final SearchService _searchService;

  PaginatedSearchNotifier(this._searchService)
      : super(const SearchResult(assets: [], nextPage: 1));

  Future<bool> search(SearchFilter filter) async {
    if (state.nextPage == null) {
      return false;
    }

    final result = await _searchService.search(filter, state.nextPage!);

    if (result == null) {
      return false;
    }

    state = SearchResult(
      assets: [...state.assets, ...result.assets],
      nextPage: result.nextPage,
    );

    return true;
  }

  clear() {
    state = const SearchResult(assets: [], nextPage: 1);
  }
}
