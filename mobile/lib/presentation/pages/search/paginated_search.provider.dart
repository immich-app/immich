import 'dart:async';

import 'package:drift/drift.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/search.service.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_asset.repository.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/search.provider.dart';
import 'package:immich_mobile/providers/private_session.provider.dart';

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
  final db = ref.watch(driftProvider);
  final notifier = PaginatedSearchNotifier(ref.watch(searchServiceProvider), db.remoteAssetRepository);
  final syncChanges = db.tableUpdates(TableUpdateQuery.onTable(db.authUserEntity)).listen((_) => notifier.reload());
  ref.onDispose(() => unawaited(syncChanges.cancel()));
  ref.listen(privateSessionProvider, (wasUnlocked, unlocked) {
    if (wasUnlocked == true && !unlocked) {
      notifier.reload();
    }
  });
  return notifier;
});

class PaginatedSearchNotifier extends StateNotifier<SearchState> {
  final SearchService _searchService;
  final RemoteAssetRepository _remoteAssetRepository;
  final _assetCountController = StreamController<int>.broadcast();

  StreamSubscription<Set<String>>? _deletedIdsSubscription;
  List<BaseAsset> _results = const [];
  int? _nextPage = 1;
  int _revision = 0;
  SearchFilter? _filter;

  PaginatedSearchNotifier(this._searchService, this._remoteAssetRepository) : super(const SearchState());

  Stream<int> get assetCount => _assetCountController.stream.distinct();

  Future<void> search(SearchFilter filter) async {
    if (state.nextPage == null || state.isLoading) {
      return;
    }

    state = SearchState(assets: state.assets, nextPage: state.nextPage, isLoading: true);

    _filter = filter;
    final revision = _revision;
    final result = await _searchService.search(filter, state.nextPage!);

    if (!mounted || revision != _revision) {
      return;
    }

    if (result == null) {
      state = SearchState(assets: state.assets, nextPage: state.nextPage);
      return;
    }

    _results = [..._results, ...result.assets];
    _nextPage = result.nextPage;
    _watchDeletedIds(filter.display.isArchive ? AssetVisibility.archive : AssetVisibility.timeline);
  }

  void reload() {
    final filter = _filter;
    clear();
    if (filter != null) {
      unawaited(search(filter));
    }
  }

  void clear() {
    _revision++;
    _filter = null;
    unawaited(_deletedIdsSubscription?.cancel());
    _deletedIdsSubscription = null;
    _results = const [];
    _nextPage = 1;
    _emit(const {});
  }

  void _watchDeletedIds(AssetVisibility visibility) {
    unawaited(_deletedIdsSubscription?.cancel());

    final ids = _results.whereType<RemoteAsset>().map((asset) => asset.id);
    var first = true;
    _deletedIdsSubscription = _remoteAssetRepository.watchDeletedAssetIds(ids, visibility).listen((deletedIds) {
      _emit(deletedIds, isLoading: !first && state.isLoading);
      first = false;
    });
  }

  void _emit(Set<String> deletedIds, {bool isLoading = false}) {
    if (deletedIds.isNotEmpty) {
      _results = _results
          .where((asset) => asset is! RemoteAsset || !deletedIds.contains(asset.id))
          .toList(growable: false);
    }
    state = SearchState(assets: _results, nextPage: _nextPage, isLoading: isLoading);
    _assetCountController.add(_results.length);
  }

  @override
  void dispose() {
    unawaited(_deletedIdsSubscription?.cancel());
    unawaited(_assetCountController.close());
    super.dispose();
  }
}
