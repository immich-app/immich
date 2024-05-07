import 'package:immich_mobile/providers/asset_viewer/render_list.provider.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/services/search.service.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'paginated_search.provider.g.dart';

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

  Future<List<Asset>> getNextPage(SearchFilter filter, int nextPage) async {
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

    return newState.valueOrNull ?? [];
  }

  clear() {
    state = const AsyncValue.data([]);
  }
}

@riverpod
AsyncValue<RenderList> paginatedSearchRenderList(
  PaginatedSearchRenderListRef ref,
) {
  final assets = ref.watch(paginatedSearchProvider).value;

  if (assets != null) {
    return ref.watch(
      renderListProviderWithGrouping(
        (assets, GroupAssetsBy.none),
      ),
    );
  } else {
    return const AsyncValue.loading();
  }
}
