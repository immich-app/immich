import 'package:drift/drift.dart' as drift;
import 'package:drift/native.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/remote_deleted_local_asset.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trash_sync.repository.dart';
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
  late MockTagService tagService;

  late Drift db;

  setUpAll(() async {
    registerFallbackValue(LocalAssetStub.image1);
    registerFallbackValue(<String>[]);
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
    tagService = MockTagService();

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
      tagService,
      Logger('ActionServiceTest'),
    );

    when(() => trashSyncRepository.getTrashSyncMoveCandidates(any())).thenAnswer((_) async => []);
    when(() => localAssetRepository.delete(any())).thenAnswer((_) async {});
    when(() => trashedLocalAssetRepository.trashLocalAssets(any())).thenAnswer((_) async {});
    when(() => trashSyncRepository.updateApproves(any(), any())).thenAnswer((_) async {});
    when(() => trashSyncRepository.transaction<void>(any())).thenAnswer((invocation) {
      final callback = invocation.positionalArguments.first as Future<void> Function();
      return callback();
    });
  });

  tearDown(() async {
    await Store.clear();
  });

  group('ActionService.updateRating', () {
    const assetId = 'asset_id_1';

    test('calls both repositories with the given rating', () async {
      when(() => assetApiRepository.updateRating(assetId, 3)).thenAnswer((_) async {});
      when(() => remoteAssetRepository.updateRating(assetId, 3)).thenAnswer((_) async {});

      final result = await sut.updateRating(assetId, 3);

      expect(result, isTrue);
      verify(() => assetApiRepository.updateRating(assetId, 3)).called(1);
      verify(() => remoteAssetRepository.updateRating(assetId, 3)).called(1);
    });

    test('calls both repositories with null to clear rating', () async {
      when(() => assetApiRepository.updateRating(assetId, null)).thenAnswer((_) async {});
      when(() => remoteAssetRepository.updateRating(assetId, null)).thenAnswer((_) async {});

      final result = await sut.updateRating(assetId, null);

      expect(result, isTrue);
      verify(() => assetApiRepository.updateRating(assetId, null)).called(1);
      verify(() => remoteAssetRepository.updateRating(assetId, null)).called(1);
    });
  });

  group('ActionService.applyDateTime', () {
    const ids = ['asset_id_1'];

    test('sends the picked value to the api with its offset intact', () async {
      const picked = '2026-06-10T19:15:00.000+06:00';
      when(() => assetApiRepository.updateDateTime(ids, picked)).thenAnswer((_) async {});
      when(
        () => remoteAssetRepository.updateDateTime(ids, DateTime.parse(picked), timeZone: 'UTC+06:00'),
      ).thenAnswer((_) async {});

      await sut.applyDateTime(ids, picked);

      verify(() => assetApiRepository.updateDateTime(ids, picked)).called(1);
      verify(() => remoteAssetRepository.updateDateTime(ids, DateTime.parse(picked), timeZone: 'UTC+06:00')).called(1);
    });

    test('handles negative offsets', () async {
      const picked = '2026-01-05T08:00:00.000-05:30';
      when(() => assetApiRepository.updateDateTime(ids, picked)).thenAnswer((_) async {});
      when(
        () => remoteAssetRepository.updateDateTime(ids, DateTime.parse(picked), timeZone: 'UTC-05:30'),
      ).thenAnswer((_) async {});

      await sut.applyDateTime(ids, picked);

      verify(() => assetApiRepository.updateDateTime(ids, picked)).called(1);
      verify(() => remoteAssetRepository.updateDateTime(ids, DateTime.parse(picked), timeZone: 'UTC-05:30')).called(1);
    });

    test('writes no timezone when the value has no offset', () async {
      const picked = '2026-06-10T13:15:00.000Z';
      when(() => assetApiRepository.updateDateTime(ids, picked)).thenAnswer((_) async {});
      when(
        () => remoteAssetRepository.updateDateTime(ids, DateTime.parse(picked), timeZone: null),
      ).thenAnswer((_) async {});

      await sut.applyDateTime(ids, picked);

      verify(() => assetApiRepository.updateDateTime(ids, picked)).called(1);
      verify(() => remoteAssetRepository.updateDateTime(ids, DateTime.parse(picked), timeZone: null)).called(1);
    });
  });

  group('ActionService.deleteLocal', () {
    test('routes deleted ids to trashed repository on Android', () async {
      const ids = ['a', 'b'];

      when(() => assetMediaRepository.deleteAll(ids)).thenAnswer((_) async => ids);
      when(() => trashedLocalAssetRepository.applyTrashedAssets(ids)).thenAnswer((_) async {});

      final result = await sut.deleteLocal(ids);

      expect(result, ids.length);
      verify(() => assetMediaRepository.deleteAll(ids)).called(1);
      verify(() => trashedLocalAssetRepository.applyTrashedAssets(ids)).called(1);
      verifyNever(() => localAssetRepository.delete(any()));
    });

    test('deletes local rows directly on iOS', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = TargetPlatform.android);
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

      expect(result, (displayCount: 1, success: true));
      verify(() => trashSyncRepository.updateApproves(any(), false)).called(1);
      verifyNever(() => trashSyncRepository.getTrashSyncMoveCandidates(any()));
      verifyNever(() => assetMediaRepository.deleteAll(any()));
    });

    test('returns 0 when no local assets match', () async {
      when(() => trashSyncRepository.getTrashSyncMoveCandidates(any())).thenAnswer((_) async => []);
      when(() => trashSyncRepository.updateApproves(any(), true)).thenAnswer((_) async {});

      final result = await sut.resolveRemoteTrash(['checksum-1'], isSyncApproved: true);

      expect(result, (displayCount: 1, success: true));
      verify(() => trashSyncRepository.getTrashSyncMoveCandidates(any())).called(1);
      verify(() => trashSyncRepository.updateApproves(any(), true)).called(1);
      verifyNever(() => assetMediaRepository.deleteAll(any()));
    });

    test('keeps review pending when media plugin deletes no local files', () async {
      final localAsset = LocalAssetStub.image1.copyWith(checksum: 'checksum-1');
      final remoteDeleted = RemoteDeletedLocalAsset(asset: localAsset, remoteDeletedAt: DateTime(2024, 1, 1));
      when(
        () => trashSyncRepository.getTrashSyncMoveCandidates(any()),
      ).thenAnswer((_) async => [(albumId: 'album-1', candidate: remoteDeleted)]);
      when(() => assetMediaRepository.deleteAll(any())).thenAnswer((_) async => []);

      final result = await sut.resolveRemoteTrash(['checksum-1'], isSyncApproved: true);

      expect(result, (displayCount: 0, success: false));
      verify(() => assetMediaRepository.deleteAll([localAsset.id])).called(1);
      verifyNever(() => trashSyncRepository.updateApproves(any(), true));
    });

    test('moves files to trash through media plugin and updates approvals on success', () async {
      final localAsset = LocalAssetStub.image1.copyWith(checksum: 'checksum-1', remoteId: 'remote-1');
      final remoteDeleted = RemoteDeletedLocalAsset(asset: localAsset, remoteDeletedAt: DateTime(2024, 1, 1));
      when(
        () => trashSyncRepository.getTrashSyncMoveCandidates(any()),
      ).thenAnswer((_) async => [(albumId: 'album-1', candidate: remoteDeleted)]);
      when(() => assetMediaRepository.deleteAll(any())).thenAnswer((_) async => [localAsset.id]);
      when(() => trashSyncRepository.updateApproves(any(), true)).thenAnswer((_) async {});

      final result = await sut.resolveRemoteTrash(['checksum-1'], isSyncApproved: true);

      expect(result, (displayCount: 1, success: true));
      verify(() => assetMediaRepository.deleteAll([localAsset.id])).called(1);
      verify(() => trashSyncRepository.updateApproves(any(), true)).called(1);
    });

    test('does not update approvals when media plugin delete fails', () async {
      final localAsset = LocalAssetStub.image1.copyWith(checksum: 'checksum-1');
      final remoteDeleted = RemoteDeletedLocalAsset(asset: localAsset, remoteDeletedAt: DateTime(2024, 1, 1));
      when(
        () => trashSyncRepository.getTrashSyncMoveCandidates(any()),
      ).thenAnswer((_) async => [(albumId: 'album-1', candidate: remoteDeleted)]);
      when(() => assetMediaRepository.deleteAll(any())).thenAnswer((_) async => []);

      final result = await sut.resolveRemoteTrash(['checksum-1'], isSyncApproved: true);

      expect(result, (displayCount: 0, success: false));
      verify(() => assetMediaRepository.deleteAll([localAsset.id])).called(1);
      verifyNever(() => trashSyncRepository.updateApproves(any(), true));
    });

    test('updates approvals and syncs trash after media plugin delete', () async {
      final localAsset = LocalAssetStub.image1.copyWith(checksum: 'checksum-1', remoteId: 'remote-1');
      final remoteDeleted = RemoteDeletedLocalAsset(asset: localAsset, remoteDeletedAt: DateTime(2024, 1, 1));
      when(
        () => trashSyncRepository.getTrashSyncMoveCandidates(any()),
      ).thenAnswer((_) async => [(albumId: 'album-1', candidate: remoteDeleted)]);
      when(() => assetMediaRepository.deleteAll(any())).thenAnswer((_) async => [localAsset.id]);

      final result = await sut.resolveRemoteTrash(['checksum-1'], isSyncApproved: true);

      expect(result, (displayCount: 1, success: true));
      verifyInOrder([
        () => assetMediaRepository.deleteAll([localAsset.id]),
        () => trashedLocalAssetRepository.trashLocalAssets(any()),
        () => trashSyncRepository.updateApproves(any(), true),
      ]);
    });

    test('updates approvals and deletes local rows on iOS without writing local trash state', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = TargetPlatform.android);

      final localAsset = LocalAssetStub.image1.copyWith(checksum: 'checksum-1', remoteId: 'remote-1');
      final remoteDeleted = RemoteDeletedLocalAsset(asset: localAsset, remoteDeletedAt: DateTime(2024, 1, 1));
      when(
        () => trashSyncRepository.getTrashSyncMoveCandidates(any()),
      ).thenAnswer((_) async => [(albumId: 'album-1', candidate: remoteDeleted)]);
      when(() => assetMediaRepository.deleteAll(any())).thenAnswer((_) async => [localAsset.id]);

      final result = await sut.resolveRemoteTrash(['checksum-1'], isSyncApproved: true);

      expect(result, (displayCount: 1, success: true));
      final deletedLocalIds =
          verify(() => localAssetRepository.delete(captureAny())).captured.single as Iterable<String>;
      expect(deletedLocalIds, [localAsset.id]);
      verifyNever(() => trashedLocalAssetRepository.trashLocalAssets(any()));
      verify(() => trashSyncRepository.updateApproves(any(), true)).called(1);
    });

    test('moves trash sync candidates preserving remote deletion dates', () async {
      final asset1 = LocalAssetStub.image1.copyWith(checksum: 'checksum-1', remoteId: 'remote-1');
      final asset2 = LocalAssetStub.image1.copyWith(checksum: 'checksum-2', remoteId: 'remote-2');
      final deletedAt1 = DateTime(2024, 1, 1);
      final deletedAt2 = DateTime(2024, 2, 2);
      final remoteDeleted = [
        RemoteDeletedLocalAsset(asset: asset1, remoteDeletedAt: deletedAt1),
        RemoteDeletedLocalAsset(asset: asset2, remoteDeletedAt: deletedAt2),
      ];
      when(
        () => trashSyncRepository.getTrashSyncMoveCandidates(any()),
      ).thenAnswer((_) async => remoteDeleted.map((candidate) => (albumId: 'album-1', candidate: candidate)).toList());
      when(() => assetMediaRepository.deleteAll(any())).thenAnswer((_) async => [asset1.id, asset2.id]);

      final result = await sut.resolveRemoteTrash(['checksum-1', 'checksum-2'], isSyncApproved: true);

      expect(result, (displayCount: 2, success: true));
      final captured =
          verify(() => trashedLocalAssetRepository.trashLocalAssets(captureAny())).captured.single
              as Iterable<RemoteTrashMoveCandidate>;
      expect(captured.map((item) => item.albumId), ['album-1', 'album-1']);
      expect(captured.map((item) => item.candidate.remoteDeletedAt), [deletedAt1, deletedAt2]);
    });

    test('updates only deleted assets on partial media plugin success', () async {
      final asset1 = LocalAssetStub.image1.copyWith(id: 'local-1', checksum: 'checksum-1', remoteId: 'remote-1');
      final asset2 = LocalAssetStub.image2.copyWith(id: 'local-2', checksum: 'checksum-2', remoteId: 'remote-2');
      final deletedAt1 = DateTime(2024, 1, 1);
      final deletedAt2 = DateTime(2024, 2, 2);
      final remoteDeleted = [
        RemoteDeletedLocalAsset(asset: asset1, remoteDeletedAt: deletedAt1),
        RemoteDeletedLocalAsset(asset: asset2, remoteDeletedAt: deletedAt2),
      ];
      when(
        () => trashSyncRepository.getTrashSyncMoveCandidates(any()),
      ).thenAnswer((_) async => remoteDeleted.map((candidate) => (albumId: 'album-1', candidate: candidate)).toList());
      when(() => assetMediaRepository.deleteAll(any())).thenAnswer((_) async => [asset1.id]);

      final result = await sut.resolveRemoteTrash(['checksum-1', 'checksum-2'], isSyncApproved: true);

      expect(result, (displayCount: 1, success: false));
      final captured =
          verify(() => trashedLocalAssetRepository.trashLocalAssets(captureAny())).captured.single
              as Iterable<RemoteTrashMoveCandidate>;
      expect(captured.map((item) => item.albumId), ['album-1']);
      expect(captured.map((item) => item.candidate.remoteDeletedAt), [deletedAt1]);
      final capturedChecksums =
          verify(() => trashSyncRepository.updateApproves(captureAny(), true)).captured.single as Iterable<String>;
      expect(capturedChecksums.toSet(), {'checksum-1'});
    });

    test('reports success and affected assets when multiple local assets share one checksum', () async {
      final asset1 = LocalAssetStub.image1.copyWith(id: 'local-1', checksum: 'checksum-1', remoteId: 'remote-1');
      final asset2 = LocalAssetStub.image2.copyWith(id: 'local-2', checksum: 'checksum-1', remoteId: 'remote-2');
      final deletedAt1 = DateTime(2024, 1, 1);
      final deletedAt2 = DateTime(2024, 2, 2);
      final remoteDeleted = [
        RemoteDeletedLocalAsset(asset: asset1, remoteDeletedAt: deletedAt1),
        RemoteDeletedLocalAsset(asset: asset2, remoteDeletedAt: deletedAt2),
      ];
      when(
        () => trashSyncRepository.getTrashSyncMoveCandidates(any()),
      ).thenAnswer((_) async => remoteDeleted.map((candidate) => (albumId: 'album-1', candidate: candidate)).toList());
      when(() => assetMediaRepository.deleteAll(any())).thenAnswer((_) async => [asset1.id, asset2.id]);

      final result = await sut.resolveRemoteTrash(['checksum-1'], isSyncApproved: true);

      expect(result, (displayCount: 1, success: true));
      final captured =
          verify(() => trashedLocalAssetRepository.trashLocalAssets(captureAny())).captured.single
              as Iterable<RemoteTrashMoveCandidate>;
      expect(captured.map((item) => item.albumId), ['album-1', 'album-1']);
      expect(captured.map((item) => item.candidate.remoteDeletedAt), [deletedAt1, deletedAt2]);
      final capturedChecksums =
          verify(() => trashSyncRepository.updateApproves(captureAny(), true)).captured.single as Iterable<String>;
      expect(capturedChecksums.toSet(), {'checksum-1'});
    });
  });
}
