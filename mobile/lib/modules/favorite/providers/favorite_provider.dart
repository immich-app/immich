import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:isar/isar.dart';

class FavoriteSelectionNotifier extends StateNotifier<Set<int>> {
  FavoriteSelectionNotifier(Isar db, this.assetNotifier) : super({}) {
    final query = db.assets
        .filter()
        .ownerIdEqualTo(Store.get(StoreKey.currentUser).isarId)
        .isFavoriteEqualTo(true)
        .idProperty();
    query.findAll().then((value) => state = value.toSet());
    query.watch().listen((event) {
      state = event.toSet();
    });
  }

  final AssetNotifier assetNotifier;

  Future<void> toggleFavorite(Asset asset) async {
    // TODO support local favorite assets
    if (asset.storage == AssetState.local) return;
    await assetNotifier.toggleFavorite([asset], state.contains(asset.id));
  }

  Future<void> addToFavorites(List<Asset> assets) {
    return assetNotifier.toggleFavorite(assets, true);
  }

  Future<void> removeFavorites(List<Asset> assets) {
    return assetNotifier.toggleFavorite(assets, false);
  }
}

final favoriteProvider =
    StateNotifierProvider<FavoriteSelectionNotifier, Set<int>>((ref) {
  return FavoriteSelectionNotifier(
    ref.watch(dbProvider),
    ref.watch(assetProvider.notifier),
  );
});

final favoriteAssetsProvider = StreamProvider<RenderList>((ref) async* {
  final query = ref
      .watch(dbProvider)
      .assets
      .filter()
      .ownerIdEqualTo(Store.get(StoreKey.currentUser).isarId)
      .isFavoriteEqualTo(true)
      .sortByFileCreatedAt();
  final settings = ref.watch(appSettingsServiceProvider);
  yield await RenderList.fromQuery(
    query,
    GroupAssetsBy.values[settings.getSetting(AppSettingsEnum.groupAssetsBy)],
  );
  await for (final _ in query.watchLazy()) {
    yield await RenderList.fromQuery(
      query,
      GroupAssetsBy.values[settings.getSetting(AppSettingsEnum.groupAssetsBy)],
    );
  }
});
