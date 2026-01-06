import 'package:flutter_test/flutter_test.dart';
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

  setUp(() {
    mockRemoteAlbumRepo = MockRemoteAlbumRepository();
    mockAlbumApiRepo = MockDriftAlbumApiRepository();
    sut = RemoteAlbumService(mockRemoteAlbumRepo, mockAlbumApiRepo);

    when(() => mockRemoteAlbumRepo.getNewestAssetTimestamp(any())).thenAnswer((invocation) {
      // Simulate a timestamp for the newest asset in the album
      final albumID = invocation.positionalArguments[0] as String;

      if (albumID == '1') {
        return Future.value(DateTime(2023, 1, 1));
      } else if (albumID == '2') {
        return Future.value(DateTime(2023, 2, 1));
      }

      return Future.value(DateTime.fromMillisecondsSinceEpoch(0));
    });

    when(() => mockRemoteAlbumRepo.getOldestAssetTimestamp(any())).thenAnswer((invocation) {
      // Simulate a timestamp for the oldest asset in the album
      final albumID = invocation.positionalArguments[0] as String;

      if (albumID == '1') {
        return Future.value(DateTime(2019, 1, 1));
      } else if (albumID == '2') {
        return Future.value(DateTime(2019, 2, 1));
      }

      return Future.value(DateTime.fromMillisecondsSinceEpoch(0));
    });
  });

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

  group('sortAlbums', () {
    test('should sort correctly based on name', () async {
      final albums = [albumB, albumA];

      final result = await sut.sortAlbums(albums, AlbumSortMode.title);
      expect(result, [albumA, albumB]);
    });

    test('should sort correctly based on createdAt', () async {
      final albums = [albumB, albumA];

      final result = await sut.sortAlbums(albums, AlbumSortMode.created);
      expect(result, [albumA, albumB]);
    });

    test('should sort correctly based on updatedAt', () async {
      final albums = [albumB, albumA];

      final result = await sut.sortAlbums(albums, AlbumSortMode.lastModified);
      expect(result, [albumA, albumB]);
    });

    test('should sort correctly based on assetCount', () async {
      final albums = [albumB, albumA];

      final result = await sut.sortAlbums(albums, AlbumSortMode.assetCount);
      expect(result, [albumA, albumB]);
    });

    test('should sort correctly based on newestAssetTimestamp', () async {
      final albums = [albumB, albumA];

      final result = await sut.sortAlbums(albums, AlbumSortMode.mostRecent);
      expect(result, [albumA, albumB]);
    });

    test('should sort correctly based on oldestAssetTimestamp', () async {
      final albums = [albumB, albumA];

      final result = await sut.sortAlbums(albums, AlbumSortMode.mostOldest);
      expect(result, [albumB, albumA]);
    });
  });
}
