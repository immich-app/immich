import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/entities/backup_album.entity.dart';
import 'package:immich_mobile/services/album.service.dart';
import 'package:mocktail/mocktail.dart';
import '../repository.mocks.dart';
import '../service.mocks.dart';

void main() {
  late AlbumService sut;
  late MockApiService apiService;
  late MockUserService userService;
  late MockSyncService syncService;
  late MockAlbumRepository albumRepository;
  late MockAssetRepository assetRepository;
  late MockUserRepository userRepository;
  late MockBackupRepository backupRepository;

  setUp(() {
    apiService = MockApiService();
    userService = MockUserService();
    syncService = MockSyncService();
    albumRepository = MockAlbumRepository();
    assetRepository = MockAssetRepository();
    userRepository = MockUserRepository();
    backupRepository = MockBackupRepository();

    sut = AlbumService(
      apiService,
      userService,
      syncService,
      albumRepository,
      assetRepository,
      userRepository,
      backupRepository,
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
  });
}
