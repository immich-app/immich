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

  StreamSubscription<Set<String>>? _deletedIdsSubscription;
  List<BaseAsset> _results = const [];
  int? _nextPage = 1;

  PaginatedSearchNotifier(this._searchService, this._remoteAssetRepository) : super(const SearchState());

  Stream<int> get assetCount => _assetCountController.stream.distinct();

  Future<void> search(SearchFilter filter) async {
    if (state.nextPage == null || state.isLoading) {
      return;
    }

    state = SearchState(assets: state.assets, nextPage: state.nextPage, isLoading: true);

    final result = await _searchService.search(filter, state.nextPage!);

    if (result == null) {
      state = SearchState(assets: state.assets, nextPage: state.nextPage);
      return;
    }

    _results = [..._results, ...result.assets];
    _nextPage = result.nextPage;
    _watchDeletedIds(filter.display.isArchive ? AssetVisibility.archive : AssetVisibility.timeline);
  }

  void clear() {
    unawaited(_deletedIdsSubscription?.cancel());
    _deletedIdsSubscription = null;
    _results = const [];
    _nextPage = 1;
    _emit(const {});
  }

  void _watchDeletedIds(AssetVisibility visibility) {
    unawaited(_deletedIdsSubscription?.cancel());

    final ids = _results.whereType<RemoteAsset>().map((asset) => asset.id);
    _deletedIdsSubscription = _remoteAssetRepository.watchDeletedAssetIds(ids, visibility).listen(_emit);
  }

  void _emit(Set<String> deletedIds) {
    final visible = deletedIds.isEmpty
        ? _results
        : _results.where((asset) => asset is! RemoteAsset || !deletedIds.contains(asset.id)).toList(growable: false);

    state = SearchState(assets: visible, nextPage: _nextPage);
    _assetCountController.add(visible.length);
  }

  @override
  void dispose() {
    unawaited(_deletedIdsSubscription?.cancel());
    unawaited(_assetCountController.close());
    super.dispose();
  }
}
