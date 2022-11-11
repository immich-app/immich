import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/modules/search/models/search_result_page_state.model.dart';

import 'package:immich_mobile/modules/search/services/search.service.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:intl/intl.dart';

class SearchResultPageNotifier extends StateNotifier<SearchResultPageState> {
  SearchResultPageNotifier(this._searchService)
      : super(
          SearchResultPageState(
            searchResult: [],
            isError: false,
            isLoading: true,
            isSuccess: false,
          ),
        );

  final SearchService _searchService;

  void search(String searchTerm) async {
    state = state.copyWith(
      searchResult: [],
      isError: false,
      isLoading: true,
      isSuccess: false,
    );

    List<Asset>? assets = (await _searchService.searchAsset(searchTerm))
        ?.map((e) => Asset.remote(e))
        .toList();

    if (assets != null) {
      state = state.copyWith(
        searchResult: assets,
        isError: false,
        isLoading: false,
        isSuccess: true,
      );
    } else {
      state = state.copyWith(
        searchResult: [],
        isError: true,
        isLoading: false,
        isSuccess: false,
      );
    }
  }
}

final searchResultPageProvider =
    StateNotifierProvider<SearchResultPageNotifier, SearchResultPageState>(
        (ref) {
  return SearchResultPageNotifier(ref.watch(searchServiceProvider));
});

final searchResultGroupByDateTimeProvider = StateProvider((ref) {
  var assets = ref.watch(searchResultPageProvider).searchResult;

  assets.sortByCompare<DateTime>(
    (e) => e.createdAt,
    (a, b) => b.compareTo(a),
  );
  return assets.groupListsBy(
    (element) => DateFormat('y-MM-dd').format(element.createdAt.toLocal()),
  );
});

final searchRenderListProvider = StateProvider((ref) {
  var assetGroups = ref.watch(searchResultGroupByDateTimeProvider);

  var settings = ref.watch(appSettingsServiceProvider);
  final assetsPerRow = settings.getSetting(AppSettingsEnum.tilesPerRow);

  return assetGroupsToRenderList(assetGroups, assetsPerRow);
});
