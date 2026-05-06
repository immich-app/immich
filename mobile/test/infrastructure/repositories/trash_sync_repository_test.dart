import 'package:drift/drift.dart' hide isNotNull, isNull;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/asset/remote_deleted_local_asset.model.dart';
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

  Future<void> insertLocalAsset({required String checksum}) async {
    final now = DateTime(2025, 1, 1);
    await db
        .into(db.localAssetEntity)
        .insert(
          LocalAssetEntityCompanion.insert(
            id: 'local-$checksum',
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

  group('upsertReviewCandidates', () {
    test('inserts new entries and updates pending or rejected entries when newer', () async {
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
      expect(byChecksum['rejected']!.isSyncApproved, isNull);
      expect(byChecksum['rejected']?.remoteDeletedAt, newTime);

      expect(byChecksum['approved']?.isSyncApproved, isTrue);
      expect(byChecksum['approved']?.remoteDeletedAt, oldTime);

      expect(byChecksum['rejected-newer']?.isSyncApproved, isFalse);
      expect(byChecksum['rejected-newer']?.remoteDeletedAt, newTime);
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
  });

  group('deleteLocallyResolved', () {
    test('removes pending and rejected entries matched by local trash checksums', () async {
      final now = DateTime(2025, 1, 1);

      await insertTrashedLocalAsset(checksum: 'local-pending');
      await insertTrashedLocalAsset(checksum: 'local-rejected');
      await insertTrashedLocalAsset(checksum: 'local-approved');

      await insertTrashSync(checksum: 'local-pending', isSyncApproved: null, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'local-rejected', isSyncApproved: false, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'local-approved', isSyncApproved: true, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'not-local', isSyncApproved: null, remoteDeletedAt: now);

      final deleted = await repository.deleteLocallyResolved();

      expect(deleted, 2);

      final remaining = await db.select(db.trashSyncEntity).get();
      final remainingChecksums = remaining.map((row) => row.checksum).toSet();
      expect(remainingChecksums, containsAll(['local-approved', 'not-local']));
      expect(remainingChecksums, isNot(contains('local-pending')));
      expect(remainingChecksums, isNot(contains('local-rejected')));
    });
  });

  group('cleanupOutdatedEntries', () {
    test('removes matched and orphaned entries', () async {
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

      final deleted = await repository.cleanupOutdatedEntries();

      expect(deleted, 5);

      final remaining = await db.select(db.trashSyncEntity).get();
      final remainingChecksums = remaining.map((row) => row.checksum).toSet();
      expect(remainingChecksums, containsAll(['local-trashed', 'pending-keep', 'reject-keep', 'approve-keep']));
      expect(remainingChecksums, isNot(contains('alive-remote')));
      expect(remainingChecksums, isNot(contains('alive-approved')));
      expect(remainingChecksums, isNot(contains('pending-orphan')));
      expect(remainingChecksums, isNot(contains('reject-orphan')));
      expect(remainingChecksums, isNot(contains('approve-orphan')));
    });

    test('throttled cleanup returns null when min interval has not elapsed', () async {
      final firstRun = await repository.cleanupOutdatedEntriesThrottled();
      final secondRun = await repository.cleanupOutdatedEntriesThrottled();

      expect(firstRun, 0);
      expect(secondRun, isNull);
    });
  });
}
