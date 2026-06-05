import 'package:drift/drift.dart' as drift;
import 'package:drift/native.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/config/trash_sync_config.dart';
import 'package:immich_mobile/domain/models/trash_sync.model.dart';
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
  late MockPermissionRepository mockPermissionRepository;
  late DriftTrashSyncRepository mockTrashSyncRepo;
  late MockAssetMediaRepository mockAssetMediaRepository;
  late MockNativeSyncApi mockNativeSyncApi;
  late MockSettingsRepository mockSettingsRepository;
  late Drift db;
  late bool hasManageMediaPermission;
  late TrashSyncMode trashSyncMode;

  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    debugDefaultTargetPlatformOverride = TargetPlatform.android;
    registerFallbackValue(LocalAssetStub.image1);
    registerFallbackValue(<LocalAsset>[]);
    registerFallbackValue(<LocalAlbum>[]);
    registerFallbackValue(<String>[]);
    registerFallbackValue(<String, List<String>>{});

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
    mockAssetMediaRepository = MockAssetMediaRepository();
    mockPermissionRepository = MockPermissionRepository();
    mockTrashSyncRepo = MockTrashSyncRepository();
    mockNativeSyncApi = MockNativeSyncApi();
    mockSettingsRepository = MockSettingsRepository();
    trashSyncMode = TrashSyncMode.off;
    when(
      () => mockSettingsRepository.appConfig,
    ).thenAnswer((_) => AppConfig(trashSync: TrashSyncConfig(mode: trashSyncMode)));

    when(() => mockNativeSyncApi.shouldFullSync()).thenAnswer((_) async => false);
    when(() => mockNativeSyncApi.getMediaChanges()).thenAnswer(
      (_) async => SyncDelta(hasChanges: false, updates: const [], deletes: const [], assetAlbums: const {}),
    );
    when(() => mockNativeSyncApi.getTrashedAssets()).thenAnswer((_) async => {});
    when(() => mockNativeSyncApi.checkpointSync()).thenAnswer((_) async {});
    when(() => mockTrashedLocalAssetRepository.processTrashSnapshot(any())).thenAnswer((_) async {});
    when(() => mockTrashedLocalAssetRepository.getToRestore()).thenAnswer((_) async => []);
    when(() => mockTrashedLocalAssetRepository.applyRestoredAssets(any())).thenAnswer((_) async {});
    when(() => mockTrashSyncRepo.cleanupLocalTrashSync()).thenAnswer((_) async => 0);
    when(() => mockAssetMediaRepository.deleteAll(any())).thenAnswer((invocation) async {
      final ids = invocation.positionalArguments.first as List<String>;
      return ids;
    });

    sut = LocalSyncService(
      localAlbumRepository: mockLocalAlbumRepository,
      localAssetRepository: mockLocalAssetRepository,
      trashedLocalAssetRepository: mockTrashedLocalAssetRepository,
      assetMediaRepository: mockAssetMediaRepository,
      permissionRepository: mockPermissionRepository,
      nativeSyncApi: mockNativeSyncApi,
      trashSyncRepository: mockTrashSyncRepo,
      settingsRepository: mockSettingsRepository,
    );

    await Store.clear();
    when(() => mockPermissionRepository.hasManageMediaPermission()).thenAnswer((_) async => false);
    hasManageMediaPermission = false;
    when(() => mockPermissionRepository.hasManageMediaPermission()).thenAnswer((_) async => hasManageMediaPermission);
  });

  group('LocalSyncService - syncTrashedAssets gating', () {
    test('invokes syncTrashedAssets when Android flag enabled and permission granted', () async {
      trashSyncMode = TrashSyncMode.autoSync;
      when(() => mockPermissionRepository.hasManageMediaPermission()).thenAnswer((_) async => true);
      hasManageMediaPermission = true;

      await sut.sync();

      verify(() => mockNativeSyncApi.getTrashedAssets()).called(1);
      verify(() => mockTrashedLocalAssetRepository.processTrashSnapshot(any())).called(1);
      verifyNever(() => mockTrashSyncRepo.cleanupLocalTrashSync());
    });

    test('syncs trashed snapshot when store flags are disabled', () async {
      trashSyncMode = TrashSyncMode.off;
      when(() => mockPermissionRepository.hasManageMediaPermission()).thenAnswer((_) async => true);
      hasManageMediaPermission = true;

      await sut.sync();

      verify(() => mockNativeSyncApi.getTrashedAssets()).called(1);
      verify(() => mockTrashedLocalAssetRepository.processTrashSnapshot(any())).called(1);
      verifyNever(() => mockTrashSyncRepo.cleanupLocalTrashSync());
      verifyNever(() => mockPermissionRepository.hasManageMediaPermission());
      verifyNever(() => mockAssetMediaRepository.restoreAssetsFromTrash(any()));
    });

    test('syncs trashed snapshot but does not handle remote trash intents', () async {
      trashSyncMode = TrashSyncMode.autoSync;
      hasManageMediaPermission = false;

      await sut.sync();

      verify(() => mockNativeSyncApi.getTrashedAssets()).called(1);
      verify(() => mockTrashedLocalAssetRepository.processTrashSnapshot(any())).called(1);
      verifyNever(() => mockTrashSyncRepo.cleanupLocalTrashSync());
      verifyNever(() => mockTrashSyncRepo.upsertReviewCandidates(any()));
      verifyNever(() => mockAssetMediaRepository.restoreAssetsFromTrash(any()));
    });

    test('syncs trashed snapshot but skips review restore when MANAGE_MEDIA permission absent', () async {
      trashSyncMode = TrashSyncMode.review;
      when(() => mockTrashedLocalAssetRepository.getToRestore()).thenAnswer((_) async => [LocalAssetStub.image1]);
      hasManageMediaPermission = false;

      await sut.processTrashedAssets({});

      verify(() => mockTrashedLocalAssetRepository.processTrashSnapshot(any())).called(1);
      verifyNever(() => mockTrashSyncRepo.cleanupLocalTrashSync());
      verify(() => mockPermissionRepository.hasManageMediaPermission()).called(1);
      verifyNever(() => mockAssetMediaRepository.restoreAssetsFromTrash(any()));
    });

    test('cleans trash sync after Android full sync updates local assets', () async {
      when(() => mockNativeSyncApi.shouldFullSync()).thenAnswer((_) async => true);
      when(() => mockNativeSyncApi.getAlbums()).thenAnswer((_) async => []);
      when(() => mockLocalAlbumRepository.getAll(sortBy: {SortLocalAlbumsBy.id})).thenAnswer((_) async => []);

      await sut.sync();

      verify(() => mockNativeSyncApi.getTrashedAssets()).called(1);
      verify(() => mockTrashSyncRepo.cleanupLocalTrashSync()).called(1);
    });

    test('cleans trash sync after Android delta sync updates local assets', () async {
      when(() => mockNativeSyncApi.getMediaChanges()).thenAnswer(
        (_) async => SyncDelta(hasChanges: true, updates: const [], deletes: const [], assetAlbums: const {}),
      );
      when(() => mockNativeSyncApi.getAlbums()).thenAnswer((_) async => []);
      when(() => mockLocalAlbumRepository.updateAll(any())).thenAnswer((_) async {});
      when(
        () => mockLocalAlbumRepository.processDelta(
          updates: any(named: 'updates'),
          deletes: any(named: 'deletes'),
          assetAlbums: any(named: 'assetAlbums'),
        ),
      ).thenAnswer((_) async {});
      when(() => mockLocalAlbumRepository.getAll()).thenAnswer((_) async => []);

      await sut.sync();

      verify(() => mockNativeSyncApi.getTrashedAssets()).called(1);
      verify(() => mockTrashSyncRepo.cleanupLocalTrashSync()).called(1);
    });

    test('skips syncTrashedAssets on non-Android platforms', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = TargetPlatform.android);

      hasManageMediaPermission = false;
      when(() => mockPermissionRepository.hasManageMediaPermission()).thenAnswer((_) async => false);

      await sut.sync();

      verifyNever(() => mockNativeSyncApi.getTrashedAssets());
    });

    test('cleans trash sync after iOS delta sync updates local assets', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = TargetPlatform.android);
      when(() => mockNativeSyncApi.getMediaChanges()).thenAnswer(
        (_) async => SyncDelta(hasChanges: true, updates: const [], deletes: const [], assetAlbums: const {}),
      );
      when(() => mockNativeSyncApi.getAlbums()).thenAnswer((_) async => []);
      when(() => mockLocalAlbumRepository.updateAll(any())).thenAnswer((_) async {});
      when(
        () => mockLocalAlbumRepository.processDelta(
          updates: any(named: 'updates'),
          deletes: any(named: 'deletes'),
          assetAlbums: any(named: 'assetAlbums'),
        ),
      ).thenAnswer((_) async {});
      when(() => mockLocalAlbumRepository.getAll()).thenAnswer((_) async => []);

      trashSyncMode = TrashSyncMode.autoSync;
      when(() => mockPermissionRepository.hasManageMediaPermission()).thenAnswer((_) async => true);

      await sut.sync();

      verifyNever(() => mockNativeSyncApi.getTrashedAssets());
      verify(() => mockTrashSyncRepo.cleanupLocalTrashSync()).called(1);
    });
  });

  group('LocalSyncService - syncTrashedAssets behavior', () {
    test('review mode only restores local trash and does not clean trash sync directly', () async {
      trashSyncMode = TrashSyncMode.review;

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
      verifyNever(() => mockTrashSyncRepo.cleanupLocalTrashSync());
    });

    test('processes trashed snapshot and restores assets', () async {
      trashSyncMode = TrashSyncMode.autoSync;
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
      when(() => mockAssetMediaRepository.restoreAssetsFromTrash(any())).thenAnswer((invocation) async {
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

      verify(() => mockAssetMediaRepository.restoreAssetsFromTrash(any())).called(1);
      verify(() => mockTrashedLocalAssetRepository.applyRestoredAssets(restoredIds)).called(1);
    });

    test('does not attempt restore when repository has no assets to restore', () async {
      when(() => mockTrashedLocalAssetRepository.getToRestore()).thenAnswer((_) async => []);

      await sut.processTrashedAssets({});

      final trashedSnapshot =
          verify(() => mockTrashedLocalAssetRepository.processTrashSnapshot(captureAny())).captured.single
              as Iterable<TrashedAsset>;
      expect(trashedSnapshot, isEmpty);
      verifyNever(() => mockAssetMediaRepository.restoreAssetsFromTrash(any()));
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
