import 'package:drift/drift.dart' hide isNotNull, isNull;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/asset/remote_deleted_local_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_album_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/trash_sync.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/trashed_local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/trashed_local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trash_sync.repository.dart';

import '../../fixtures/asset.stub.dart';

void main() {
  late Drift db;
  late DriftTrashSyncRepository repository;

  setUp(() async {
    db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    repository = DriftTrashSyncRepository(db);
    await db
        .into(db.userEntity)
        .insert(UserEntityCompanion.insert(id: 'user-1', name: 'user-1', email: 'user-1@example.com'));
  });

  tearDown(() async {
    await db.close();
  });

  Future<void> insertTrashSync({
    required String checksum,
    bool? isSyncApproved,
    required DateTime remoteDeletedAt,
  }) async {
    await db
        .into(db.trashSyncEntity)
        .insert(
          TrashSyncEntityCompanion.insert(
            checksum: checksum,
            isSyncApproved: Value(isSyncApproved),
            remoteDeletedAt: remoteDeletedAt,
          ),
        );
  }

  Future<void> insertRemoteAsset({required String checksum, DateTime? deletedAt}) async {
    final now = DateTime(2025, 1, 1);
    await db
        .into(db.remoteAssetEntity)
        .insert(
          RemoteAssetEntityCompanion.insert(
            id: 'remote-$checksum',
            checksum: checksum,
            name: 'remote-$checksum.jpg',
            ownerId: 'user-1',
            type: AssetType.image,
            createdAt: Value(now),
            updatedAt: Value(now),
            visibility: AssetVisibility.timeline,
            deletedAt: Value(deletedAt),
          ),
        );
  }

  Future<void> insertLocalAlbum({
    required String id,
    BackupSelection backupSelection = BackupSelection.selected,
  }) async {
    await db
        .into(db.localAlbumEntity)
        .insert(LocalAlbumEntityCompanion.insert(id: id, name: id, backupSelection: backupSelection));
  }

  Future<void> insertLocalAlbumAsset({required String albumId, required String assetId}) async {
    await db
        .into(db.localAlbumAssetEntity)
        .insert(LocalAlbumAssetEntityCompanion.insert(albumId: albumId, assetId: assetId));
  }

  Future<void> insertLocalAsset({required String checksum, String? id}) async {
    final now = DateTime(2025, 1, 1);
    await db
        .into(db.localAssetEntity)
        .insert(
          LocalAssetEntityCompanion.insert(
            id: id ?? 'local-$checksum',
            checksum: Value(checksum),
            name: 'local-$checksum.jpg',
            type: AssetType.image,
            createdAt: Value(now),
            updatedAt: Value(now),
          ),
        );
  }

  Future<void> insertTrashedLocalAsset({required String checksum}) async {
    final now = DateTime(2025, 1, 1);
    await db
        .into(db.trashedLocalAssetEntity)
        .insert(
          TrashedLocalAssetEntityCompanion.insert(
            id: 'trashed-$checksum',
            albumId: 'album-$checksum',
            name: 'trashed-$checksum.jpg',
            type: AssetType.image,
            checksum: Value(checksum),
            createdAt: Value(now),
            updatedAt: Value(now),
            source: TrashOrigin.localSync,
          ),
        );
  }

  group('getRemoteTrashCandidates', () {
    test('returns local assets matched by remote id without requiring selected backup albums', () async {
      final remoteDeletedAt = DateTime(2025, 6, 1);
      await insertRemoteAsset(checksum: 'matched-checksum', deletedAt: remoteDeletedAt);
      await insertRemoteAsset(checksum: 'remote-only-checksum', deletedAt: DateTime(2025, 6, 2));
      await insertLocalAsset(checksum: 'matched-checksum');
      await insertLocalAlbum(id: 'selected-album');
      await insertLocalAlbum(id: 'unselected-album', backupSelection: BackupSelection.none);
      await insertLocalAlbumAsset(albumId: 'selected-album', assetId: 'local-matched-checksum');
      await insertLocalAlbumAsset(albumId: 'unselected-album', assetId: 'local-matched-checksum');

      final result = await repository.getRemoteTrashCandidates({
        'remote-matched-checksum': remoteDeletedAt,
        'remote-remote-only-checksum': DateTime(2025, 6, 2),
      });

      expect(result, hasLength(1));
      expect(result.single.asset.id, 'local-matched-checksum');
      expect(result.single.asset.remoteId, 'remote-matched-checksum');
      expect(result.single.remoteDeletedAt, remoteDeletedAt);
    });

    test('excludes assets with accepted or rejected trash sync decisions', () async {
      final remoteDeletedAt = DateTime(2025, 6, 1);
      await insertLocalAlbum(id: 'selected-album');

      await insertRemoteAsset(checksum: 'pending-checksum', deletedAt: remoteDeletedAt);
      await insertRemoteAsset(checksum: 'rejected-checksum', deletedAt: remoteDeletedAt);
      await insertRemoteAsset(checksum: 'approved-checksum', deletedAt: remoteDeletedAt);
      await insertLocalAsset(checksum: 'pending-checksum');
      await insertLocalAsset(checksum: 'rejected-checksum');
      await insertLocalAsset(checksum: 'approved-checksum');
      await insertLocalAlbumAsset(albumId: 'selected-album', assetId: 'local-pending-checksum');
      await insertLocalAlbumAsset(albumId: 'selected-album', assetId: 'local-rejected-checksum');
      await insertLocalAlbumAsset(albumId: 'selected-album', assetId: 'local-approved-checksum');

      await insertTrashSync(checksum: 'pending-checksum', isSyncApproved: null, remoteDeletedAt: remoteDeletedAt);
      await insertTrashSync(checksum: 'rejected-checksum', isSyncApproved: false, remoteDeletedAt: remoteDeletedAt);
      await insertTrashSync(checksum: 'approved-checksum', isSyncApproved: true, remoteDeletedAt: remoteDeletedAt);

      final result = await repository.getRemoteTrashCandidates({
        'remote-pending-checksum': remoteDeletedAt,
        'remote-rejected-checksum': remoteDeletedAt,
        'remote-approved-checksum': remoteDeletedAt,
      });

      expect(result.map((item) => item.asset.id), ['local-pending-checksum']);
    });
  });

  group('getSelectedBackupRemoteTrashMoveCandidates', () {
    test('returns only candidates from selected backup albums', () async {
      await insertLocalAsset(checksum: 'selected-checksum');
      await insertLocalAsset(checksum: 'unselected-checksum');
      await insertLocalAlbum(id: 'selected-album');
      await insertLocalAlbum(id: 'unselected-album', backupSelection: BackupSelection.none);
      await insertLocalAlbumAsset(albumId: 'selected-album', assetId: 'local-selected-checksum');
      await insertLocalAlbumAsset(albumId: 'unselected-album', assetId: 'local-selected-checksum');
      await insertLocalAlbumAsset(albumId: 'unselected-album', assetId: 'local-unselected-checksum');

      final selectedCandidate = RemoteDeletedLocalAsset(
        asset: LocalAssetStub.image1.copyWith(id: 'local-selected-checksum', checksum: 'selected-checksum'),
        remoteDeletedAt: DateTime(2025, 6, 1),
      );
      final unselectedCandidate = RemoteDeletedLocalAsset(
        asset: LocalAssetStub.image2.copyWith(id: 'local-unselected-checksum', checksum: 'unselected-checksum'),
        remoteDeletedAt: DateTime(2025, 6, 2),
      );

      final result = await repository.getSelectedBackupRemoteTrashMoveCandidates([
        selectedCandidate,
        unselectedCandidate,
      ]);

      expect(result, [(albumId: 'selected-album', candidate: selectedCandidate)]);
    });

    test('returns one candidate per selected album for the same asset', () async {
      await insertLocalAsset(checksum: 'selected-checksum');
      await insertLocalAlbum(id: 'selected-1');
      await insertLocalAlbum(id: 'selected-2');
      await insertLocalAlbumAsset(albumId: 'selected-1', assetId: 'local-selected-checksum');
      await insertLocalAlbumAsset(albumId: 'selected-2', assetId: 'local-selected-checksum');

      final candidate = RemoteDeletedLocalAsset(
        asset: LocalAssetStub.image1.copyWith(id: 'local-selected-checksum', checksum: 'selected-checksum'),
        remoteDeletedAt: DateTime(2025, 6, 1),
      );

      final result = await repository.getSelectedBackupRemoteTrashMoveCandidates([candidate]);

      expect(result.map((item) => item.candidate), [candidate, candidate]);
      expect(result.map((item) => item.albumId), unorderedEquals(['selected-1', 'selected-2']));
    });
  });

  group('getTrashSyncMoveCandidates', () {
    test('returns local assets from selected backup albums matched by trash sync checksum', () async {
      final remoteDeletedAt = DateTime(2025, 6, 1);
      await insertLocalAsset(checksum: 'checksum-1');
      await insertLocalAlbum(id: 'selected-album');
      await insertLocalAlbum(id: 'unselected-album', backupSelection: BackupSelection.none);
      await insertLocalAlbumAsset(albumId: 'selected-album', assetId: 'local-checksum-1');
      await insertLocalAlbumAsset(albumId: 'unselected-album', assetId: 'local-checksum-1');
      await insertTrashSync(checksum: 'checksum-1', isSyncApproved: null, remoteDeletedAt: remoteDeletedAt);

      final result = await repository.getTrashSyncMoveCandidates(['checksum-1']);

      expect(result, hasLength(1));
      expect(result.single.albumId, 'selected-album');
      expect(result.single.candidate.asset.id, 'local-checksum-1');
      expect(result.single.candidate.asset.remoteId, isNull);
      expect(result.single.candidate.remoteDeletedAt, remoteDeletedAt);
    });

    test('excludes non-pending trash sync decisions', () async {
      final remoteDeletedAt = DateTime(2025, 6, 1);
      await insertLocalAlbum(id: 'selected-album');
      await insertLocalAsset(checksum: 'pending-checksum');
      await insertLocalAsset(checksum: 'rejected-checksum');
      await insertLocalAsset(checksum: 'approved-checksum');
      await insertLocalAlbumAsset(albumId: 'selected-album', assetId: 'local-pending-checksum');
      await insertLocalAlbumAsset(albumId: 'selected-album', assetId: 'local-rejected-checksum');
      await insertLocalAlbumAsset(albumId: 'selected-album', assetId: 'local-approved-checksum');

      await insertTrashSync(checksum: 'pending-checksum', isSyncApproved: null, remoteDeletedAt: remoteDeletedAt);
      await insertTrashSync(checksum: 'rejected-checksum', isSyncApproved: false, remoteDeletedAt: remoteDeletedAt);
      await insertTrashSync(checksum: 'approved-checksum', isSyncApproved: true, remoteDeletedAt: remoteDeletedAt);

      final result = await repository.getTrashSyncMoveCandidates([
        'pending-checksum',
        'rejected-checksum',
        'approved-checksum',
      ]);

      expect(result.map((item) => item.albumId), ['selected-album']);
      expect(result.map((item) => item.candidate.asset.id), ['local-pending-checksum']);
    });
  });

  group('upsertReviewCandidates', () {
    test('inserts new entries and updates pending entries when newer', () async {
      final oldTime = DateTime(2025, 1, 1);
      final newTime = DateTime(2025, 1, 2);

      await insertTrashSync(checksum: 'approved', isSyncApproved: true, remoteDeletedAt: oldTime);
      await insertTrashSync(checksum: 'pending', isSyncApproved: null, remoteDeletedAt: oldTime);
      await insertTrashSync(checksum: 'rejected', isSyncApproved: false, remoteDeletedAt: oldTime);
      await insertTrashSync(checksum: 'rejected-newer', isSyncApproved: false, remoteDeletedAt: newTime);

      final items = [
        RemoteDeletedLocalAsset(
          asset: LocalAssetStub.image1.copyWith(checksum: 'new'),
          remoteDeletedAt: newTime,
        ),
        RemoteDeletedLocalAsset(
          asset: LocalAssetStub.image1.copyWith(checksum: 'pending'),
          remoteDeletedAt: newTime,
        ),
        RemoteDeletedLocalAsset(
          asset: LocalAssetStub.image1.copyWith(checksum: 'rejected'),
          remoteDeletedAt: newTime,
        ),
        RemoteDeletedLocalAsset(
          asset: LocalAssetStub.image1.copyWith(checksum: 'approved'),
          remoteDeletedAt: newTime,
        ),
        RemoteDeletedLocalAsset(
          asset: LocalAssetStub.image1.copyWith(checksum: 'rejected-newer'),
          remoteDeletedAt: oldTime,
        ),
      ];

      await repository.upsertReviewCandidates(items);

      final rows = await db.select(db.trashSyncEntity).get();
      final byChecksum = {for (final row in rows) row.checksum: row};

      expect(byChecksum['new'], isNotNull);
      expect(byChecksum['new']!.isSyncApproved, isNull);
      expect(byChecksum['new']?.remoteDeletedAt, newTime);

      expect(byChecksum['pending'], isNotNull);
      expect(byChecksum['pending']!.isSyncApproved, isNull);
      expect(byChecksum['pending']?.remoteDeletedAt, newTime);

      expect(byChecksum['rejected'], isNotNull);
      expect(byChecksum['rejected']!.isSyncApproved, isFalse);
      expect(byChecksum['rejected']?.remoteDeletedAt, oldTime);

      expect(byChecksum['approved']?.isSyncApproved, isTrue);
      expect(byChecksum['approved']?.remoteDeletedAt, oldTime);

      expect(byChecksum['rejected-newer']?.isSyncApproved, isFalse);
      expect(byChecksum['rejected-newer']?.remoteDeletedAt, newTime);
    });
  });

  group('watch review approval state', () {
    test('counts only actionable pending approvals from selected backup albums', () async {
      final now = DateTime(2025, 1, 1);

      await insertLocalAlbum(id: 'selected-album');
      await insertLocalAlbum(id: 'unselected-album', backupSelection: BackupSelection.none);

      await insertTrashSync(checksum: 'pending-selected', isSyncApproved: null, remoteDeletedAt: now);
      await insertLocalAsset(checksum: 'pending-selected');
      await insertLocalAlbumAsset(albumId: 'selected-album', assetId: 'local-pending-selected');

      await insertTrashSync(checksum: 'pending-unselected', isSyncApproved: null, remoteDeletedAt: now);
      await insertLocalAsset(checksum: 'pending-unselected');
      await insertLocalAlbumAsset(albumId: 'unselected-album', assetId: 'local-pending-unselected');

      await insertTrashSync(checksum: 'pending-no-album', isSyncApproved: null, remoteDeletedAt: now);
      await insertLocalAsset(checksum: 'pending-no-album');

      await insertTrashSync(checksum: 'pending-local-trash', isSyncApproved: null, remoteDeletedAt: now);
      await insertLocalAsset(checksum: 'pending-local-trash');
      await insertLocalAlbumAsset(albumId: 'selected-album', assetId: 'local-pending-local-trash');
      await insertTrashedLocalAsset(checksum: 'pending-local-trash');

      await insertTrashSync(checksum: 'rejected-selected', isSyncApproved: false, remoteDeletedAt: now);
      await insertLocalAsset(checksum: 'rejected-selected');
      await insertLocalAlbumAsset(albumId: 'selected-album', assetId: 'local-rejected-selected');

      await insertTrashSync(checksum: 'approved-selected', isSyncApproved: true, remoteDeletedAt: now);
      await insertLocalAsset(checksum: 'approved-selected');
      await insertLocalAlbumAsset(albumId: 'selected-album', assetId: 'local-approved-selected');

      await expectLater(repository.watchPendingApprovalAssetCount(), emits(2));

      await expectLater(repository.watchIsAssetApprovalPending('pending-selected'), emits(true));
      await expectLater(repository.watchIsAssetApprovalPending('pending-unselected'), emits(false));
      await expectLater(repository.watchIsAssetApprovalPending('pending-no-album'), emits(false));
      await expectLater(repository.watchIsAssetApprovalPending('pending-local-trash'), emits(true));
      await expectLater(repository.watchIsAssetApprovalPending('rejected-selected'), emits(false));
      await expectLater(repository.watchIsAssetApprovalPending('approved-selected'), emits(false));
    });
  });

  group('deleteOutdated', () {
    test('removes entries for matched alive remote ids', () async {
      final now = DateTime(2025, 1, 1);

      await insertRemoteAsset(checksum: 'alive-matched', deletedAt: null);
      await insertRemoteAsset(checksum: 'alive-rejected', deletedAt: null);
      await insertRemoteAsset(checksum: 'alive-approved', deletedAt: null);
      await insertRemoteAsset(checksum: 'alive-not-requested', deletedAt: null);
      await insertRemoteAsset(checksum: 'deleted-matched', deletedAt: now);

      await insertTrashSync(checksum: 'alive-matched', isSyncApproved: null, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'alive-rejected', isSyncApproved: false, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'alive-approved', isSyncApproved: true, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'alive-not-requested', isSyncApproved: null, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'deleted-matched', isSyncApproved: null, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'missing-remote', isSyncApproved: null, remoteDeletedAt: now);

      final deleted = await repository.deleteOutdated([
        'remote-alive-matched',
        'remote-alive-rejected',
        'remote-alive-approved',
        'remote-deleted-matched',
        'remote-missing-remote',
      ]);

      expect(deleted, 3);

      final remaining = await db.select(db.trashSyncEntity).get();
      final remainingChecksums = remaining.map((row) => row.checksum).toSet();
      expect(remainingChecksums, containsAll(['alive-not-requested', 'deleted-matched', 'missing-remote']));
      expect(remainingChecksums, isNot(contains('alive-matched')));
      expect(remainingChecksums, isNot(contains('alive-rejected')));
      expect(remainingChecksums, isNot(contains('alive-approved')));
    });

    test('removes entries across remote id chunks', () async {
      final now = DateTime(2025, 1, 1);
      final count = kDriftMaxChunk + 1;

      for (var i = 0; i < count; i++) {
        final checksum = 'alive-$i';
        await insertRemoteAsset(checksum: checksum, deletedAt: null);
        await insertTrashSync(checksum: checksum, isSyncApproved: null, remoteDeletedAt: now);
      }

      final deleted = await repository.deleteOutdated(List.generate(count, (i) => 'remote-alive-$i'));

      expect(deleted, count);
      expect(await db.managers.trashSyncEntity.count(), 0);
    });
  });

  group('deleteResolved', () {
    test('removes pending and rejected entries for matched checksums', () async {
      final now = DateTime(2025, 1, 1);

      await insertTrashSync(checksum: 'pending-matched', isSyncApproved: null, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'rejected-matched', isSyncApproved: false, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'approved-matched', isSyncApproved: true, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'pending-not-requested', isSyncApproved: null, remoteDeletedAt: now);

      final deleted = await repository.deleteResolved(['pending-matched', 'rejected-matched', 'approved-matched']);

      expect(deleted, 2);

      final remaining = await db.select(db.trashSyncEntity).get();
      final remainingChecksums = remaining.map((row) => row.checksum).toSet();
      expect(remainingChecksums, containsAll(['approved-matched', 'pending-not-requested']));
      expect(remainingChecksums, isNot(contains('pending-matched')));
      expect(remainingChecksums, isNot(contains('rejected-matched')));
    });

    test('removes entries across checksum chunks', () async {
      final now = DateTime(2025, 1, 1);
      final count = kDriftMaxChunk + 1;

      for (var i = 0; i < count; i++) {
        await insertTrashSync(checksum: 'pending-$i', isSyncApproved: null, remoteDeletedAt: now);
      }

      final deleted = await repository.deleteResolved(List.generate(count, (i) => 'pending-$i'));

      expect(deleted, count);
      expect(await db.managers.trashSyncEntity.count(), 0);
    });
  });

  group('cleanupLocalTrashSync', () {
    test('removes pending and rejected entries with no live local asset', () async {
      final now = DateTime(2025, 1, 1);

      await insertTrashedLocalAsset(checksum: 'local-pending');
      await insertTrashedLocalAsset(checksum: 'local-rejected');
      await insertTrashedLocalAsset(checksum: 'local-approved');
      await insertTrashedLocalAsset(checksum: 'live-duplicate');
      await insertLocalAsset(checksum: 'live-duplicate');

      await insertTrashSync(checksum: 'local-pending', isSyncApproved: null, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'local-rejected', isSyncApproved: false, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'local-approved', isSyncApproved: true, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'live-duplicate', isSyncApproved: null, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'not-local', isSyncApproved: null, remoteDeletedAt: now);

      final deleted = await repository.cleanupLocalTrashSync();

      expect(deleted, 3);

      final remaining = await db.select(db.trashSyncEntity).get();
      final remainingChecksums = remaining.map((row) => row.checksum).toSet();
      expect(remainingChecksums, containsAll(['local-approved', 'live-duplicate']));
      expect(remainingChecksums, isNot(contains('local-pending')));
      expect(remainingChecksums, isNot(contains('local-rejected')));
      expect(remainingChecksums, isNot(contains('not-local')));
    });

    test('removes stale entries', () async {
      final now = DateTime(2025, 1, 1);

      await insertRemoteAsset(checksum: 'alive-remote', deletedAt: null);
      await insertRemoteAsset(checksum: 'alive-approved', deletedAt: null);
      await insertLocalAsset(checksum: 'pending-keep');
      await insertLocalAsset(checksum: 'reject-keep');
      await insertTrashedLocalAsset(checksum: 'approve-keep');
      await insertTrashedLocalAsset(checksum: 'local-trashed');

      await insertTrashSync(checksum: 'alive-remote', isSyncApproved: null, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'alive-approved', isSyncApproved: true, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'local-trashed', isSyncApproved: false, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'pending-keep', isSyncApproved: null, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'pending-orphan', isSyncApproved: null, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'reject-orphan', isSyncApproved: false, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'reject-keep', isSyncApproved: false, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'approve-orphan', isSyncApproved: true, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'approve-keep', isSyncApproved: true, remoteDeletedAt: now);

      final deleted = await repository.cleanupLocalTrashSync();

      expect(deleted, 6);

      final remaining = await db.select(db.trashSyncEntity).get();
      final remainingChecksums = remaining.map((row) => row.checksum).toSet();
      expect(remainingChecksums, containsAll(['pending-keep', 'reject-keep', 'approve-keep']));
      expect(remainingChecksums, isNot(contains('alive-remote')));
      expect(remainingChecksums, isNot(contains('alive-approved')));
      expect(remainingChecksums, isNot(contains('local-trashed')));
      expect(remainingChecksums, isNot(contains('pending-orphan')));
      expect(remainingChecksums, isNot(contains('reject-orphan')));
      expect(remainingChecksums, isNot(contains('approve-orphan')));
    });

    test('stale review cleanup is throttled', () async {
      final firstRun = await repository.cleanupLocalTrashSync();
      final secondRun = await repository.cleanupLocalTrashSync();

      expect(firstRun, 0);
      expect(secondRun, 0);
    });

    test('orphaned review cleanup is not throttled', () async {
      final now = DateTime(2025, 1, 1);

      await repository.cleanupLocalTrashSync();

      await insertTrashSync(checksum: 'pending-orphan', isSyncApproved: null, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'rejected-orphan', isSyncApproved: false, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'approved-orphan', isSyncApproved: true, remoteDeletedAt: now);

      final deleted = await repository.cleanupLocalTrashSync();

      expect(deleted, 2);

      final remaining = await db.select(db.trashSyncEntity).get();
      final remainingChecksums = remaining.map((row) => row.checksum).toSet();
      expect(remainingChecksums, {'approved-orphan'});
    });
  });
}
