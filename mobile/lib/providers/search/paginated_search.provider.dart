import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/search/search_result.model.dart';
import 'package:immich_mobile/providers/search/is_searching.provider.dart';
import 'package:immich_mobile/services/timeline.service.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/services/search.service.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'paginated_search.provider.g.dart';

final paginatedSearchProvider =
    StateNotifierProvider<PaginatedSearchNotifier, SearchResult>(
  (ref) => PaginatedSearchNotifier(ref),
);

class PaginatedSearchNotifier extends StateNotifier<SearchResult> {
  final Ref ref;

  PaginatedSearchNotifier(this.ref)
      : super(const SearchResult(assets: [], nextPage: 1));

  Future<bool> search(SearchFilter filter) async {
    if (state.nextPage == null) {
      return false;
    }

    ref.read(isSearchingProvider.notifier).value = true;
    try {
      final result =
          await ref.read(searchServiceProvider).search(filter, state.nextPage!);
      if (result == null) {
        return false;
      }

      state = SearchResult(
        assets: [...state.assets, ...result.assets],
        nextPage: result.nextPage,
      );
    } finally {
      ref.read(isSearchingProvider.notifier).value = false;
    }

    return true;
  }

  clear() {
    state = const SearchResult(assets: [], nextPage: 1);
  }
}

@riverpod
Future<RenderList> paginatedSearchRenderList(
  PaginatedSearchRenderListRef ref,
) {
  final result = ref.watch(paginatedSearchProvider);
  final timelineService = ref.watch(timelineServiceProvider);
  return timelineService.getTimelineFromAssets(
    result.assets,
    GroupAssetsBy.none,
  );
}
