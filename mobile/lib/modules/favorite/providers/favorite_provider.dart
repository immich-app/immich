import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:openapi/api.dart';

class FavoriteSelectionNotifier extends StateNotifier<Set<String>> {
  FavoriteSelectionNotifier(this.ref) : super({}) {
    state = ref.watch(assetProvider).allAssets
        .where((asset) => asset.remote?.isFavorite == true)
        .map((asset) => asset.id)
        .toSet();
  }

  final Ref ref;

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

  Future<void> toggleFavorite(AssetResponseDto asset) async {
    _setFavoriteForAssetId(asset.id, !_isFavorite(asset.id));

    await ref.watch(assetProvider.notifier).toggleFavorite(
      asset,
      state.contains(asset.id),
    );
  }
}

final favoriteProvider =
    StateNotifierProvider<FavoriteSelectionNotifier, Set<String>>((ref) {
  return FavoriteSelectionNotifier(ref);
});

final favoriteAssetProvider = StateProvider((ref) {
  final favorites = ref.watch(favoriteProvider);

  return ref
      .watch(assetProvider)
      .allAssets
      .where((element) => favorites.contains(element.id))
      .toList();
});
