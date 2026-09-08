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

  StreamSubscription<Set<String>>? _matchingIdsSubscription;
  AssetVisibility _visibility = AssetVisibility.timeline;
  final Set<String> _knownMatchingIds = {};

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

    final assets = [...state.assets, ...result.assets];
    state = SearchState(assets: assets, nextPage: result.nextPage);

    _assetCountController.add(assets.length);
    _watchMatchingIds();
  }

  void clear() {
    unawaited(_matchingIdsSubscription?.cancel());
    _matchingIdsSubscription = null;
    _knownMatchingIds.clear();
    state = const SearchState();
    _assetCountController.add(0);
  }

  void _watchMatchingIds() {
    unawaited(_matchingIdsSubscription?.cancel());

    final ids = state.assets.whereType<RemoteAsset>().map((asset) => asset.id).toList(growable: false);
    if (ids.isEmpty) {
      _matchingIdsSubscription = null;
      return;
    }

    _matchingIdsSubscription = _remoteAssetRepository.watchMatchingIds(ids, _visibility).listen(_onMatchingIds);
  }

  void _onMatchingIds(Set<String> matchingIds) {
    _knownMatchingIds.addAll(matchingIds);

    final survivors = state.assets
        .where((asset) {
          if (asset is! RemoteAsset || matchingIds.contains(asset.id)) {
            return true;
          }
          return !_knownMatchingIds.contains(asset.id);
        })
        .toList(growable: false);

    if (survivors.length == state.assets.length) {
      return;
    }

    state = SearchState(assets: survivors, nextPage: state.nextPage, isLoading: state.isLoading);
    _assetCountController.add(survivors.length);
  }

  @override
  void dispose() {
    unawaited(_matchingIdsSubscription?.cancel());
    unawaited(_assetCountController.close());
    super.dispose();
  }
}
