import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';

class FavoriteSelectionNotifier extends StateNotifier<Set<String>> {
  FavoriteSelectionNotifier(this.assetsState, this.assetNotifier) : super({}) {
    state = assetsState.allAssets
        .where((asset) => asset.isFavorite)
        .map((asset) => asset.id)
        .toSet();
  }

  final AssetsState assetsState;
  final AssetNotifier assetNotifier;

  void _setFavoriteForAssetId(String id, bool favorite) {
    if (!favorite) {
      state = state.difference({id});
    } else {
      state = state.union({id});
    }
  }

  bool _isFavorite(String id) {
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
    final futures = assets.map((a) =>
        assetNotifier.toggleFavorite(
          a,
          true,
        ),
      );

    return Future.wait(futures);
  }
}

final favoriteProvider =
    StateNotifierProvider<FavoriteSelectionNotifier, Set<String>>((ref) {
  return FavoriteSelectionNotifier(
      ref.watch(assetProvider),
      ref.watch(assetProvider.notifier),
  );
});

final favoriteAssetProvider = StateProvider((ref) {
  final favorites = ref.watch(favoriteProvider);

  return ref
      .watch(assetProvider)
      .allAssets
      .where((element) => favorites.contains(element.id))
      .toList();
});
