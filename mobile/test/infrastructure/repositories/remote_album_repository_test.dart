import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_album.repository.dart';

void main() {
  late Drift db;
  late DriftRemoteAlbumRepository repository;

  setUp(() {
    db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    repository = DriftRemoteAlbumRepository(db);
  });

  tearDown(() async {
    await db.close();
  });

  group('getSortedAlbumIds', () {
    Future<void> createUser(String userId, String name) async {
      await db
          .into(db.userEntity)
          .insert(
            UserEntityCompanion(
              id: Value(userId),
              name: Value(name),
              email: Value('$userId@test.com'),
              avatarColor: const Value(AvatarColor.primary),
            ),
          );
    }

    Future<void> createAlbum(String albumId, String ownerId, String name) async {
      await db
          .into(db.remoteAlbumEntity)
          .insert(
            RemoteAlbumEntityCompanion(
              id: Value(albumId),
              name: Value(name),
              ownerId: Value(ownerId),
              createdAt: Value(DateTime.now()),
              updatedAt: Value(DateTime.now()),
              description: const Value(''),
              isActivityEnabled: const Value(false),
              order: const Value(AlbumAssetOrder.asc),
            ),
          );
    }

    Future<void> createAsset(String assetId, String ownerId, DateTime createdAt) async {
      await db
          .into(db.remoteAssetEntity)
          .insert(
            RemoteAssetEntityCompanion(
              id: Value(assetId),
              checksum: Value('checksum-$assetId'),
              name: Value('asset-$assetId'),
              ownerId: Value(ownerId),
              type: const Value(AssetType.image),
              createdAt: Value(createdAt),
              updatedAt: Value(createdAt),
              localDateTime: Value(createdAt),
              durationInSeconds: const Value(0),
              height: const Value(1080),
              width: const Value(1920),
              visibility: const Value(AssetVisibility.timeline),
            ),
          );
    }

    Future<void> linkAssetToAlbum(String albumId, String assetId) async {
      await db
          .into(db.remoteAlbumAssetEntity)
          .insert(RemoteAlbumAssetEntityCompanion(albumId: Value(albumId), assetId: Value(assetId)));
    }

    test('returns empty list when albumIds is empty', () async {
      final result = await repository.getSortedAlbumIds([], aggregation: AssetDateAggregation.start);

      expect(result, isEmpty);
    });

    test('returns single album when only one album exists', () async {
      const userId = 'user1';
      const albumId = 'album1';

      await createUser(userId, 'Test User');
      await createAlbum(albumId, userId, 'Album 1');
      await createAsset('asset1', userId, DateTime(2024, 1, 1));
      await linkAssetToAlbum(albumId, 'asset1');

      final result = await repository.getSortedAlbumIds([albumId], aggregation: AssetDateAggregation.start);

      expect(result, [albumId]);
    });

    test('sorts albums by start date (MIN) ascending', () async {
      const userId = 'user1';

      await createUser(userId, 'Test User');

      // Album 1: Assets from Jan 10 to Jan 20 (start: Jan 10)
      await createAlbum('album1', userId, 'Album 1');
      await createAsset('asset1', userId, DateTime(2024, 1, 10));
      await createAsset('asset2', userId, DateTime(2024, 1, 20));
      await linkAssetToAlbum('album1', 'asset1');
      await linkAssetToAlbum('album1', 'asset2');

      // Album 2: Assets from Jan 5 to Jan 15 (start: Jan 5)
      await createAlbum('album2', userId, 'Album 2');
      await createAsset('asset3', userId, DateTime(2024, 1, 5));
      await createAsset('asset4', userId, DateTime(2024, 1, 15));
      await linkAssetToAlbum('album2', 'asset3');
      await linkAssetToAlbum('album2', 'asset4');

      // Album 3: Assets from Jan 25 to Jan 30 (start: Jan 25)
      await createAlbum('album3', userId, 'Album 3');
      await createAsset('asset5', userId, DateTime(2024, 1, 25));
      await createAsset('asset6', userId, DateTime(2024, 1, 30));
      await linkAssetToAlbum('album3', 'asset5');
      await linkAssetToAlbum('album3', 'asset6');

      final result = await repository.getSortedAlbumIds([
        'album1',
        'album2',
        'album3',
      ], aggregation: AssetDateAggregation.start);

      // Expected order: album2 (Jan 5), album1 (Jan 10), album3 (Jan 25)
      expect(result, ['album2', 'album1', 'album3']);
    });

    test('sorts albums by end date (MAX) ascending', () async {
      const userId = 'user1';

      await createUser(userId, 'Test User');

      // Album 1: Assets from Jan 10 to Jan 20 (end: Jan 20)
      await createAlbum('album1', userId, 'Album 1');
      await createAsset('asset1', userId, DateTime(2024, 1, 10));
      await createAsset('asset2', userId, DateTime(2024, 1, 20));
      await linkAssetToAlbum('album1', 'asset1');
      await linkAssetToAlbum('album1', 'asset2');

      // Album 2: Assets from Jan 5 to Jan 15 (end: Jan 15)
      await createAlbum('album2', userId, 'Album 2');
      await createAsset('asset3', userId, DateTime(2024, 1, 5));
      await createAsset('asset4', userId, DateTime(2024, 1, 15));
      await linkAssetToAlbum('album2', 'asset3');
      await linkAssetToAlbum('album2', 'asset4');

      // Album 3: Assets from Jan 25 to Jan 30 (end: Jan 30)
      await createAlbum('album3', userId, 'Album 3');
      await createAsset('asset5', userId, DateTime(2024, 1, 25));
      await createAsset('asset6', userId, DateTime(2024, 1, 30));
      await linkAssetToAlbum('album3', 'asset5');
      await linkAssetToAlbum('album3', 'asset6');

      final result = await repository.getSortedAlbumIds([
        'album1',
        'album2',
        'album3',
      ], aggregation: AssetDateAggregation.end);

      // Expected order: album2 (Jan 15), album1 (Jan 20), album3 (Jan 30)
      expect(result, ['album2', 'album1', 'album3']);
    });

    test('handles albums with single asset', () async {
      const userId = 'user1';

      await createUser(userId, 'Test User');

      await createAlbum('album1', userId, 'Album 1');
      await createAsset('asset1', userId, DateTime(2024, 1, 15));
      await linkAssetToAlbum('album1', 'asset1');

      await createAlbum('album2', userId, 'Album 2');
      await createAsset('asset2', userId, DateTime(2024, 1, 10));
      await linkAssetToAlbum('album2', 'asset2');

      final result = await repository.getSortedAlbumIds(['album1', 'album2'], aggregation: AssetDateAggregation.start);

      expect(result, ['album2', 'album1']);
    });

    test('only returns requested album IDs in the result', () async {
      const userId = 'user1';

      await createUser(userId, 'Test User');

      // Create 3 albums
      await createAlbum('album1', userId, 'Album 1');
      await createAsset('asset1', userId, DateTime(2024, 1, 10));
      await linkAssetToAlbum('album1', 'asset1');

      await createAlbum('album2', userId, 'Album 2');
      await createAsset('asset2', userId, DateTime(2024, 1, 5));
      await linkAssetToAlbum('album2', 'asset2');

      await createAlbum('album3', userId, 'Album 3');
      await createAsset('asset3', userId, DateTime(2024, 1, 15));
      await linkAssetToAlbum('album3', 'asset3');

      // Only request album1 and album3
      final result = await repository.getSortedAlbumIds(['album1', 'album3'], aggregation: AssetDateAggregation.start);

      // Should only return album1 and album3, not album2
      expect(result, ['album1', 'album3']);
    });

    test('handles albums with same date correctly', () async {
      const userId = 'user1';

      await createUser(userId, 'Test User');

      final sameDate = DateTime(2024, 1, 10);

      await createAlbum('album1', userId, 'Album 1');
      await createAsset('asset1', userId, sameDate);
      await linkAssetToAlbum('album1', 'asset1');

      await createAlbum('album2', userId, 'Album 2');
      await createAsset('asset2', userId, sameDate);
      await linkAssetToAlbum('album2', 'asset2');

      final result = await repository.getSortedAlbumIds(['album1', 'album2'], aggregation: AssetDateAggregation.start);

      // Both albums have the same date, so both should be returned
      expect(result, hasLength(2));
      expect(result, containsAll(['album1', 'album2']));
    });

    test('handles albums across different years', () async {
      const userId = 'user1';

      await createUser(userId, 'Test User');

      await createAlbum('album1', userId, 'Album 1');
      await createAsset('asset1', userId, DateTime(2023, 12, 25));
      await linkAssetToAlbum('album1', 'asset1');

      await createAlbum('album2', userId, 'Album 2');
      await createAsset('asset2', userId, DateTime(2024, 1, 5));
      await linkAssetToAlbum('album2', 'asset2');

      await createAlbum('album3', userId, 'Album 3');
      await createAsset('asset3', userId, DateTime(2025, 1, 1));
      await linkAssetToAlbum('album3', 'asset3');

      final result = await repository.getSortedAlbumIds([
        'album1',
        'album2',
        'album3',
      ], aggregation: AssetDateAggregation.start);

      expect(result, ['album1', 'album2', 'album3']);
    });

    test('handles album with multiple assets correctly', () async {
      const userId = 'user1';

      await createUser(userId, 'Test User');

      await createAlbum('album1', userId, 'Album 1');
      // Album 1 has 5 assets from Jan 5 to Jan 25
      await createAsset('asset1', userId, DateTime(2024, 1, 5));
      await createAsset('asset2', userId, DateTime(2024, 1, 10));
      await createAsset('asset3', userId, DateTime(2024, 1, 15));
      await createAsset('asset4', userId, DateTime(2024, 1, 20));
      await createAsset('asset5', userId, DateTime(2024, 1, 25));
      await linkAssetToAlbum('album1', 'asset1');
      await linkAssetToAlbum('album1', 'asset2');
      await linkAssetToAlbum('album1', 'asset3');
      await linkAssetToAlbum('album1', 'asset4');
      await linkAssetToAlbum('album1', 'asset5');

      await createAlbum('album2', userId, 'Album 2');
      await createAsset('asset6', userId, DateTime(2024, 1, 1));
      await linkAssetToAlbum('album2', 'asset6');

      final resultStart = await repository.getSortedAlbumIds([
        'album1',
        'album2',
      ], aggregation: AssetDateAggregation.start);

      // album2 (Jan 1) should come before album1 (Jan 5)
      expect(resultStart, ['album2', 'album1']);

      final resultEnd = await repository.getSortedAlbumIds(['album1', 'album2'], aggregation: AssetDateAggregation.end);

      // album2 (Jan 1) should come before album1 (Jan 25)
      expect(resultEnd, ['album2', 'album1']);
    });
  });
}
