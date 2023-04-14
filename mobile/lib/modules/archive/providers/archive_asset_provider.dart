import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';

class ArchiveSelectionNotifier extends StateNotifier<Set<int>> {
  ArchiveSelectionNotifier(this.assetsState, this.assetNotifier) : super({}) {
    state = assetsState.allAssets
        .where((asset) => asset.isFavorite)
        .map((asset) => asset.id)
        .toSet();
  }

  final AssetsState assetsState;
  final AssetNotifier assetNotifier;

  void _setFavoriteForAssetId(int id, bool favorite) {
    if (!favorite) {
      state = state.difference({id});
    } else {
      state = state.union({id});
    }
  }

  bool _isFavorite(int id) {
    return state.contains(id);
  }

  Future<void> toggleFavorite(Asset asset) async {
    if (!asset.isRemote) return; // TODO support local favorite assets

    _setFavoriteForAssetId(asset.id, !_isFavorite(asset.id));

    await assetNotifier.toggleFavorite(
      asset,
      state.contains(asset.id),
    );
  }

  Future<void> addToFavorites(Iterable<Asset> assets) {
    state = state.union(assets.map((a) => a.id).toSet());
    final futures = assets.map(
      (a) => assetNotifier.toggleFavorite(
        a,
        true,
      ),
    );

    return Future.wait(futures);
  }
}

final archiveProvider =
    StateNotifierProvider<ArchiveSelectionNotifier, Set<int>>((ref) {
  return ArchiveSelectionNotifier(
    ref.watch(assetProvider),
    ref.watch(assetProvider.notifier),
  );
});

final archiveAssetProvider = StateProvider((ref) {
  return ref
      .watch(assetProvider)
      .allAssets
      .where((asset) => asset.isArchived)
      .toList();
});
