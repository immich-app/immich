import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';

class FavoriteNotifier extends StateNotifier<List<Asset>> {
  FavoriteNotifier(List<Asset> assets) : super([]) {
    state = assets
        .where((element) => element.isRemote)
        .map((e) => e.remote!)
        .where((element) => element.isFavorite)
        .map(Asset.remote)
        .toList();
  }
}

final favoriteProvider =
    StateNotifierProvider<FavoriteNotifier, List<Asset>>((ref) {
  final allAssets = ref.watch(assetProvider).allAssets;

  return FavoriteNotifier(allAssets);
});
