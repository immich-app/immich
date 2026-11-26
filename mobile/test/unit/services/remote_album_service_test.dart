import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/services/remote_album.service.dart';
import 'package:immich_mobile/providers/album/album_sort_by_options.provider.dart';
import 'package:mocktail/mocktail.dart';

import '../../service.mocks.dart';
import '../factories/remote_album_factory.dart';
import '../mocks.dart';

void main() {
  late RemoteAlbumService sut;
  final mocks = RepositoryMocks();

  setUpAll(() {
    registerFallbackValue(<String>[]);
  });

  setUp(() {
    sut = RemoteAlbumService(mocks.remoteAlbum, mocks.albumApi, MockForegroundUploadService());
  });

  tearDown(() {
    mocks.resetAll();
  });

  group('RemoteAlbumService', () {
    group('removeAssets', () {
      test('persists only the assets the server actually removed, not the whole request', () async {
        const albumId = 'album-1';
        const requested = ['asset-1', 'asset-2', 'asset-3'];
        const removed = ['asset-1', 'asset-3'];

        // The server rejected 'asset-2'
        when(
          () => mocks.albumApi.removeAssets(albumId, requested),
        ).thenAnswer((_) async => (removed: removed, failed: ['asset-2']));
        when(() => mocks.remoteAlbum.removeAssets(albumId, any())).thenAnswer((_) async {});

        final count = await sut.removeAssets(albumId: albumId, assetIds: requested);

        final persisted =
            verify(() => mocks.remoteAlbum.removeAssets(albumId, captureAny())).captured.single as List<String>;
        expect(persisted, removed);
        expect(persisted, isNot(contains('asset-2')));

        expect(count, removed.length);
      });
    });

    group('sortAlbums', () {
      test('intermixed pinned and unpinned albums group pinned first while preserving relative order', () async {
        final unpinnedOld = RemoteAlbumFactory.create(name: 'Unpinned Old', isPinned: false, createdAt: DateTime(2019));
        final pinnedOld = RemoteAlbumFactory.create(name: 'Pinned Old', isPinned: true, createdAt: DateTime(2020));
        final unpinnedNew = RemoteAlbumFactory.create(name: 'Unpinned New', isPinned: false, createdAt: DateTime(2023));
        final pinnedNew = RemoteAlbumFactory.create(name: 'Pinned New', isPinned: true, createdAt: DateTime(2024));

        final sorted = await sut.sortAlbums([unpinnedOld, pinnedOld, unpinnedNew, pinnedNew], AlbumSortMode.created);

        expect(sorted.map((a) => a.name), ['Pinned New', 'Pinned Old', 'Unpinned New', 'Unpinned Old']);
      });

      test('intermixed albums keep pinned grouping when the sort order is reversed', () async {
        final unpinnedOld = RemoteAlbumFactory.create(name: 'Unpinned Old', isPinned: false, createdAt: DateTime(2019));
        final pinnedOld = RemoteAlbumFactory.create(name: 'Pinned Old', isPinned: true, createdAt: DateTime(2020));
        final unpinnedNew = RemoteAlbumFactory.create(name: 'Unpinned New', isPinned: false, createdAt: DateTime(2023));
        final pinnedNew = RemoteAlbumFactory.create(name: 'Pinned New', isPinned: true, createdAt: DateTime(2024));

        final sorted = await sut.sortAlbums(
          [unpinnedOld, pinnedOld, unpinnedNew, pinnedNew],
          AlbumSortMode.created,
          isReverse: true,
        );

        expect(sorted.map((a) => a.name), ['Pinned Old', 'Pinned New', 'Unpinned Old', 'Unpinned New']);
      });
    });
  });
}
