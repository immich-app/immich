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
    sut = RemoteAlbumService(mockRemoteAlbumRepo, mockAlbumApiRepo);

    when(
      () => mockRemoteAlbumRepo.getSortedAlbumIds(any(), aggregation: AssetDateAggregation.end),
    ).thenAnswer((_) async => ['1', '2']);

    when(
      () => mockRemoteAlbumRepo.getSortedAlbumIds(any(), aggregation: AssetDateAggregation.start),
    ).thenAnswer((_) async => ['1', '2']);
  });

  group('sortAlbums', () {
    test('should sort correctly based on newestAssetTimestamp', () async {
      final albums = [albumB, albumA];
      final result = await sut.sortAlbums(albums, AlbumSortMode.mostRecent);
      expect(result, [albumA, albumB]);
    });

    test('should sort correctly based on oldestAssetTimestamp', () async {
      final albums = [albumB, albumA];
      final result = await sut.sortAlbums(albums, AlbumSortMode.mostOldest);
      expect(result, [albumA, albumB]);
    });
  });
}
