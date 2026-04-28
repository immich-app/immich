import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/search.service.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/providers/infrastructure/search.provider.dart';
import 'package:immich_mobile/providers/sync_status.provider.dart';

final searchPreFilterProvider = NotifierProvider<SearchFilterProvider, SearchFilter?>(SearchFilterProvider.new);

class SearchFilterProvider extends Notifier<SearchFilter?> {
  @override
  SearchFilter? build() {
    return null;
  }

  void setFilter(SearchFilter? filter) {
    state = filter;
  }

  void clear() {
    state = null;
  }
}

class SearchState {
  final List<BaseAsset> assets;
  final int? nextPage;
  final bool isLoading;

  const SearchState({this.assets = const [], this.nextPage = 1, this.isLoading = false});
}

final paginatedSearchProvider = StateNotifierProvider<PaginatedSearchNotifier, SearchState>((ref) {
  final notifier = PaginatedSearchNotifier(ref.watch(searchServiceProvider));
  ref.listen<int>(syncStatusProvider.select((state) => state.remoteContentChangedCount), (previous, next) {
    if (previous != null && next != previous) {
      unawaited(notifier.refreshActiveSearch());
    }
  });
  return notifier;
});

class PaginatedSearchNotifier extends StateNotifier<SearchState> {
  final SearchService _searchService;
  final _assetCountController = StreamController<int>.broadcast();
  SearchFilter? _activeFilter;

  PaginatedSearchNotifier(this._searchService) : super(const SearchState());

  Stream<int> get assetCount => _assetCountController.stream;

  Future<void> search(SearchFilter filter) async {
    if (state.nextPage == null || state.isLoading) return;
    _activeFilter = filter;

    state = SearchState(assets: state.assets, nextPage: state.nextPage, isLoading: true);

    final result = await _searchService.search(filter, state.nextPage!);

    if (result == null) {
      state = SearchState(assets: state.assets, nextPage: state.nextPage);
      return;
    }

    final assets = [...state.assets, ...result.assets];
    state = SearchState(assets: assets, nextPage: result.nextPage);

    _assetCountController.add(assets.length);
  }

  Future<void> refreshActiveSearch() async {
    final filter = _activeFilter;
    if (filter == null || state.isLoading) {
      return;
    }

    state = const SearchState();
    _assetCountController.add(0);
    await search(filter);
  }

  void clear() {
    _activeFilter = null;
    state = const SearchState();
    _assetCountController.add(0);
  }

  @override
  void dispose() {
    _assetCountController.close();
    super.dispose();
  }
}
