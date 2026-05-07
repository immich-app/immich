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
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trash_sync.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trashed_local_asset.repository.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/repositories/local_files_manager.repository.dart';
import 'package:mocktail/mocktail.dart';

import '../../domain/service.mock.dart';
import '../../fixtures/asset.stub.dart';
import '../../infrastructure/repository.mock.dart';
import '../../repository.mocks.dart';

void main() {
  late LocalSyncService sut;
  late DriftLocalAlbumRepository mockLocalAlbumRepository;
  late DriftLocalAssetRepository mockLocalAssetRepository;
  late DriftTrashedLocalAssetRepository mockTrashedLocalAssetRepository;
  late DriftTrashSyncRepository mockTrashSyncRepo;
  late LocalFilesManagerRepository mockLocalFilesManager;
  late MockNativeSyncApi mockNativeSyncApi;
  late Drift db;
  late bool hasManageMediaPermission;

  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    debugDefaultTargetPlatformOverride = TargetPlatform.android;
    registerFallbackValue(LocalAssetStub.image1);
    registerFallbackValue(<LocalAsset>[]);

    db = Drift(drift.DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: DriftStoreRepository(db));
  });

  tearDownAll(() async {
    debugDefaultTargetPlatformOverride = null;
    await Store.clear();
    await db.close();
  });

  setUp(() async {
    debugDefaultTargetPlatformOverride = TargetPlatform.android;

    mockLocalAlbumRepository = MockLocalAlbumRepository();
    mockLocalAssetRepository = MockLocalAssetRepository();
    mockTrashedLocalAssetRepository = MockTrashedLocalAssetRepository();
    mockTrashSyncRepo = MockTrashSyncRepository();
    mockLocalFilesManager = MockLocalFilesManagerRepository();
    mockNativeSyncApi = MockNativeSyncApi();

    when(() => mockNativeSyncApi.shouldFullSync()).thenAnswer((_) async => false);
    when(() => mockNativeSyncApi.getMediaChanges()).thenAnswer(
      (_) async => SyncDelta(hasChanges: false, updates: const [], deletes: const [], assetAlbums: const {}),
    );
    when(() => mockNativeSyncApi.getTrashedAssets()).thenAnswer((_) async => {});
    when(() => mockTrashedLocalAssetRepository.processTrashSnapshot(any())).thenAnswer((_) async {});
    when(() => mockTrashedLocalAssetRepository.getToRestore()).thenAnswer((_) async => []);
    when(() => mockTrashedLocalAssetRepository.applyRestoredAssets(any())).thenAnswer((_) async {});
    when(() => mockTrashSyncRepo.deleteLocallyResolved()).thenAnswer((_) async => 0);
    when(() => mockTrashSyncRepo.cleanupOutdatedEntriesThrottled()).thenAnswer((_) async => 0);

    sut = LocalSyncService(
      localAlbumRepository: mockLocalAlbumRepository,
      localAssetRepository: mockLocalAssetRepository,
      trashedLocalAssetRepository: mockTrashedLocalAssetRepository,
      localFilesManager: mockLocalFilesManager,
      nativeSyncApi: mockNativeSyncApi,
      trashSyncRepository: mockTrashSyncRepo,
    );

    await Store.clear();
    await Store.put(StoreKey.manageLocalMediaAndroid, false);
    await Store.put(StoreKey.reviewOutOfSyncChangesAndroid, false);
    hasManageMediaPermission = false;
    when(() => mockLocalFilesManager.hasManageMediaPermission()).thenAnswer((_) async => hasManageMediaPermission);
  });

  group('LocalSyncService - syncTrashedAssets gating', () {
    test('invokes syncTrashedAssets when Android flag enabled and permission granted', () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, true);
      hasManageMediaPermission = true;

      await sut.sync();

      verify(() => mockNativeSyncApi.getTrashedAssets()).called(1);
      verify(() => mockTrashedLocalAssetRepository.processTrashSnapshot(any())).called(1);
      verify(() => mockTrashSyncRepo.deleteLocallyResolved()).called(1);
    });

    test('syncs trashed snapshot when store flags are disabled', () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, false);
      hasManageMediaPermission = true;

      await sut.sync();

      verify(() => mockNativeSyncApi.getTrashedAssets()).called(1);
      verify(() => mockTrashedLocalAssetRepository.processTrashSnapshot(any())).called(1);
      verify(() => mockTrashSyncRepo.deleteLocallyResolved()).called(1);
      verifyNever(() => mockLocalFilesManager.hasManageMediaPermission());
      verifyNever(() => mockLocalFilesManager.moveToTrash(any()));
      verifyNever(() => mockLocalFilesManager.restoreAssetsFromTrash(any()));
    });

    test('syncs trashed snapshot but does not handle remote trash intents', () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, true);
      await Store.put(StoreKey.reviewOutOfSyncChangesAndroid, false);
      hasManageMediaPermission = false;

      await sut.sync();

      verify(() => mockNativeSyncApi.getTrashedAssets()).called(1);
      verify(() => mockTrashedLocalAssetRepository.processTrashSnapshot(any())).called(1);
      verify(() => mockTrashSyncRepo.deleteLocallyResolved()).called(1);
      verifyNever(() => mockTrashSyncRepo.upsertReviewCandidates(any()));
      verifyNever(() => mockLocalFilesManager.moveToTrash(any()));
      verifyNever(() => mockLocalFilesManager.restoreAssetsFromTrash(any()));
      verifyNever(() => mockTrashedLocalAssetRepository.trashLocalAssets(any()));
    });

    test('syncs trashed snapshot but skips review restore when MANAGE_MEDIA permission absent', () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, false);
      await Store.put(StoreKey.reviewOutOfSyncChangesAndroid, true);
      when(() => mockTrashedLocalAssetRepository.getToRestore()).thenAnswer((_) async => [LocalAssetStub.image1]);
      hasManageMediaPermission = false;

      await sut.processTrashedAssets({});

      verify(() => mockTrashedLocalAssetRepository.processTrashSnapshot(any())).called(1);
      verify(() => mockTrashSyncRepo.deleteLocallyResolved()).called(1);
      verify(() => mockLocalFilesManager.hasManageMediaPermission()).called(1);
      verifyNever(() => mockLocalFilesManager.moveToTrash(any()));
      verifyNever(() => mockLocalFilesManager.restoreAssetsFromTrash(any()));
    });

    test('skips syncTrashedAssets on non-Android platforms', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = TargetPlatform.android);

      await Store.put(StoreKey.manageLocalMediaAndroid, false);
      hasManageMediaPermission = false;

      await sut.sync();

      verifyNever(() => mockNativeSyncApi.getTrashedAssets());
    });
  });

  group('LocalSyncService - syncTrashedAssets behavior', () {
    test('review mode only restores local trash and runs throttled cleanup', () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, false);
      await Store.put(StoreKey.reviewOutOfSyncChangesAndroid, true);
      expect(Store.get(StoreKey.reviewOutOfSyncChangesAndroid, false), isTrue);

      final platformAsset = PlatformAsset(
        id: 'remote-id',
        name: 'remote.jpg',
        type: AssetType.image.index,
        durationMs: 0,
        orientation: 0,
        isFavorite: false,
        playbackStyle: PlatformAssetPlaybackStyle.image,
      );

      await sut.processTrashedAssets({
        'album-a': [platformAsset],
      });

      verifyNever(() => mockTrashSyncRepo.upsertReviewCandidates(any()));
      verify(() => mockTrashSyncRepo.cleanupOutdatedEntriesThrottled()).called(1);
      verifyNever(() => mockLocalFilesManager.moveToTrash(any()));
      verifyNever(() => mockTrashedLocalAssetRepository.trashLocalAssets(any()));
    });

    test('processes trashed snapshot and restores assets', () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, true);
      hasManageMediaPermission = true;

      final platformAsset = PlatformAsset(
        id: 'remote-id',
        name: 'remote.jpg',
        type: AssetType.image.index,
        durationMs: 0,
        orientation: 0,
        isFavorite: false,
        playbackStyle: PlatformAssetPlaybackStyle.image,
      );

      final assetsToRestore = [LocalAssetStub.image1];
      when(() => mockTrashedLocalAssetRepository.getToRestore()).thenAnswer((_) async => assetsToRestore);
      final restoredIds = ['image1'];
      when(() => mockLocalFilesManager.restoreAssetsFromTrash(any())).thenAnswer((invocation) async {
        final Iterable<LocalAsset> requested = invocation.positionalArguments.first as Iterable<LocalAsset>;
        expect(requested, orderedEquals(assetsToRestore));
        return restoredIds;
      });

      await sut.processTrashedAssets({
        'album-a': [platformAsset],
      });

      final trashedSnapshot =
          verify(() => mockTrashedLocalAssetRepository.processTrashSnapshot(captureAny())).captured.single
              as Iterable<TrashedAsset>;
      expect(trashedSnapshot.length, 1);
      final trashedEntry = trashedSnapshot.single;
      expect(trashedEntry.albumId, 'album-a');
      expect(trashedEntry.asset.id, platformAsset.id);
      expect(trashedEntry.asset.name, platformAsset.name);
      verify(() => mockLocalFilesManager.restoreAssetsFromTrash(any())).called(1);
      verify(() => mockTrashedLocalAssetRepository.applyRestoredAssets(restoredIds)).called(1);
      verifyNever(() => mockLocalFilesManager.moveToTrash(any()));
      verifyNever(() => mockTrashedLocalAssetRepository.trashLocalAssets(any()));
    });

    test('does not attempt restore when repository has no assets to restore', () async {
      when(() => mockTrashedLocalAssetRepository.getToRestore()).thenAnswer((_) async => []);

      await sut.processTrashedAssets({});

      final trashedSnapshot =
          verify(() => mockTrashedLocalAssetRepository.processTrashSnapshot(captureAny())).captured.single
              as Iterable<TrashedAsset>;
      expect(trashedSnapshot, isEmpty);
      verifyNever(() => mockLocalFilesManager.restoreAssetsFromTrash(any()));
      verifyNever(() => mockTrashedLocalAssetRepository.applyRestoredAssets(any()));
    });
  });

  group('LocalSyncService - PlatformAsset conversion', () {
    test('toLocalAsset uses correct updatedAt timestamp', () {
      final platformAsset = PlatformAsset(
        id: 'test-id',
        name: 'test.jpg',
        type: AssetType.image.index,
        durationMs: 0,
        orientation: 0,
        isFavorite: false,
        createdAt: 1700000000,
        updatedAt: 1732000000,
        playbackStyle: PlatformAssetPlaybackStyle.image,
      );

      final localAsset = platformAsset.toLocalAsset();

      expect(localAsset.createdAt.millisecondsSinceEpoch ~/ 1000, 1700000000);
      expect(localAsset.updatedAt.millisecondsSinceEpoch ~/ 1000, 1732000000);
      expect(localAsset.updatedAt, isNot(localAsset.createdAt));
    });
  });
}
