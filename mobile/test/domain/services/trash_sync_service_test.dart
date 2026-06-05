import 'package:drift/drift.dart' as drift;
import 'package:drift/native.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/asset/remote_deleted_local_asset.model.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/config/trash_sync_config.dart';
import 'package:immich_mobile/domain/models/trash_sync.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/domain/services/trash_sync.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trash_sync.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trashed_local_asset.repository.dart';
import 'package:mocktail/mocktail.dart';

import '../../fixtures/asset.stub.dart';
import '../../infrastructure/repository.mock.dart';
import '../../repository.mocks.dart';

void main() {
  late TrashSyncService sut;
  late DriftTrashedLocalAssetRepository mockTrashedLocalAssetRepo;
  late DriftTrashSyncRepository mockTrashSyncRepo;
  late MockAssetMediaRepository mockAssetMediaRepo;
  late MockPermissionRepository mockPermissionRepo;
  late MockSettingsRepository mockSettingsRepository;
  late Drift db;
  late bool hasManageMediaPermission;
  late TrashSyncMode trashSyncMode;

  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    debugDefaultTargetPlatformOverride = TargetPlatform.android;
    registerFallbackValue(LocalAssetStub.image1);
    registerFallbackValue(RemoteDeletedLocalAsset(asset: LocalAssetStub.image1, remoteDeletedAt: DateTime(2025, 1, 1)));
    registerFallbackValue(<RemoteDeletedLocalAsset>[]);
    registerFallbackValue(<String, DateTime>{});

    db = Drift(drift.DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: DriftStoreRepository(db), listenUpdates: false);
  });

  tearDownAll(() async {
    debugDefaultTargetPlatformOverride = null;
    await Store.clear();
    await db.close();
  });

  setUp(() async {
    debugDefaultTargetPlatformOverride = TargetPlatform.android;

    mockTrashedLocalAssetRepo = MockTrashedLocalAssetRepository();
    mockTrashSyncRepo = MockTrashSyncRepository();
    mockAssetMediaRepo = MockAssetMediaRepository();
    mockPermissionRepo = MockPermissionRepository();
    mockSettingsRepository = MockSettingsRepository();
    trashSyncMode = TrashSyncMode.off;
    when(
      () => mockSettingsRepository.appConfig,
    ).thenAnswer((_) => AppConfig(trashSync: TrashSyncConfig(mode: trashSyncMode)));

    sut = TrashSyncService(
      trashedLocalAssetRepository: mockTrashedLocalAssetRepo,
      trashSyncRepository: mockTrashSyncRepo,
      assetMediaRepository: mockAssetMediaRepo,
      permissionRepository: mockPermissionRepo,
      settingsRepository: mockSettingsRepository,
    );

    when(
      () => mockTrashSyncRepo.getRemoteTrashCandidates(any<Map<String, DateTime>>()),
    ).thenAnswer((_) async => <RemoteDeletedLocalAsset>[]);
    when(
      () => mockTrashSyncRepo.getSelectedBackupRemoteTrashMoveCandidates(any<Iterable<RemoteDeletedLocalAsset>>()),
    ).thenAnswer((_) async => <RemoteTrashMoveCandidate>[]);
    when(() => mockTrashedLocalAssetRepo.trashLocalAssets(any())).thenAnswer((_) async {});
    when(() => mockTrashedLocalAssetRepo.getToRestore()).thenAnswer((_) async => <LocalAsset>[]);
    when(() => mockTrashedLocalAssetRepo.applyRestoredAssets(any())).thenAnswer((_) async {});
    hasManageMediaPermission = false;
    when(() => mockPermissionRepo.hasManageMediaPermission()).thenAnswer((_) async => hasManageMediaPermission);
    when(() => mockAssetMediaRepo.restoreAssetsFromTrash(any())).thenAnswer((_) async => <String>[]);
    when(() => mockAssetMediaRepo.deleteAll(any())).thenAnswer((invocation) async {
      return (invocation.positionalArguments.first as List<String>).toList();
    });
    when(() => mockTrashSyncRepo.upsertReviewCandidates(any())).thenAnswer((_) async {});
    when(() => mockTrashSyncRepo.deleteOutdated(any())).thenAnswer((_) async => 0);
    when(() => mockTrashSyncRepo.deleteResolved(any())).thenAnswer((_) async => 0);
    when(() => mockTrashSyncRepo.transaction<void>(any())).thenAnswer((invocation) {
      final callback = invocation.positionalArguments.first as Future<void> Function();
      return callback();
    });
  });

  group("TrashSyncService - remote trash & restore", () {
    test("moves backed up local and merged assets to device trash when remote trash events are received", () async {
      trashSyncMode = TrashSyncMode.autoSync;
      hasManageMediaPermission = true;

      final localAsset = LocalAssetStub.image1.copyWith(id: 'local-only', checksum: 'checksum-local', remoteId: null);
      final mergedAsset = LocalAssetStub.image2.copyWith(
        id: 'merged-local',
        checksum: 'checksum-merged',
        remoteId: 'remote-merged',
      );
      final candidates = [
        RemoteDeletedLocalAsset(asset: localAsset, remoteDeletedAt: DateTime(2025, 5, 1)),
        RemoteDeletedLocalAsset(asset: mergedAsset, remoteDeletedAt: DateTime(2025, 5, 2)),
      ];
      final assetsByAlbum = {
        'album-a': [RemoteDeletedLocalAsset(asset: localAsset, remoteDeletedAt: DateTime(2025, 5, 1))],
        'album-b': [RemoteDeletedLocalAsset(asset: mergedAsset, remoteDeletedAt: DateTime(2025, 5, 2))],
      };
      when(() => mockTrashSyncRepo.getRemoteTrashCandidates(any<Map<String, DateTime>>())).thenAnswer((
        invocation,
      ) async {
        final trashedAssetsMap = invocation.positionalArguments.first as Map<String, DateTime>;
        expect(
          trashedAssetsMap,
          equals({
            'remote-1': DateTime(2025, 5, 1),
            'remote-2': DateTime(2025, 5, 2),
            'remote-3': DateTime(2025, 5, 3),
          }),
        );
        return candidates;
      });
      when(
        () => mockTrashSyncRepo.getSelectedBackupRemoteTrashMoveCandidates(any<Iterable<RemoteDeletedLocalAsset>>()),
      ).thenAnswer(
        (_) async => assetsByAlbum.entries
            .expand((entry) => entry.value.map((candidate) => (albumId: entry.key, candidate: candidate)))
            .toList(),
      );
      when(() => mockAssetMediaRepo.deleteAll(any())).thenAnswer((invocation) async {
        final ids = invocation.positionalArguments.first as List<String>;
        expect(ids, unorderedEquals(['local-only', 'merged-local']));
        return ids;
      });

      await sut.syncRemoteTrashState([
        (id: 'remote-1', deletedAt: DateTime(2025, 5, 1)),
        (id: 'remote-2', deletedAt: DateTime(2025, 5, 2)),
        (id: 'remote-3', deletedAt: DateTime(2025, 5, 3)),
      ]);

      verifyNever(() => mockTrashSyncRepo.upsertReviewCandidates(any()));
      final trashedAssets =
          verify(() => mockTrashedLocalAssetRepo.trashLocalAssets(captureAny())).captured.single
              as Iterable<RemoteTrashMoveCandidate>;
      expect(trashedAssets.map((item) => item.albumId), unorderedEquals(['album-a', 'album-b']));
      expect(trashedAssets.map((item) => item.candidate.asset.id), unorderedEquals(['local-only', 'merged-local']));
      final resolvedChecksums =
          verify(() => mockTrashSyncRepo.deleteResolved(captureAny())).captured.single as Iterable<String>;
      expect(resolvedChecksums, unorderedEquals(['checksum-local', 'checksum-merged']));
    });

    test("records only unresolved candidates after automatic trash move", () async {
      trashSyncMode = TrashSyncMode.autoSync;
      hasManageMediaPermission = true;

      final resolvedAsset = LocalAssetStub.image1.copyWith(id: 'resolved-local', checksum: 'checksum-resolved');
      final unresolvedAsset = LocalAssetStub.image2.copyWith(id: 'unresolved-local', checksum: 'checksum-unresolved');
      final candidates = [
        RemoteDeletedLocalAsset(asset: resolvedAsset, remoteDeletedAt: DateTime(2025, 5, 1)),
        RemoteDeletedLocalAsset(asset: unresolvedAsset, remoteDeletedAt: DateTime(2025, 5, 2)),
      ];
      when(
        () => mockTrashSyncRepo.getRemoteTrashCandidates(any<Map<String, DateTime>>()),
      ).thenAnswer((_) async => candidates);
      when(
        () => mockTrashSyncRepo.getSelectedBackupRemoteTrashMoveCandidates(any<Iterable<RemoteDeletedLocalAsset>>()),
      ).thenAnswer((_) async => candidates.map((candidate) => (albumId: 'album-a', candidate: candidate)).toList());
      when(() => mockAssetMediaRepo.deleteAll(any())).thenAnswer((_) async => ['resolved-local']);

      await sut.syncRemoteTrashState([
        (id: 'remote-1', deletedAt: DateTime(2025, 5, 1)),
        (id: 'remote-2', deletedAt: DateTime(2025, 5, 2)),
      ]);

      final trashedAssets =
          verify(() => mockTrashedLocalAssetRepo.trashLocalAssets(captureAny())).captured.single
              as Iterable<RemoteTrashMoveCandidate>;
      expect(trashedAssets.map((item) => item.albumId), ['album-a']);
      expect(trashedAssets.map((item) => item.candidate.asset.id), ['resolved-local']);
      final resolvedChecksums =
          verify(() => mockTrashSyncRepo.deleteResolved(captureAny())).captured.single as Iterable<String>;
      expect(resolvedChecksums, ['checksum-resolved']);
      final reviewCandidates =
          verify(
                () => mockTrashSyncRepo.upsertReviewCandidates(captureAny<Iterable<RemoteDeletedLocalAsset>>()),
              ).captured.single
              as Iterable<RemoteDeletedLocalAsset>;
      expect(reviewCandidates.map((item) => item.asset.id), ['unresolved-local']);
    });

    test("records all candidates when automatic trash move returns no moved ids", () async {
      trashSyncMode = TrashSyncMode.autoSync;
      hasManageMediaPermission = true;

      final localAsset = LocalAssetStub.image1.copyWith(id: 'local-only', checksum: 'checksum-failed');
      final candidates = [RemoteDeletedLocalAsset(asset: localAsset, remoteDeletedAt: DateTime(2025, 5, 1))];
      when(
        () => mockTrashSyncRepo.getRemoteTrashCandidates(any<Map<String, DateTime>>()),
      ).thenAnswer((_) async => candidates);
      when(
        () => mockTrashSyncRepo.getSelectedBackupRemoteTrashMoveCandidates(any<Iterable<RemoteDeletedLocalAsset>>()),
      ).thenAnswer((_) async => candidates.map((candidate) => (albumId: 'album-a', candidate: candidate)).toList());
      when(() => mockAssetMediaRepo.deleteAll(any())).thenAnswer((_) async => <String>[]);

      await sut.syncRemoteTrashState([(id: 'remote-1', deletedAt: DateTime(2025, 5, 1))]);

      verifyNever(() => mockTrashedLocalAssetRepo.trashLocalAssets(any()));
      verifyNever(() => mockTrashSyncRepo.deleteResolved(any()));
      final reviewCandidates =
          verify(
                () => mockTrashSyncRepo.upsertReviewCandidates(captureAny<Iterable<RemoteDeletedLocalAsset>>()),
              ).captured.single
              as Iterable<RemoteDeletedLocalAsset>;
      expect(reviewCandidates.map((item) => item.asset.id), ['local-only']);
    });

    test("uses review mode without moving assets to trash", () async {
      trashSyncMode = TrashSyncMode.review;
      final localAsset = LocalAssetStub.image1.copyWith(id: 'local-only', checksum: 'checksum-review', remoteId: null);
      final candidates = [RemoteDeletedLocalAsset(asset: localAsset, remoteDeletedAt: DateTime(2025, 5, 1))];
      when(
        () => mockTrashSyncRepo.getRemoteTrashCandidates(any<Map<String, DateTime>>()),
      ).thenAnswer((_) async => candidates);

      await sut.syncRemoteTrashState([(id: 'remote-1', deletedAt: DateTime(2025, 5, 1))]);

      verify(() => mockTrashSyncRepo.upsertReviewCandidates(any())).called(1);
      verifyNever(() => mockAssetMediaRepo.deleteAll(any()));
      verifyNever(() => mockTrashedLocalAssetRepo.trashLocalAssets(any()));
    });

    test("records review candidates even when Android trash settings and permission are disabled", () async {
      final localAsset = LocalAssetStub.image1.copyWith(id: 'local-only', checksum: 'checksum-disabled');
      final candidates = [RemoteDeletedLocalAsset(asset: localAsset, remoteDeletedAt: DateTime(2025, 5, 1))];
      when(
        () => mockTrashSyncRepo.getRemoteTrashCandidates(any<Map<String, DateTime>>()),
      ).thenAnswer((_) async => candidates);

      await sut.syncRemoteTrashState([(id: 'remote-1', deletedAt: DateTime(2025, 5, 1))]);

      verify(() => mockTrashSyncRepo.upsertReviewCandidates(any())).called(1);
      verifyNever(() => mockPermissionRepo.hasManageMediaPermission());
      verifyNever(() => mockAssetMediaRepo.deleteAll(any()));
      verifyNever(() => mockTrashedLocalAssetRepo.trashLocalAssets(any()));
    });

    test("cleans stale review entries for restored remote assets without media permission", () async {
      when(() => mockTrashSyncRepo.deleteOutdated(any())).thenAnswer((invocation) async {
        final remoteIds = invocation.positionalArguments.first as Iterable<String>;
        expect(remoteIds.toList(), ['remote-1']);
        return 0;
      });

      await sut.syncRemoteTrashState([(id: 'remote-1', deletedAt: null)]);

      verify(() => mockTrashSyncRepo.deleteOutdated(any())).called(1);
      verifyNever(() => mockPermissionRepo.hasManageMediaPermission());
      verifyNever(() => mockAssetMediaRepo.restoreAssetsFromTrash(any()));
    });

    test("restores trashed local assets when matching remote assets leave the trash", () async {
      trashSyncMode = TrashSyncMode.autoSync;
      hasManageMediaPermission = true;

      final trashedAssets = [
        LocalAssetStub.image1.copyWith(id: 'trashed-1', checksum: 'checksum-trash', remoteId: 'remote-1'),
      ];
      when(() => mockTrashedLocalAssetRepo.getToRestore()).thenAnswer((_) async => trashedAssets);
      when(() => mockAssetMediaRepo.restoreAssetsFromTrash(any())).thenAnswer((invocation) async {
        final requestedAssets = invocation.positionalArguments.first as Iterable<LocalAsset>;
        expect(requestedAssets, orderedEquals(trashedAssets));
        return ['trashed-1'];
      });

      await sut.syncRemoteTrashState([(id: 'remote-1', deletedAt: null)]);

      verify(() => mockTrashedLocalAssetRepo.applyRestoredAssets(['trashed-1'])).called(1);
    });

    test("does not auto restore on iOS review mode", () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = TargetPlatform.android);
      trashSyncMode = TrashSyncMode.review;

      await sut.syncRemoteTrashState([(id: 'remote-1', deletedAt: null)]);

      verify(() => mockTrashSyncRepo.deleteOutdated(any())).called(1);
      verifyNever(() => mockTrashedLocalAssetRepo.getToRestore());
      verifyNever(() => mockAssetMediaRepo.restoreAssetsFromTrash(any()));
    });

    test("requests local deletion candidates by remote ids for permanent remote delete events", () async {
      when(() => mockTrashSyncRepo.getRemoteTrashCandidates(any<Map<String, DateTime>>())).thenAnswer((
        invocation,
      ) async {
        final lookup = invocation.positionalArguments.first as Map<String, DateTime>;
        expect(lookup.keys.toSet(), equals({'remote-asset'}));
        return [];
      });

      await sut.applyRemoteRemovalToLocal({'remote-asset': DateTime(2025, 6, 1)});

      verify(() => mockTrashSyncRepo.getRemoteTrashCandidates(any<Map<String, DateTime>>())).called(1);
      verifyNever(() => mockAssetMediaRepo.deleteAll(any()));
    });
  });
}
