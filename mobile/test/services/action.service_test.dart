import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/repositories/download.repository.dart';
import 'package:immich_mobile/services/action.service.dart';
import 'package:logging/logging.dart';
import 'package:mocktail/mocktail.dart';

import '../fixtures/asset.stub.dart';
import '../infrastructure/repository.mock.dart';
import '../mocks/asset_entity.mock.dart';
import '../repository.mocks.dart';

class MockDownloadRepository extends Mock implements DownloadRepository {}

void main() {
  late ActionService sut;
  late MockAssetApiRepository mockAssetApiRepo;
  late MockRemoteAssetRepository mockRemoteAssetRepo;
  late MockLocalAssetRepository mockLocalAssetRepo;
  late MockDriftAlbumApiRepository mockAlbumApiRepo;
  late MockRemoteAlbumRepository mockRemoteAlbumRepo;
  late MockTrashSyncRepository mockTrashSyncRepo;
  late MockAssetMediaRepository mockAssetMediaRepo;
  late MockDownloadRepository mockDownloadRepo;
  late MockStorageRepository mockStorageRepo;
  late MockLocalFilesManagerRepository mockLocalFilesManagerRepo;

  setUpAll(() {
    registerFallbackValue(LocalAssetStub.image1);
  });

  setUp(() {
    mockAssetApiRepo = MockAssetApiRepository();
    mockRemoteAssetRepo = MockRemoteAssetRepository();
    mockLocalAssetRepo = MockLocalAssetRepository();
    mockAlbumApiRepo = MockDriftAlbumApiRepository();
    mockRemoteAlbumRepo = MockRemoteAlbumRepository();
    mockTrashSyncRepo = MockTrashSyncRepository();
    mockAssetMediaRepo = MockAssetMediaRepository();
    mockDownloadRepo = MockDownloadRepository();
    mockStorageRepo = MockStorageRepository();
    mockLocalFilesManagerRepo = MockLocalFilesManagerRepository();

    sut = ActionService(
      mockAssetApiRepo,
      mockRemoteAssetRepo,
      mockLocalAssetRepo,
      mockAlbumApiRepo,
      mockRemoteAlbumRepo,
      mockTrashSyncRepo,
      mockAssetMediaRepo,
      mockDownloadRepo,
      mockStorageRepo,
      mockLocalFilesManagerRepo,
      Logger('ActionServiceTest'),
    );
  });

  group('ActionService.resolveRemoteTrash', () {
    test('updates approvals and returns true when disallowed', () async {
      when(() => mockTrashSyncRepo.updateApproves(any(), false)).thenAnswer((_) async {});

      final result = await sut.resolveRemoteTrash(['checksum-1'], allow: false);

      expect(result, isTrue);
      verify(() => mockTrashSyncRepo.updateApproves(any(), false)).called(1);
      verifyNever(() => mockLocalAssetRepo.getByChecksums(any()));
      verifyNever(() => mockLocalFilesManagerRepo.moveToTrash(any()));
    });

    test('returns false when no local assets match', () async {
      when(() => mockLocalAssetRepo.getByChecksums(any())).thenAnswer((_) async => []);

      final result = await sut.resolveRemoteTrash(['checksum-1'], allow: true);

      expect(result, isFalse);
      verify(() => mockLocalAssetRepo.getByChecksums(any())).called(1);
      verifyNever(() => mockTrashSyncRepo.updateApproves(any(), true));
      verifyNever(() => mockLocalFilesManagerRepo.moveToTrash(any()));
    });

    test('closes review when no local files are found', () async {
      final localAsset = LocalAssetStub.image1.copyWith(checksum: 'checksum-1');
      when(() => mockLocalAssetRepo.getByChecksums(any())).thenAnswer((_) async => [localAsset]);
      when(() => mockStorageRepo.getAssetEntityForAsset(localAsset)).thenAnswer((_) async => null);
      when(() => mockTrashSyncRepo.updateApproves(any(), true)).thenAnswer((_) async {});

      final result = await sut.resolveRemoteTrash(['checksum-1'], allow: true);

      expect(result, isTrue);
      verify(() => mockTrashSyncRepo.updateApproves(any(), true)).called(1);
      verifyNever(() => mockLocalFilesManagerRepo.moveToTrash(any()));
    });

    test('moves files to trash and updates approvals on success', () async {
      final localAsset = LocalAssetStub.image1.copyWith(checksum: 'checksum-1');
      final entity = MockAssetEntity();
      when(() => mockLocalAssetRepo.getByChecksums(any())).thenAnswer((_) async => [localAsset]);
      when(() => mockStorageRepo.getAssetEntityForAsset(localAsset)).thenAnswer((_) async => entity);
      when(() => entity.getMediaUrl()).thenAnswer((_) async => 'content://asset-1');
      when(() => mockLocalFilesManagerRepo.moveToTrash(any())).thenAnswer((_) async => true);
      when(() => mockTrashSyncRepo.updateApproves(any(), true)).thenAnswer((_) async {});

      final result = await sut.resolveRemoteTrash(['checksum-1'], allow: true);

      expect(result, isTrue);
      verify(() => mockLocalFilesManagerRepo.moveToTrash(['content://asset-1'])).called(1);
      verify(() => mockTrashSyncRepo.updateApproves(any(), true)).called(1);
    });

    test('does not update approvals when move to trash fails', () async {
      final localAsset = LocalAssetStub.image1.copyWith(checksum: 'checksum-1');
      final entity = MockAssetEntity();
      when(() => mockLocalAssetRepo.getByChecksums(any())).thenAnswer((_) async => [localAsset]);
      when(() => mockStorageRepo.getAssetEntityForAsset(localAsset)).thenAnswer((_) async => entity);
      when(() => entity.getMediaUrl()).thenAnswer((_) async => 'content://asset-1');
      when(() => mockLocalFilesManagerRepo.moveToTrash(any())).thenAnswer((_) async => false);

      final result = await sut.resolveRemoteTrash(['checksum-1'], allow: true);

      expect(result, isFalse);
      verify(() => mockLocalFilesManagerRepo.moveToTrash(['content://asset-1'])).called(1);
      verifyNever(() => mockTrashSyncRepo.updateApproves(any(), true));
    });
  });
}
