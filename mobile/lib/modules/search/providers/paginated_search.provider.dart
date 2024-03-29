import 'package:immich_mobile/modules/asset_viewer/providers/render_list.provider.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/modules/search/models/search_filter.dart';
import 'package:immich_mobile/modules/search/services/search.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'paginated_search.provider.g.dart';
// @riverpod
// Future<SearchResponseDto?> search(
//   SearchRef ref,
//   SearchFilter filter,
//   int page,
// ) async {
//   final SearchService service = ref.read(searchServiceProvider);

//   final response = await service.search(filter, page);

//   return response;
// }

@riverpod
class PaginatedSearch extends _$PaginatedSearch {
  Future<List<Asset>?> _search(SearchFilter filter, int page) async {
    final service = ref.read(searchServiceProvider);
    final result = await service.search(filter, page);

    return result;
  }

  @override
  Future<List<Asset>> build() async {
    return [];
  }

  Future<void> getNextPage(SearchFilter filter, int nextPage) async {
    state = const AsyncValue.loading();

    final newState = await AsyncValue.guard(() async {
      final assets = await _search(filter, nextPage);

      if (assets != null) {
        return [...?state.value, ...assets];
      }
    });

    state = newState.valueOrNull == null
        ? const AsyncValue.data([])
        : AsyncValue.data(newState.value!);
  }

  clear() {
    state = const AsyncValue.data([]);
  }
}

@riverpod
AsyncValue<RenderList> paginatedSearchRenderList(
  PaginatedSearchRenderListRef ref,
) {
  final search = ref.watch(paginatedSearchProvider);

  if (search.hasValue && search.value != null) {
    return ref.watch(
      renderListProviderWithGrouping(
        (search.value!, GroupAssetsBy.none),
      ),
    );
  } else {
    return const AsyncValue.loading();
  }
}
