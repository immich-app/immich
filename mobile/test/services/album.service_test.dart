import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/entities/backup_album.entity.dart';
import 'package:immich_mobile/services/album.service.dart';
import 'package:mocktail/mocktail.dart';
import '../fixtures/album.stub.dart';
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

    sut = AlbumService(
      userService,
      syncService,
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
}
