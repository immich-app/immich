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

Asset _getTestAsset(String id, bool favorite) {
  return Asset(
    remoteId: id,
    deviceAssetId: '',
    deviceId: '',
    ownerId: '',
    fileCreatedAt: DateTime.now(),
    fileModifiedAt: DateTime.now(),
    durationInSeconds: 0,
    fileName: '',
    isFavorite: favorite,
  );
}

void main() {
  group("Test favoriteProvider", () {

    late MockAssetsState assetsState;
    late MockAssetNotifier assetNotifier;
    late ProviderContainer container;
    late StateNotifierProvider<FavoriteSelectionNotifier, Set<String>> testFavoritesProvider;

    setUp(() {
      assetsState = MockAssetsState();
      assetNotifier = MockAssetNotifier();
      container = ProviderContainer();

      testFavoritesProvider =
          StateNotifierProvider<FavoriteSelectionNotifier, Set<String>>((ref) {
            return FavoriteSelectionNotifier(
              assetsState,
              assetNotifier,
            );
          });
    },);

    test("Empty favorites provider", () {
      when(assetsState.allAssets).thenReturn([]);
      expect(<String>{}, container.read(testFavoritesProvider));
    });

    test("Non-empty favorites provider", () {
      when(assetsState.allAssets).thenReturn([
        _getTestAsset("001", false),
        _getTestAsset("002", true),
        _getTestAsset("003", false),
        _getTestAsset("004", false),
        _getTestAsset("005", true),
      ]);

      expect(<String>{"002", "005"}, container.read(testFavoritesProvider));
    });

    test("Toggle favorite", () {
      when(assetNotifier.toggleFavorite(null, false))
          .thenAnswer((_) async => false);

      final testAsset1 = _getTestAsset("001", false);
      final testAsset2 = _getTestAsset("002", true);

      when(assetsState.allAssets).thenReturn([testAsset1, testAsset2]);

      expect(<String>{"002"}, container.read(testFavoritesProvider));

      container.read(testFavoritesProvider.notifier).toggleFavorite(testAsset2);
      expect(<String>{}, container.read(testFavoritesProvider));

      container.read(testFavoritesProvider.notifier).toggleFavorite(testAsset1);
      expect(<String>{"001"}, container.read(testFavoritesProvider));
    });

    test("Add favorites", () {
      when(assetNotifier.toggleFavorite(null, false))
          .thenAnswer((_) async => false);

      when(assetsState.allAssets).thenReturn([]);

      expect(<String>{}, container.read(testFavoritesProvider));

      container.read(testFavoritesProvider.notifier).addToFavorites(
        [
          _getTestAsset("001", false),
          _getTestAsset("002", false),
        ],
      );

      expect(<String>{"001", "002"}, container.read(testFavoritesProvider));
    });
  });
}
