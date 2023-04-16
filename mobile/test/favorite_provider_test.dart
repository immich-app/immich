import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/favorite/providers/favorite_provider.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';

@GenerateNiceMocks([
  MockSpec<AssetsState>(),
  MockSpec<AssetNotifier>(),
])
import 'favorite_provider_test.mocks.dart';

Asset _getTestAsset(int id, bool favorite) {
  final Asset a = Asset(
    remoteId: id.toString(),
    localId: id.toString(),
    deviceId: 1,
    ownerId: 1,
    fileCreatedAt: DateTime.now(),
    fileModifiedAt: DateTime.now(),
    updatedAt: DateTime.now(),
    isLocal: false,
    durationInSeconds: 0,
    type: AssetType.image,
    fileName: '',
    isFavorite: favorite,
    isArchived: false,
  );
  a.id = id;
  return a;
}

void main() {
  group("Test favoriteProvider", () {
    late MockAssetsState assetsState;
    late MockAssetNotifier assetNotifier;
    late ProviderContainer container;
    late StateNotifierProvider<FavoriteSelectionNotifier, Set<int>>
        testFavoritesProvider;

    setUp(
      () {
        assetsState = MockAssetsState();
        assetNotifier = MockAssetNotifier();
        container = ProviderContainer();

        testFavoritesProvider =
            StateNotifierProvider<FavoriteSelectionNotifier, Set<int>>((ref) {
          return FavoriteSelectionNotifier(
            assetsState,
            assetNotifier,
          );
        });
      },
    );

    test("Empty favorites provider", () {
      when(assetsState.allAssets).thenReturn([]);
      expect(<int>{}, container.read(testFavoritesProvider));
    });

    test("Non-empty favorites provider", () {
      when(assetsState.allAssets).thenReturn([
        _getTestAsset(1, false),
        _getTestAsset(2, true),
        _getTestAsset(3, false),
        _getTestAsset(4, false),
        _getTestAsset(5, true),
      ]);

      expect(<int>{2, 5}, container.read(testFavoritesProvider));
    });

    test("Toggle favorite", () {
      when(assetNotifier.toggleFavorite(null, false))
          .thenAnswer((_) async => false);

      final testAsset1 = _getTestAsset(1, false);
      final testAsset2 = _getTestAsset(2, true);

      when(assetsState.allAssets).thenReturn([testAsset1, testAsset2]);

      expect(<int>{2}, container.read(testFavoritesProvider));

      container.read(testFavoritesProvider.notifier).toggleFavorite(testAsset2);
      expect(<int>{}, container.read(testFavoritesProvider));

      container.read(testFavoritesProvider.notifier).toggleFavorite(testAsset1);
      expect(<int>{1}, container.read(testFavoritesProvider));
    });

    test("Add favorites", () {
      when(assetNotifier.toggleFavorite(null, false))
          .thenAnswer((_) async => false);

      when(assetsState.allAssets).thenReturn([]);

      expect(<int>{}, container.read(testFavoritesProvider));

      container.read(testFavoritesProvider.notifier).addToFavorites(
        [
          _getTestAsset(1, false),
          _getTestAsset(2, false),
        ],
      );

      expect(<int>{1, 2}, container.read(testFavoritesProvider));
    });
  });
}
