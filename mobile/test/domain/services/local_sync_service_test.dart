import 'package:drift/drift.dart' as drift;
import 'package:drift/native.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/local_sync.service.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trashed_local_asset.repository.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/repositories/local_files_manager.repository.dart';
import 'package:mocktail/mocktail.dart';

import '../../domain/service.mock.dart';
import '../../fixtures/asset.stub.dart';
import '../../infrastructure/repository.mock.dart';
import '../../mocks/asset_entity.mock.dart';
import '../../repository.mocks.dart';

void main() {
  late LocalSyncService sut;
  late DriftLocalAlbumRepository mockLocalAlbumRepository;
  late DriftTrashedLocalAssetRepository mockTrashedLocalAssetRepository;
  late LocalFilesManagerRepository mockLocalFilesManager;
  late StorageRepository mockStorageRepository;
  late MockNativeSyncApi mockNativeSyncApi;
  late Drift db;

  setUpAll(() async {
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

  setUp(() async {
    mockLocalAlbumRepository = MockLocalAlbumRepository();
    mockTrashedLocalAssetRepository = MockTrashedLocalAssetRepository();
    mockLocalFilesManager = MockLocalFilesManagerRepository();
    mockStorageRepository = MockStorageRepository();
    mockNativeSyncApi = MockNativeSyncApi();

    when(() => mockNativeSyncApi.shouldFullSync()).thenAnswer((_) async => false);
    when(() => mockNativeSyncApi.getMediaChanges()).thenAnswer(
      (_) async => SyncDelta(hasChanges: false, updates: const [], deletes: const [], assetAlbums: const {}),
    );
    when(() => mockNativeSyncApi.getTrashedAssets()).thenAnswer((_) async => {});
    when(() => mockTrashedLocalAssetRepository.processTrashSnapshot(any())).thenAnswer((_) async {});
    when(() => mockTrashedLocalAssetRepository.getToRestore()).thenAnswer((_) async => []);
    when(() => mockTrashedLocalAssetRepository.getToTrash()).thenAnswer((_) async => {});
    when(() => mockTrashedLocalAssetRepository.applyRestoredAssets(any())).thenAnswer((_) async {});
    when(() => mockTrashedLocalAssetRepository.trashLocalAsset(any())).thenAnswer((_) async {});
    when(() => mockLocalFilesManager.moveToTrash(any<List<String>>())).thenAnswer((_) async => true);

    sut = LocalSyncService(
      localAlbumRepository: mockLocalAlbumRepository,
      trashedLocalAssetRepository: mockTrashedLocalAssetRepository,
      localFilesManager: mockLocalFilesManager,
      storageRepository: mockStorageRepository,
      nativeSyncApi: mockNativeSyncApi,
    );

    await Store.put(StoreKey.manageLocalMediaAndroid, false);
    when(() => mockLocalFilesManager.hasManageMediaPermission()).thenAnswer((_) async => false);
  });

  group('LocalSyncService - syncTrashedAssets gating', () {
    test('invokes syncTrashedAssets when Android flag enabled and permission granted', () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, true);
      when(() => mockLocalFilesManager.hasManageMediaPermission()).thenAnswer((_) async => true);

      await sut.sync();

      verify(() => mockNativeSyncApi.getTrashedAssets()).called(1);
      verify(() => mockTrashedLocalAssetRepository.processTrashSnapshot(any())).called(1);
    });

    test('skips syncTrashedAssets when store flag disabled', () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, false);
      when(() => mockLocalFilesManager.hasManageMediaPermission()).thenAnswer((_) async => true);

      await sut.sync();

      verifyNever(() => mockNativeSyncApi.getTrashedAssets());
    });

    test('skips syncTrashedAssets when MANAGE_MEDIA permission absent', () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, true);
      when(() => mockLocalFilesManager.hasManageMediaPermission()).thenAnswer((_) async => false);

      await sut.sync();

      verifyNever(() => mockNativeSyncApi.getTrashedAssets());
    });

    test('skips syncTrashedAssets on non-Android platforms', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = TargetPlatform.android);

      await Store.put(StoreKey.manageLocalMediaAndroid, true);
      when(() => mockLocalFilesManager.hasManageMediaPermission()).thenAnswer((_) async => true);

      await sut.sync();

      verifyNever(() => mockNativeSyncApi.getTrashedAssets());
    });
  });

  group('LocalSyncService - syncTrashedAssets behavior', () {
    test('processes trashed snapshot, restores assets, and trashes local files', () async {
      final platformAsset = PlatformAsset(
        id: 'remote-id',
        name: 'remote.jpg',
        type: AssetType.image.index,
        durationInSeconds: 0,
        orientation: 0,
        isFavorite: false,
      );

      final assetsToRestore = [LocalAssetStub.image1];
      when(() => mockTrashedLocalAssetRepository.getToRestore()).thenAnswer((_) async => assetsToRestore);
      final restoredIds = ['image1'];
      when(() => mockLocalFilesManager.restoreAssetsFromTrash(any())).thenAnswer((invocation) async {
        final Iterable<LocalAsset> requested = invocation.positionalArguments.first as Iterable<LocalAsset>;
        expect(requested, orderedEquals(assetsToRestore));
        return restoredIds;
      });

      final localAssetToTrash = LocalAssetStub.image2.copyWith(id: 'local-trash', checksum: 'checksum-trash');
      when(() => mockTrashedLocalAssetRepository.getToTrash()).thenAnswer(
        (_) async => {
          'album-a': [localAssetToTrash],
        },
      );

      final assetEntity = MockAssetEntity();
      when(() => assetEntity.getMediaUrl()).thenAnswer((_) async => 'content://local-trash');
      when(() => mockStorageRepository.getAssetEntityForAsset(localAssetToTrash)).thenAnswer((_) async => assetEntity);

      await sut.processTrashedAssets({
        'album-a': [platformAsset],
      });

      verify(() => mockTrashedLocalAssetRepository.processTrashSnapshot(any())).called(1);
      verify(() => mockTrashedLocalAssetRepository.getToTrash()).called(1);

      verify(() => mockLocalFilesManager.restoreAssetsFromTrash(any())).called(1);
      verify(() => mockTrashedLocalAssetRepository.applyRestoredAssets(restoredIds)).called(1);

      verify(() => mockStorageRepository.getAssetEntityForAsset(localAssetToTrash)).called(1);
      final moveArgs = verify(() => mockLocalFilesManager.moveToTrash(captureAny())).captured.single as List<String>;
      expect(moveArgs, ['content://local-trash']);
      final trashArgs =
          verify(() => mockTrashedLocalAssetRepository.trashLocalAsset(captureAny())).captured.single
              as Map<String, List<LocalAsset>>;
      expect(trashArgs.keys, ['album-a']);
      expect(trashArgs['album-a'], [localAssetToTrash]);
    });

    test('does not attempt restore when repository has no assets to restore', () async {
      when(() => mockTrashedLocalAssetRepository.getToRestore()).thenAnswer((_) async => []);

      await sut.processTrashedAssets({});

      verifyNever(() => mockLocalFilesManager.restoreAssetsFromTrash(any()));
      verifyNever(() => mockTrashedLocalAssetRepository.applyRestoredAssets(any()));
    });

    test('does not move local assets when repository finds nothing to trash', () async {
      when(() => mockTrashedLocalAssetRepository.getToTrash()).thenAnswer((_) async => {});

      await sut.processTrashedAssets({});

      verifyNever(() => mockLocalFilesManager.moveToTrash(any()));
      verifyNever(() => mockTrashedLocalAssetRepository.trashLocalAsset(any()));
    });
  });

  group('LocalSyncService - PlatformAsset conversion', () {
    test('toLocalAsset uses correct updatedAt timestamp', () {
      final platformAsset = PlatformAsset(
        id: 'test-id',
        name: 'test.jpg',
        type: AssetType.image.index,
        durationInSeconds: 0,
        orientation: 0,
        isFavorite: false,
        createdAt: 1700000000,
        updatedAt: 1732000000,
      );

      final localAsset = platformAsset.toLocalAsset();

      expect(localAsset.createdAt.millisecondsSinceEpoch ~/ 1000, 1700000000);
      expect(localAsset.updatedAt.millisecondsSinceEpoch ~/ 1000, 1732000000);
      expect(localAsset.updatedAt, isNot(localAsset.createdAt));
    });
  });
}
