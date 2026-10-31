import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/search.service.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/providers/infrastructure/search.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';

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
  final String? nextCursor;
  final bool isLoading;

  const SearchState({this.assets = const [], this.nextCursor, this.isLoading = false});

  bool get hasMore => assets.isEmpty || nextCursor != null;
}

final paginatedSearchProvider = StateNotifierProvider<PaginatedSearchNotifier, SearchState>(
  (ref) => PaginatedSearchNotifier(ref.watch(searchServiceProvider), ref),
);

class PaginatedSearchNotifier extends StateNotifier<SearchState> {
  final SearchService _searchService;
  final Ref _ref;
  final _assetCountController = StreamController<int>.broadcast();

  PaginatedSearchNotifier(this._searchService, this._ref) : super(const SearchState());

  Stream<int> get assetCount => _assetCountController.stream;

  Future<void> search(SearchFilter filter) async {
    if (!state.hasMore || state.isLoading) {
      return;
    }

    state = SearchState(assets: state.assets, nextCursor: state.nextCursor, isLoading: true);

    final serverVersion = _ref.read(serverInfoProvider).serverVersion;
    final result = await _searchService.search(filter, state.nextCursor, serverVersion);

    if (result == null) {
      state = SearchState(assets: state.assets, nextCursor: state.nextCursor);
      return;
    }

    final assets = [...state.assets, ...result.assets];
    state = SearchState(assets: assets, nextCursor: result.nextCursor);

    _assetCountController.add(assets.length);
  }

  void clear() {
    state = const SearchState();
    _assetCountController.add(0);
  }

  @override
  void dispose() {
    unawaited(_assetCountController.close());
    super.dispose();
  }
}
