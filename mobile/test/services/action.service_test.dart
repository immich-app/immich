import 'package:drift/drift.dart' as drift;
import 'package:drift/native.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/remote_deleted_local_asset.model.dart';
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

    when(() => localAssetRepository.getAssetsFromBackupAlbums(any())).thenAnswer((_) async => {});
    when(() => trashedLocalAssetRepository.trashLocalAssets(any())).thenAnswer((_) async {});
    when(() => trashSyncRepository.updateApproves(any(), any())).thenAnswer((_) async {});
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
    test('updates approvals and returns requested count when disallowed', () async {
      when(() => trashSyncRepository.updateApproves(any(), false)).thenAnswer((_) async {});

      final result = await sut.resolveRemoteTrash(['checksum-1'], isSyncApproved: false);

      expect(result, 1);
      verify(() => trashSyncRepository.updateApproves(any(), false)).called(1);
      verifyNever(() => localAssetRepository.getRemoteTrashedLocalAssets(any()));
      verifyNever(() => localFilesManagerRepository.moveToTrash(any()));
    });

    test('returns 0 when no local assets match', () async {
      when(() => localAssetRepository.getRemoteTrashedLocalAssets(any())).thenAnswer((_) async => []);
      when(() => trashSyncRepository.updateApproves(any(), true)).thenAnswer((_) async {});

      final result = await sut.resolveRemoteTrash(['checksum-1'], isSyncApproved: true);

      expect(result, 0);
      verify(() => localAssetRepository.getRemoteTrashedLocalAssets(any())).called(1);
      verify(() => trashSyncRepository.updateApproves(any(), true)).called(1);
      verifyNever(() => localFilesManagerRepository.moveToTrash(any()));
    });

    test('closes review when no local files are found', () async {
      final localAsset = LocalAssetStub.image1.copyWith(checksum: 'checksum-1');
      final remoteDeleted = RemoteDeletedLocalAsset(asset: localAsset, remoteDeletedAt: DateTime(2024, 1, 1));
      when(() => localAssetRepository.getRemoteTrashedLocalAssets(any())).thenAnswer((_) async => [remoteDeleted]);
      when(() => storageRepository.getMediaUrlForAsset(localAsset)).thenAnswer((_) async => null);
      when(() => trashSyncRepository.updateApproves(any(), true)).thenAnswer((_) async {});

      final result = await sut.resolveRemoteTrash(['checksum-1'], isSyncApproved: true);

      expect(result, 0);
      verify(() => trashSyncRepository.updateApproves(any(), true)).called(1);
      verifyNever(() => localFilesManagerRepository.moveToTrash(any()));
    });

    test('moves files to trash and updates approvals on success', () async {
      final localAsset = LocalAssetStub.image1.copyWith(checksum: 'checksum-1');
      final remoteDeleted = RemoteDeletedLocalAsset(asset: localAsset, remoteDeletedAt: DateTime(2024, 1, 1));
      when(() => localAssetRepository.getRemoteTrashedLocalAssets(any())).thenAnswer((_) async => [remoteDeleted]);
      when(() => storageRepository.getMediaUrlForAsset(localAsset)).thenAnswer((_) async => 'content://asset-1');
      when(() => localFilesManagerRepository.moveToTrash(any())).thenAnswer((_) async => true);
      when(() => trashSyncRepository.updateApproves(any(), true)).thenAnswer((_) async {});

      final result = await sut.resolveRemoteTrash(['checksum-1'], isSyncApproved: true);

      expect(result, 1);
      verify(() => localFilesManagerRepository.moveToTrash(['content://asset-1'])).called(1);
      verify(() => trashSyncRepository.updateApproves(any(), true)).called(1);
    });

    test('does not update approvals when move to trash fails', () async {
      final localAsset = LocalAssetStub.image1.copyWith(checksum: 'checksum-1');
      final remoteDeleted = RemoteDeletedLocalAsset(asset: localAsset, remoteDeletedAt: DateTime(2024, 1, 1));
      when(() => localAssetRepository.getRemoteTrashedLocalAssets(any())).thenAnswer((_) async => [remoteDeleted]);
      when(() => storageRepository.getMediaUrlForAsset(localAsset)).thenAnswer((_) async => 'content://asset-1');
      when(() => localFilesManagerRepository.moveToTrash(any())).thenAnswer((_) async => false);

      final result = await sut.resolveRemoteTrash(['checksum-1'], isSyncApproved: true);

      expect(result, 0);
      verify(() => localFilesManagerRepository.moveToTrash(['content://asset-1'])).called(1);
      verifyNever(() => trashSyncRepository.updateApproves(any(), true));
    });

    test('updates approvals and syncs trash even when no media urls are found', () async {
      final localAsset = LocalAssetStub.image1.copyWith(checksum: 'checksum-1', remoteId: 'remote-1');
      final remoteDeleted = RemoteDeletedLocalAsset(asset: localAsset, remoteDeletedAt: DateTime(2024, 1, 1));
      when(() => localAssetRepository.getRemoteTrashedLocalAssets(any())).thenAnswer((_) async => [remoteDeleted]);
      when(() => storageRepository.getMediaUrlForAsset(localAsset)).thenAnswer((_) async => null);

      final result = await sut.resolveRemoteTrash(['checksum-1'], isSyncApproved: true);

      expect(result, 0);
      verifyNever(() => localFilesManagerRepository.moveToTrash(any()));
      verify(() => trashSyncRepository.updateApproves(any(), true)).called(1);
      verify(() => localAssetRepository.getAssetsFromBackupAlbums(any())).called(1);
      verify(() => trashedLocalAssetRepository.trashLocalAssets(any())).called(1);
    });

    test('builds trashed assets map from remote deletion dates', () async {
      final asset1 = LocalAssetStub.image1.copyWith(checksum: 'checksum-1', remoteId: 'remote-1');
      final asset2 = LocalAssetStub.image1.copyWith(checksum: 'checksum-2', remoteId: 'remote-2');
      final deletedAt1 = DateTime(2024, 1, 1);
      final deletedAt2 = DateTime(2024, 2, 2);
      final remoteDeleted = [
        RemoteDeletedLocalAsset(asset: asset1, remoteDeletedAt: deletedAt1),
        RemoteDeletedLocalAsset(asset: asset2, remoteDeletedAt: deletedAt2),
      ];
      when(() => localAssetRepository.getRemoteTrashedLocalAssets(any())).thenAnswer((_) async => remoteDeleted);
      when(() => storageRepository.getMediaUrlForAsset(any())).thenAnswer((_) async => null);

      final result = await sut.resolveRemoteTrash(['checksum-1', 'checksum-2'], isSyncApproved: true);

      expect(result, 0);
      final captured =
          verify(() => localAssetRepository.getAssetsFromBackupAlbums(captureAny())).captured.single
              as Map<String, DateTime>;
      expect(captured, {'remote-1': deletedAt1, 'remote-2': deletedAt2});
    });
  });
}
