import 'package:drift/drift.dart' as drift;
import 'package:drift/native.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
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

  late MockAssetApiRepository assetApiRepository;
  late MockRemoteAssetRepository remoteAssetRepository;
  late MockDriftLocalAssetRepository localAssetRepository;
  late MockDriftAlbumApiRepository albumApiRepository;
  late MockRemoteAlbumRepository remoteAlbumRepository;
  late MockTrashedLocalAssetRepository trashedLocalAssetRepository;
  late MockTrashSyncRepository trashSyncRepository;
  late MockAssetMediaRepository assetMediaRepository;
  late MockDownloadRepository downloadRepository;
  late MockStorageRepository storageRepository;
  late MockLocalFilesManagerRepository localFilesManagerRepository;

  late Drift db;

  setUpAll(() async {
    registerFallbackValue(LocalAssetStub.image1);
    TestWidgetsFlutterBinding.ensureInitialized();
    debugDefaultTargetPlatformOverride = TargetPlatform.android;

    db = Drift(drift.DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: DriftStoreRepository(db));
  });

  tearDownAll(() async {
    debugDefaultTargetPlatformOverride = null;
    await Store.clear();
    await db.close();
  });

  setUp(() {
    assetApiRepository = MockAssetApiRepository();
    remoteAssetRepository = MockRemoteAssetRepository();
    localAssetRepository = MockDriftLocalAssetRepository();
    albumApiRepository = MockDriftAlbumApiRepository();
    remoteAlbumRepository = MockRemoteAlbumRepository();
    trashedLocalAssetRepository = MockTrashedLocalAssetRepository();
    trashSyncRepository = MockTrashSyncRepository();
    assetMediaRepository = MockAssetMediaRepository();
    downloadRepository = MockDownloadRepository();
    storageRepository = MockStorageRepository();
    localFilesManagerRepository = MockLocalFilesManagerRepository();

    sut = ActionService(
      assetApiRepository,
      remoteAssetRepository,
      localAssetRepository,
      albumApiRepository,
      remoteAlbumRepository,
      trashedLocalAssetRepository,
      trashSyncRepository,
      assetMediaRepository,
      downloadRepository,
      storageRepository,
      localFilesManagerRepository,
      Logger('ActionServiceTest'),
    );
  });

  tearDown(() async {
    await Store.clear();
  });

  group('ActionService.deleteLocal', () {
    test('routes deleted ids to trashed repository when Android trash handling is enabled', () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, true);
      const ids = ['a', 'b'];

      when(() => assetMediaRepository.deleteAll(ids)).thenAnswer((_) async => ids);
      when(() => trashedLocalAssetRepository.applyTrashedAssets(ids)).thenAnswer((_) async {});

      final result = await sut.deleteLocal(ids);

      expect(result, ids.length);
      verify(() => assetMediaRepository.deleteAll(ids)).called(1);
      verify(() => trashedLocalAssetRepository.applyTrashedAssets(ids)).called(1);
      verifyNever(() => localAssetRepository.delete(any()));
    });

    test('deletes locally when Android trash handling is disabled', () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, false);
      const ids = ['c'];

      when(() => assetMediaRepository.deleteAll(ids)).thenAnswer((_) async => ids);
      when(() => localAssetRepository.delete(ids)).thenAnswer((_) async {});

      final result = await sut.deleteLocal(ids);

      expect(result, ids.length);
      verify(() => assetMediaRepository.deleteAll(ids)).called(1);
      verify(() => localAssetRepository.delete(ids)).called(1);
      verifyNever(() => trashedLocalAssetRepository.applyTrashedAssets(any()));
    });

    test('short-circuits when nothing was deleted', () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, true);
      const ids = ['x'];

      when(() => assetMediaRepository.deleteAll(ids)).thenAnswer((_) async => <String>[]);

      final result = await sut.deleteLocal(ids);

      expect(result, 0);
      verify(() => assetMediaRepository.deleteAll(ids)).called(1);
      verifyNever(() => trashedLocalAssetRepository.applyTrashedAssets(any()));
      verifyNever(() => localAssetRepository.delete(any()));
    });
  });

  group('ActionService.resolveRemoteTrash', () {
    test('updates approvals and returns true when disallowed', () async {
      when(() => trashSyncRepository.updateApproves(any(), false)).thenAnswer((_) async {});

      final result = await sut.resolveRemoteTrash(['checksum-1'], isSyncApproved: false);

      expect(result, isTrue);
      verify(() => trashSyncRepository.updateApproves(any(), false)).called(1);
      verifyNever(() => localAssetRepository.getByChecksums(any()));
      verifyNever(() => localFilesManagerRepository.moveToTrash(any()));
    });

    test('returns false when no local assets match', () async {
      when(() => localAssetRepository.getByChecksums(any())).thenAnswer((_) async => []);

      final result = await sut.resolveRemoteTrash(['checksum-1'], isSyncApproved: true);

      expect(result, isFalse);
      verify(() => localAssetRepository.getByChecksums(any())).called(1);
      verifyNever(() => trashSyncRepository.updateApproves(any(), true));
      verifyNever(() => localFilesManagerRepository.moveToTrash(any()));
    });

    test('closes review when no local files are found', () async {
      final localAsset = LocalAssetStub.image1.copyWith(checksum: 'checksum-1');
      when(() => localAssetRepository.getByChecksums(any())).thenAnswer((_) async => [localAsset]);
      when(() => storageRepository.getAssetEntityForAsset(localAsset)).thenAnswer((_) async => null);
      when(() => trashSyncRepository.updateApproves(any(), true)).thenAnswer((_) async {});

      final result = await sut.resolveRemoteTrash(['checksum-1'], isSyncApproved: true);

      expect(result, isTrue);
      verify(() => trashSyncRepository.updateApproves(any(), true)).called(1);
      verifyNever(() => localFilesManagerRepository.moveToTrash(any()));
    });

    test('moves files to trash and updates approvals on success', () async {
      final localAsset = LocalAssetStub.image1.copyWith(checksum: 'checksum-1');
      final entity = MockAssetEntity();
      when(() => localAssetRepository.getByChecksums(any())).thenAnswer((_) async => [localAsset]);
      when(() => storageRepository.getAssetEntityForAsset(localAsset)).thenAnswer((_) async => entity);
      when(() => entity.getMediaUrl()).thenAnswer((_) async => 'content://asset-1');
      when(() => localFilesManagerRepository.moveToTrash(any())).thenAnswer((_) async => true);
      when(() => trashSyncRepository.updateApproves(any(), true)).thenAnswer((_) async {});

      final result = await sut.resolveRemoteTrash(['checksum-1'], isSyncApproved: true);

      expect(result, isTrue);
      verify(() => localFilesManagerRepository.moveToTrash(['content://asset-1'])).called(1);
      verify(() => trashSyncRepository.updateApproves(any(), true)).called(1);
    });

    test('does not update approvals when move to trash fails', () async {
      final localAsset = LocalAssetStub.image1.copyWith(checksum: 'checksum-1');
      final entity = MockAssetEntity();
      when(() => localAssetRepository.getByChecksums(any())).thenAnswer((_) async => [localAsset]);
      when(() => storageRepository.getAssetEntityForAsset(localAsset)).thenAnswer((_) async => entity);
      when(() => entity.getMediaUrl()).thenAnswer((_) async => 'content://asset-1');
      when(() => localFilesManagerRepository.moveToTrash(any())).thenAnswer((_) async => false);

      final result = await sut.resolveRemoteTrash(['checksum-1'], isSyncApproved: true);

      expect(result, isFalse);
      verify(() => localFilesManagerRepository.moveToTrash(['content://asset-1'])).called(1);
      verifyNever(() => trashSyncRepository.updateApproves(any(), true));
    });
  });
}
