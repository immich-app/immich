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
      test('pinned albums float to the top regardless of sort mode', () async {
        final pinnedOld = RemoteAlbumFactory.create(name: 'Pinned Old', isPinned: true, createdAt: DateTime(2020));
        final pinnedNew = RemoteAlbumFactory.create(name: 'Pinned New', isPinned: true, createdAt: DateTime(2024));
        final regular = RemoteAlbumFactory.create(name: 'Regular', isPinned: false, createdAt: DateTime(2022));

        final sorted = await sut.sortAlbums([regular, pinnedOld, pinnedNew], AlbumSortMode.created);

        // Pinned albums come first, sorted among themselves by the active sort mode
        expect(sorted.take(2).map((a) => a.name), ['Pinned Old', 'Pinned New']);
        expect(sorted.last.name, 'Regular');
      });

      test('non-pinned albums keep their normal sorted order below pinned ones', () async {
        final pinned = RemoteAlbumFactory.create(name: 'Pinned', isPinned: true, createdAt: DateTime(2021));
        final older = RemoteAlbumFactory.create(name: 'Older', isPinned: false, createdAt: DateTime(2020));
        final newer = RemoteAlbumFactory.create(name: 'Newer', isPinned: false, createdAt: DateTime(2023));

        final sorted = await sut.sortAlbums([older, pinned, newer], AlbumSortMode.created);

        expect(sorted.first.name, 'Pinned');
        expect(sorted.skip(1).map((a) => a.name), ['Older', 'Newer']);
      });
    });
  });
}
