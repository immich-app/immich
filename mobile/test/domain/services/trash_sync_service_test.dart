import 'package:drift/drift.dart' as drift;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/asset/remote_deleted_local_asset.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/domain/services/trash_sync.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trash_sync.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trashed_local_asset.repository.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:mocktail/mocktail.dart';

import '../../fixtures/asset.stub.dart';
import '../../infrastructure/repository.mock.dart';
import '../../repository.mocks.dart';

void main() {
  late TrashSyncService sut;
  late DriftLocalAssetRepository mockLocalAssetRepo;
  late DriftTrashedLocalAssetRepository mockTrashedLocalAssetRepo;
  late DriftTrashSyncRepository mockTrashSyncRepo;
  late AssetMediaRepository mockAssetMediaRepo;
  late Drift db;
  late bool hasManageMediaPermission;

  setUpAll(() async {
    registerFallbackValue(LocalAssetStub.image1);
    registerFallbackValue(RemoteDeletedLocalAsset(asset: LocalAssetStub.image1, remoteDeletedAt: DateTime(2025, 1, 1)));
    registerFallbackValue(<RemoteDeletedLocalAsset>[]);
    registerFallbackValue(<String, DateTime>{});

    db = Drift(drift.DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: DriftStoreRepository(db), listenUpdates: false);
  });

  tearDownAll(() async {
    await Store.clear();
    await db.close();
  });

  setUp(() async {
    mockLocalAssetRepo = MockLocalAssetRepository();
    mockTrashedLocalAssetRepo = MockTrashedLocalAssetRepository();
    mockTrashSyncRepo = MockTrashSyncRepository();
    mockAssetMediaRepo = MockAssetMediaRepository();

    sut = TrashSyncService(
      localAssetRepository: mockLocalAssetRepo,
      trashedLocalAssetRepository: mockTrashedLocalAssetRepo,
      trashSyncRepository: mockTrashSyncRepo,
      assetMediaRepository: mockAssetMediaRepo,
    );

    when(
      () => mockLocalAssetRepo.getRemoteTrashCandidatesByAlbum(any<Map<String, DateTime>>()),
    ).thenAnswer((_) async => <String, List<RemoteDeletedLocalAsset>>{});
    when(() => mockTrashedLocalAssetRepo.trashLocalAssets(any())).thenAnswer((_) async {});
    when(() => mockTrashedLocalAssetRepo.getToRestore()).thenAnswer((_) async => <LocalAsset>[]);
    when(() => mockTrashedLocalAssetRepo.applyRestoredAssets(any())).thenAnswer((_) async {});
    hasManageMediaPermission = false;
    when(() => mockAssetMediaRepo.hasManageMediaPermission()).thenAnswer((_) async => hasManageMediaPermission);
    when(() => mockAssetMediaRepo.restoreAssetsFromTrash(any())).thenAnswer((_) async => <String>[]);
    when(() => mockAssetMediaRepo.deleteAll(any())).thenAnswer((invocation) async {
      return (invocation.positionalArguments.first as List<String>).toList();
    });
    when(() => mockTrashSyncRepo.upsertReviewCandidates(any())).thenAnswer((_) async {});
    when(() => mockTrashSyncRepo.deleteOutdated(any())).thenAnswer((_) async => 0);
    when(() => mockTrashSyncRepo.deleteResolved(any())).thenAnswer((_) async => 0);
    await Store.put(StoreKey.manageLocalMediaAndroid, false);
    await Store.put(StoreKey.reviewOutOfSyncChangesAndroid, false);
  });

  group("TrashSyncService - remote trash & restore", () {
    test("moves backed up local and merged assets to device trash when remote trash events are received", () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, true);
      hasManageMediaPermission = true;

      final localAsset = LocalAssetStub.image1.copyWith(id: 'local-only', checksum: 'checksum-local', remoteId: null);
      final mergedAsset = LocalAssetStub.image2.copyWith(
        id: 'merged-local',
        checksum: 'checksum-merged',
        remoteId: 'remote-merged',
      );
      final assetsByAlbum = {
        'album-a': [RemoteDeletedLocalAsset(asset: localAsset, remoteDeletedAt: DateTime(2025, 5, 1))],
        'album-b': [RemoteDeletedLocalAsset(asset: mergedAsset, remoteDeletedAt: DateTime(2025, 5, 2))],
      };
      when(() => mockLocalAssetRepo.getRemoteTrashCandidatesByAlbum(any<Map<String, DateTime>>())).thenAnswer((
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
        return assetsByAlbum;
      });
      when(() => mockAssetMediaRepo.deleteAll(any())).thenAnswer((invocation) async {
        final ids = invocation.positionalArguments.first as List<String>;
        expect(ids, unorderedEquals(['local-only', 'merged-local']));
        return ids;
      });

      await sut.handleRemoteAssetTrashState([
        (id: 'remote-1', deletedAt: DateTime(2025, 5, 1)),
        (id: 'remote-2', deletedAt: DateTime(2025, 5, 2)),
        (id: 'remote-3', deletedAt: DateTime(2025, 5, 3)),
      ]);

      verifyNever(() => mockTrashSyncRepo.upsertReviewCandidates(any()));
      final trashedAssets =
          verify(() => mockTrashedLocalAssetRepo.trashLocalAssets(captureAny())).captured.single
              as Map<String, Iterable<RemoteDeletedLocalAsset>>;
      expect(trashedAssets.keys, unorderedEquals(['album-a', 'album-b']));
      expect(trashedAssets['album-a']!.map((item) => item.asset.id), ['local-only']);
      expect(trashedAssets['album-b']!.map((item) => item.asset.id), ['merged-local']);
      final resolvedChecksums =
          verify(() => mockTrashSyncRepo.deleteResolved(captureAny())).captured.single as Iterable<String>;
      expect(resolvedChecksums, unorderedEquals(['checksum-local', 'checksum-merged']));
    });

    test("records only unresolved candidates after automatic trash move", () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, true);
      hasManageMediaPermission = true;

      final resolvedAsset = LocalAssetStub.image1.copyWith(id: 'resolved-local', checksum: 'checksum-resolved');
      final unresolvedAsset = LocalAssetStub.image2.copyWith(id: 'unresolved-local', checksum: 'checksum-unresolved');
      final assetsByAlbum = {
        'album-a': [
          RemoteDeletedLocalAsset(asset: resolvedAsset, remoteDeletedAt: DateTime(2025, 5, 1)),
          RemoteDeletedLocalAsset(asset: unresolvedAsset, remoteDeletedAt: DateTime(2025, 5, 2)),
        ],
      };
      when(
        () => mockLocalAssetRepo.getRemoteTrashCandidatesByAlbum(any<Map<String, DateTime>>()),
      ).thenAnswer((_) async => assetsByAlbum);
      when(() => mockAssetMediaRepo.deleteAll(any())).thenAnswer((_) async => ['resolved-local']);

      await sut.handleRemoteAssetTrashState([
        (id: 'remote-1', deletedAt: DateTime(2025, 5, 1)),
        (id: 'remote-2', deletedAt: DateTime(2025, 5, 2)),
      ]);

      final trashedAssets =
          verify(() => mockTrashedLocalAssetRepo.trashLocalAssets(captureAny())).captured.single
              as Map<String, Iterable<RemoteDeletedLocalAsset>>;
      expect(trashedAssets['album-a']!.map((item) => item.asset.id), ['resolved-local']);
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
      await Store.put(StoreKey.manageLocalMediaAndroid, true);
      hasManageMediaPermission = true;

      final localAsset = LocalAssetStub.image1.copyWith(id: 'local-only', checksum: 'checksum-failed');
      final assetsByAlbum = {
        'album-a': [RemoteDeletedLocalAsset(asset: localAsset, remoteDeletedAt: DateTime(2025, 5, 1))],
      };
      when(
        () => mockLocalAssetRepo.getRemoteTrashCandidatesByAlbum(any<Map<String, DateTime>>()),
      ).thenAnswer((_) async => assetsByAlbum);
      when(() => mockAssetMediaRepo.deleteAll(any())).thenAnswer((_) async => <String>[]);

      await sut.handleRemoteAssetTrashState([(id: 'remote-1', deletedAt: DateTime(2025, 5, 1))]);

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
      await Store.put(StoreKey.reviewOutOfSyncChangesAndroid, true);
      final localAsset = LocalAssetStub.image1.copyWith(id: 'local-only', checksum: 'checksum-review', remoteId: null);
      final assetsByAlbum = {
        'album-a': [RemoteDeletedLocalAsset(asset: localAsset, remoteDeletedAt: DateTime(2025, 5, 1))],
      };
      when(
        () => mockLocalAssetRepo.getRemoteTrashCandidatesByAlbum(any<Map<String, DateTime>>()),
      ).thenAnswer((_) async => assetsByAlbum);

      await sut.handleRemoteAssetTrashState([(id: 'remote-1', deletedAt: DateTime(2025, 5, 1))]);

      verify(() => mockTrashSyncRepo.upsertReviewCandidates(any())).called(1);
      verifyNever(() => mockAssetMediaRepo.deleteAll(any()));
      verifyNever(() => mockTrashedLocalAssetRepo.trashLocalAssets(any()));
    });

    test("records review candidates even when Android trash settings and permission are disabled", () async {
      final localAsset = LocalAssetStub.image1.copyWith(id: 'local-only', checksum: 'checksum-disabled');
      final assetsByAlbum = {
        'album-a': [RemoteDeletedLocalAsset(asset: localAsset, remoteDeletedAt: DateTime(2025, 5, 1))],
      };
      when(
        () => mockLocalAssetRepo.getRemoteTrashCandidatesByAlbum(any<Map<String, DateTime>>()),
      ).thenAnswer((_) async => assetsByAlbum);

      await sut.handleRemoteAssetTrashState([(id: 'remote-1', deletedAt: DateTime(2025, 5, 1))]);

      verify(() => mockTrashSyncRepo.upsertReviewCandidates(any())).called(1);
      verifyNever(() => mockAssetMediaRepo.hasManageMediaPermission());
      verifyNever(() => mockAssetMediaRepo.deleteAll(any()));
      verifyNever(() => mockTrashedLocalAssetRepo.trashLocalAssets(any()));
    });

    test("cleans stale review entries for restored remote assets without media permission", () async {
      when(() => mockTrashSyncRepo.deleteOutdated(any())).thenAnswer((invocation) async {
        final remoteIds = invocation.positionalArguments.first as Iterable<String>;
        expect(remoteIds.toList(), ['remote-1']);
        return 0;
      });

      await sut.handleRemoteAssetTrashState([(id: 'remote-1', deletedAt: null)]);

      verify(() => mockTrashSyncRepo.deleteOutdated(any())).called(1);
      verifyNever(() => mockAssetMediaRepo.hasManageMediaPermission());
      verifyNever(() => mockAssetMediaRepo.restoreAssetsFromTrash(any()));
    });

    test("restores trashed local assets when matching remote assets leave the trash", () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, true);
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

      await sut.handleRemoteAssetTrashState([(id: 'remote-1', deletedAt: null)]);

      verify(() => mockTrashedLocalAssetRepo.applyRestoredAssets(['trashed-1'])).called(1);
    });

    test("requests local deletion candidates by remote ids for permanent remote delete events", () async {
      when(() => mockLocalAssetRepo.getRemoteTrashCandidatesByAlbum(any<Map<String, DateTime>>())).thenAnswer((
        invocation,
      ) async {
        final lookup = invocation.positionalArguments.first as Map<String, DateTime>;
        expect(lookup.keys.toSet(), equals({'remote-asset'}));
        return {};
      });

      await sut.handleRemoteDeletedOrTrashed({'remote-asset': DateTime(2025, 6, 1)});

      verify(() => mockLocalAssetRepo.getRemoteTrashCandidatesByAlbum(any<Map<String, DateTime>>())).called(1);
      verifyNever(() => mockAssetMediaRepo.deleteAll(any()));
    });
  });
}
