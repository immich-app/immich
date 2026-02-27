import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/services/remote_album.service.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_album.repository.dart';
import 'package:immich_mobile/providers/album/album_sort_by_options.provider.dart';
import 'package:immich_mobile/repositories/drift_album_api_repository.dart';
import 'package:mocktail/mocktail.dart';

import '../../infrastructure/repository.mock.dart';

void main() {
  late RemoteAlbumService sut;
  late DriftRemoteAlbumRepository mockRemoteAlbumRepo;
  late DriftAlbumApiRepository mockAlbumApiRepo;

  final albumA = RemoteAlbum(
    id: '1',
    name: 'Album A',
    description: "",
    isActivityEnabled: false,
    order: AlbumAssetOrder.asc,
    assetCount: 1,
    createdAt: DateTime(2023, 1, 1),
    updatedAt: DateTime(2023, 1, 2),
    ownerId: 'owner1',
    ownerName: "Test User",
    isShared: false,
  );

  final albumB = RemoteAlbum(
    id: '2',
    name: 'Album B',
    description: "",
    isActivityEnabled: false,
    order: AlbumAssetOrder.desc,
    assetCount: 2,
    createdAt: DateTime(2023, 2, 1),
    updatedAt: DateTime(2023, 2, 2),
    ownerId: 'owner2',
    ownerName: "Test User",
    isShared: false,
  );

  setUp(() {
    mockRemoteAlbumRepo = MockRemoteAlbumRepository();
    mockAlbumApiRepo = MockDriftAlbumApiRepository();

    when(
      () => mockRemoteAlbumRepo.getSortedAlbumIds(any(), aggregation: AssetDateAggregation.end),
    ).thenAnswer((_) async => ['1', '2']);

    when(
      () => mockRemoteAlbumRepo.getSortedAlbumIds(any(), aggregation: AssetDateAggregation.start),
    ).thenAnswer((_) async => ['1', '2']);

    sut = RemoteAlbumService(mockRemoteAlbumRepo, mockAlbumApiRepo);
  });

  group('sortAlbums', () {
    test('should sort correctly based on name', () async {
      final albums = [albumB, albumA];

      final result = await sut.sortAlbums(albums, AlbumSortMode.title);
      expect(result, [albumA, albumB]);
    });

    test('should sort correctly based on createdAt', () async {
      final albums = [albumB, albumA];

      final result = await sut.sortAlbums(albums, AlbumSortMode.created);
      expect(result, [albumB, albumA]);
    });

    test('should sort correctly based on updatedAt', () async {
      final albums = [albumB, albumA];

      final result = await sut.sortAlbums(albums, AlbumSortMode.lastModified);
      expect(result, [albumB, albumA]);
    });

    test('should sort correctly based on assetCount', () async {
      final albums = [albumB, albumA];

      final result = await sut.sortAlbums(albums, AlbumSortMode.assetCount);
      expect(result, [albumB, albumA]);
    });

    test('should sort correctly based on newestAssetTimestamp', () async {
      final albums = [albumB, albumA];

      final result = await sut.sortAlbums(albums, AlbumSortMode.mostRecent);
      expect(result, [albumB, albumA]);
    });

    test('should sort correctly based on oldestAssetTimestamp', () async {
      final albums = [albumB, albumA];

      final result = await sut.sortAlbums(albums, AlbumSortMode.mostOldest);
      expect(result, [albumA, albumB]);
    });

    test('should flip order when isReverse is true for all modes', () async {
      final albums = [albumB, albumA];

      for (final mode in AlbumSortMode.values) {
        final normal = await sut.sortAlbums(albums, mode, isReverse: false);
        final reversed = await sut.sortAlbums(albums, mode, isReverse: true);

        // reversed should be the exact inverse of normal
        expect(reversed, normal.reversed.toList(), reason: 'Mode: $mode');
      }
    });
  });
}
