import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/favorite/providers/favorite_provider.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:isar/isar.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';

@GenerateNiceMocks([
  MockSpec<AssetNotifier>(),
])
import 'favorite_provider_test.mocks.dart';

Asset _getTestAsset(int id, bool favorite) {
  final Asset a = Asset(
    remoteId: id.toString(),
    localId: id.toString(),
    deviceId: 1,
    ownerId: 590700560494856554, // hash of "1"
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

Isar loadDb() {
  return Isar.openSync(
    [
      UserSchema,
      AssetSchema,
      StoreValueSchema,
      AlbumSchema,
    ],
    maxSizeMiB: 256,
    name: "favorite_test",
  );
}

class Listener<T> extends Mock {
  void call(T? previous, T next);
}

void main() {
  group("Test favoriteProvider", () {
    late MockAssetNotifier assetNotifier;
    late ProviderContainer container;
    late StateNotifierProvider<FavoriteSelectionNotifier, Set<int>>
        testFavoritesProvider;
    late Isar db;

    setUpAll(() async {
      WidgetsFlutterBinding.ensureInitialized();
      db = loadDb();
      Store.init(db);
      await Store.put(
        StoreKey.currentUser,
        User(
          id: "1",
          updatedAt: DateTime.now(),
          email: "a@b.c",
          firstName: "first",
          lastName: "last",
          isAdmin: false,
        ),
      );
    });

    setUp(
      () {
        assetNotifier = MockAssetNotifier();
        container = ProviderContainer();
        db.writeTxnSync(() => db.clearSync());

        testFavoritesProvider =
            StateNotifierProvider<FavoriteSelectionNotifier, Set<int>>((ref) {
          return FavoriteSelectionNotifier(
            db,
            assetNotifier,
          );
        });
      },
    );

    test("Empty favorites provider", () {
      // when(assetsState.allAssets).thenReturn([]);
      expect(<int>{}, container.read(testFavoritesProvider));
    });

    test("Non-empty favorites provider", () async {
      expect(container.read(testFavoritesProvider), <int>{});
      db.writeTxnSync(
        () => db.assets.putAllSync([
          _getTestAsset(1, false),
          _getTestAsset(2, true),
          _getTestAsset(3, false),
          _getTestAsset(4, false),
          _getTestAsset(5, true),
        ]),
      );
      await Future.delayed(const Duration(milliseconds: 100));
      expect(container.read(testFavoritesProvider), <int>{2, 5});
    });

    test("Toggle favorite", () async {
      when(assetNotifier.toggleFavorite(null, false))
          .thenAnswer((_) async => false);

      final testAsset1 = _getTestAsset(1, false);
      final testAsset2 = _getTestAsset(2, true);
      expect(container.read(testFavoritesProvider), <int>{});
      db.writeTxnSync(
        () => db.assets.putAllSync([testAsset1, testAsset2]),
      );
      await Future.delayed(const Duration(milliseconds: 100));
      expect(container.read(testFavoritesProvider), <int>{2});
      await container
          .read(testFavoritesProvider.notifier)
          .toggleFavorite(testAsset2);
      verify(assetNotifier.toggleFavorite([testAsset2], false));

      await container
          .read(testFavoritesProvider.notifier)
          .toggleFavorite(testAsset1);
      verify(assetNotifier.toggleFavorite([testAsset1], true));
    });

    test("Add favorites", () async {
      when(assetNotifier.toggleFavorite(null, false))
          .thenAnswer((_) async => false);
      expect(container.read(testFavoritesProvider), <int>{});
      final testAsset1 = _getTestAsset(1, false);
      final testAsset2 = _getTestAsset(2, false);
      db.writeTxnSync(
        () => db.assets.putAllSync([testAsset1, testAsset2]),
      );
      expect(container.read(testFavoritesProvider), <int>{});

      await container.read(testFavoritesProvider.notifier).addToFavorites(
        [testAsset1, testAsset2],
      );

      verify(assetNotifier.toggleFavorite([testAsset1, testAsset2], true));
    });
  });
}
