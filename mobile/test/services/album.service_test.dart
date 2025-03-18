import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/entities/backup_album.entity.dart';
import 'package:immich_mobile/services/album.service.dart';
import 'package:mocktail/mocktail.dart';

import '../domain/service.mock.dart';
import '../fixtures/album.stub.dart';
import '../fixtures/asset.stub.dart';
import '../fixtures/user.stub.dart';
import '../repository.mocks.dart';
import '../service.mocks.dart';

void main() {
  late AlbumService sut;
  late MockUserService userService;
  late MockSyncService syncService;
  late MockEntityService entityService;
  late MockAlbumRepository albumRepository;
  late MockAssetRepository assetRepository;
  late MockBackupRepository backupRepository;
  late MockAlbumMediaRepository albumMediaRepository;
  late MockAlbumApiRepository albumApiRepository;

  setUp(() {
    userService = MockUserService();
    syncService = MockSyncService();
    entityService = MockEntityService();
    albumRepository = MockAlbumRepository();
    assetRepository = MockAssetRepository();
    backupRepository = MockBackupRepository();
    albumMediaRepository = MockAlbumMediaRepository();
    albumApiRepository = MockAlbumApiRepository();

    when(() => userService.getMyUser()).thenReturn(UserStub.user1);

    when(() => albumRepository.transaction<void>(any())).thenAnswer(
      (call) => (call.positionalArguments.first as Function).call(),
    );
    when(() => assetRepository.transaction<Null>(any())).thenAnswer(
      (call) => (call.positionalArguments.first as Function).call(),
    );

    sut = AlbumService(
      syncService,
      userService,
      entityService,
      albumRepository,
      assetRepository,
      backupRepository,
      albumMediaRepository,
      albumApiRepository,
    );
  });

  group('refreshDeviceAlbums', () {
    test('empty selection with one album in db', () async {
      when(() => backupRepository.getIdsBySelection(BackupSelection.exclude))
          .thenAnswer((_) async => []);
      when(() => backupRepository.getIdsBySelection(BackupSelection.select))
          .thenAnswer((_) async => []);
      when(() => albumMediaRepository.getAll()).thenAnswer((_) async => []);
      when(() => albumRepository.count(local: true)).thenAnswer((_) async => 1);
      when(() => syncService.removeAllLocalAlbumsAndAssets())
          .thenAnswer((_) async => true);
      final result = await sut.refreshDeviceAlbums();
      expect(result, false);
      verify(() => syncService.removeAllLocalAlbumsAndAssets());
    });

    test('one selected albums, two on device', () async {
      when(() => backupRepository.getIdsBySelection(BackupSelection.exclude))
          .thenAnswer((_) async => []);
      when(() => backupRepository.getIdsBySelection(BackupSelection.select))
          .thenAnswer((_) async => [AlbumStub.oneAsset.localId!]);
      when(() => albumMediaRepository.getAll())
          .thenAnswer((_) async => [AlbumStub.oneAsset, AlbumStub.twoAsset]);
      when(() => syncService.syncLocalAlbumAssetsToDb(any(), any()))
          .thenAnswer((_) async => true);
      final result = await sut.refreshDeviceAlbums();
      expect(result, true);
      verify(
        () => syncService.syncLocalAlbumAssetsToDb([AlbumStub.oneAsset], null),
      ).called(1);
      verifyNoMoreInteractions(syncService);
    });
  });

  group('refreshRemoteAlbums', () {
    test('is working', () async {
      when(() => syncService.getUsersFromServer()).thenAnswer((_) async => []);
      when(() => syncService.syncUsersFromServer(any()))
          .thenAnswer((_) async => true);
      when(() => albumApiRepository.getAll(shared: true))
          .thenAnswer((_) async => [AlbumStub.sharedWithUser]);

      when(() => albumApiRepository.getAll(shared: null))
          .thenAnswer((_) async => [AlbumStub.oneAsset, AlbumStub.twoAsset]);

      when(
        () => syncService.syncRemoteAlbumsToDb([
          AlbumStub.twoAsset,
          AlbumStub.oneAsset,
          AlbumStub.sharedWithUser,
        ]),
      ).thenAnswer((_) async => true);
      final result = await sut.refreshRemoteAlbums();
      expect(result, true);
      verify(() => syncService.getUsersFromServer()).called(1);
      verify(() => syncService.syncUsersFromServer([])).called(1);
      verify(() => albumApiRepository.getAll(shared: true)).called(1);
      verify(() => albumApiRepository.getAll(shared: null)).called(1);
      verify(
        () => syncService.syncRemoteAlbumsToDb(
          [
            AlbumStub.twoAsset,
            AlbumStub.oneAsset,
            AlbumStub.sharedWithUser,
          ],
        ),
      ).called(1);
      verifyNoMoreInteractions(userService);
      verifyNoMoreInteractions(albumApiRepository);
      verifyNoMoreInteractions(syncService);
    });
  });

  group('createAlbum', () {
    test('shared with assets', () async {
      when(
        () => albumApiRepository.create(
          "name",
          assetIds: any(named: "assetIds"),
          sharedUserIds: any(named: "sharedUserIds"),
        ),
      ).thenAnswer((_) async => AlbumStub.oneAsset);

      when(
        () => entityService.fillAlbumWithDatabaseEntities(AlbumStub.oneAsset),
      ).thenAnswer((_) async => AlbumStub.oneAsset);

      when(
        () => albumRepository.create(AlbumStub.oneAsset),
      ).thenAnswer((_) async => AlbumStub.twoAsset);

      final result =
          await sut.createAlbum("name", [AssetStub.image1], [UserStub.user1]);
      expect(result, AlbumStub.twoAsset);
      verify(
        () => albumApiRepository.create(
          "name",
          assetIds: [AssetStub.image1.remoteId!],
          sharedUserIds: [UserStub.user1.uid],
        ),
      ).called(1);
      verify(
        () => entityService.fillAlbumWithDatabaseEntities(AlbumStub.oneAsset),
      ).called(1);
    });
  });

  group('addAdditionalAssetToAlbum', () {
    test('one added, one duplicate', () async {
      when(
        () => albumApiRepository.addAssets(AlbumStub.oneAsset.remoteId!, any()),
      ).thenAnswer(
        (_) async => (
          added: [AssetStub.image2.remoteId!],
          duplicates: [AssetStub.image1.remoteId!]
        ),
      );
      when(
        () => albumRepository.get(AlbumStub.oneAsset.id),
      ).thenAnswer((_) async => AlbumStub.oneAsset);
      when(
        () => albumRepository.addAssets(AlbumStub.oneAsset, [AssetStub.image2]),
      ).thenAnswer((_) async {});
      when(
        () => albumRepository.removeAssets(AlbumStub.oneAsset, []),
      ).thenAnswer((_) async {});
      when(
        () => albumRepository.recalculateMetadata(AlbumStub.oneAsset),
      ).thenAnswer((_) async => AlbumStub.oneAsset);
      when(
        () => albumRepository.update(AlbumStub.oneAsset),
      ).thenAnswer((_) async => AlbumStub.oneAsset);

      final result = await sut.addAssets(
        AlbumStub.oneAsset,
        [AssetStub.image1, AssetStub.image2],
      );

      expect(result != null, true);
      expect(result!.alreadyInAlbum, [AssetStub.image1.remoteId!]);
      expect(result.successfullyAdded, 1);
    });
  });

  group('addAdditionalUserToAlbum', () {
    test('one added', () async {
      when(
        () =>
            albumApiRepository.addUsers(AlbumStub.emptyAlbum.remoteId!, any()),
      ).thenAnswer(
        (_) async => AlbumStub.sharedWithUser,
      );

      when(
        () => albumRepository.addUsers(
          AlbumStub.emptyAlbum,
          AlbumStub.emptyAlbum.sharedUsers.map((u) => u.toDto()).toList(),
        ),
      ).thenAnswer((_) async => AlbumStub.emptyAlbum);

      when(
        () => albumRepository.update(AlbumStub.emptyAlbum),
      ).thenAnswer((_) async => AlbumStub.emptyAlbum);

      final result = await sut.addUsers(
        AlbumStub.emptyAlbum,
        [UserStub.user2.uid],
      );

      expect(result, true);
    });
  });
}
