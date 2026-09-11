import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/search.service.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_asset.repository.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/search.provider.dart';

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

final paginatedSearchProvider = StateNotifierProvider<PaginatedSearchNotifier, SearchState>(
  (ref) => PaginatedSearchNotifier(ref.watch(searchServiceProvider), ref.watch(driftProvider).remoteAssetRepository),
);

class PaginatedSearchNotifier extends StateNotifier<SearchState> {
  final SearchService _searchService;
  final RemoteAssetRepository _remoteAssetRepository;
  final _assetCountController = StreamController<int>.broadcast();

  StreamSubscription<Set<String>>? _hiddenIdsSubscription;
  AssetVisibility _visibility = AssetVisibility.timeline;
  List<BaseAsset> _results = const [];
  Set<String> _hiddenIds = const {};

  PaginatedSearchNotifier(this._searchService, this._remoteAssetRepository) : super(const SearchState());

  Stream<int> get assetCount => _assetCountController.stream;

  Future<void> search(SearchFilter filter) async {
    if (state.nextPage == null || state.isLoading) {
      return;
    }

    _visibility = filter.display.isArchive ? AssetVisibility.archive : AssetVisibility.timeline;

    state = SearchState(assets: state.assets, nextPage: state.nextPage, isLoading: true);

    final result = await _searchService.search(filter, state.nextPage!);

    if (result == null) {
      state = SearchState(assets: state.assets, nextPage: state.nextPage);
      return;
    }

    _results = [..._results, ...result.assets];
    _emit(result.nextPage);
    _watchHiddenIds();
  }

  void clear() {
    unawaited(_hiddenIdsSubscription?.cancel());
    _hiddenIdsSubscription = null;
    _results = const [];
    _hiddenIds = const {};
    state = const SearchState();
    _assetCountController.add(0);
  }

  void _watchHiddenIds() {
    unawaited(_hiddenIdsSubscription?.cancel());

    final ids = _results.whereType<RemoteAsset>().map((asset) => asset.id).toList(growable: false);
    if (ids.isEmpty) {
      _hiddenIdsSubscription = null;
      return;
    }

    _hiddenIdsSubscription = _remoteAssetRepository.watchHiddenIds(ids, _visibility).listen((hidden) {
      _hiddenIds = hidden;
      _emit(state.nextPage);
    });
  }

  void _emit(int? nextPage) {
    final visible = _hiddenIds.isEmpty
        ? _results
        : _results.where((asset) => asset is! RemoteAsset || !_hiddenIds.contains(asset.id)).toList(growable: false);

    final changed = visible.length != state.assets.length;
    state = SearchState(assets: visible, nextPage: nextPage);
    if (changed) {
      _assetCountController.add(visible.length);
    }
  }

  @override
  void dispose() {
    unawaited(_hiddenIdsSubscription?.cancel());
    unawaited(_assetCountController.close());
    super.dispose();
  }
}
