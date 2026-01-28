import 'package:drift/drift.dart' hide isNotNull, isNull;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/asset/remote_deleted_local_asset.dart';
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
    await db.into(db.userEntity).insert(
      UserEntityCompanion.insert(id: 'user-1', name: 'user-1', email: 'user-1@example.com'),
    );
  });

  tearDown(() async {
    await db.close();
  });

  Future<void> insertTrashSync({
    required String checksum,
    bool? isSyncApproved,
    required DateTime remoteDeletedAt,
  }) async {
    await db.into(db.trashSyncEntity).insert(
      TrashSyncEntityCompanion.insert(
        checksum: checksum,
        isSyncApproved: Value(isSyncApproved),
        remoteDeletedAt: remoteDeletedAt,
      ),
    );
  }

  Future<void> insertRemoteAsset({required String checksum, DateTime? deletedAt}) async {
    final now = DateTime(2025, 1, 1);
    await db.into(db.remoteAssetEntity).insert(
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
    await db.into(db.localAssetEntity).insert(
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
    await db.into(db.trashedLocalAssetEntity).insert(
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
    test('inserts new entries and updates rejected ones when newer', () async {
      final oldTime = DateTime(2025, 1, 1);
      final newTime = DateTime(2025, 1, 2);

      await insertTrashSync(checksum: 'approved', isSyncApproved: true, remoteDeletedAt: oldTime);
      await insertTrashSync(checksum: 'rejected', isSyncApproved: false, remoteDeletedAt: oldTime);
      await insertTrashSync(checksum: 'rejected-newer', isSyncApproved: false, remoteDeletedAt: newTime);

      final items = [
        RemoteDeletedLocalAsset(asset: LocalAssetStub.image1.copyWith(checksum: 'new'), remoteDeletedAt: newTime),
        RemoteDeletedLocalAsset(asset: LocalAssetStub.image1.copyWith(checksum: 'rejected'), remoteDeletedAt: newTime),
        RemoteDeletedLocalAsset(asset: LocalAssetStub.image1.copyWith(checksum: 'approved'), remoteDeletedAt: newTime),
        RemoteDeletedLocalAsset(
            asset: LocalAssetStub.image1.copyWith(checksum: 'rejected-newer'), remoteDeletedAt: oldTime),
      ];

      await repository.upsertReviewCandidates(items);

      final rows = await db.select(db.trashSyncEntity).get();
      final byChecksum = {for (final row in rows) row.checksum: row};

      expect(byChecksum['new'], isNotNull);
      expect(byChecksum['new']!.isSyncApproved, isNull);
      expect(byChecksum['new']?.remoteDeletedAt, newTime);

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
    test('removes matched and orphaned entries', () async {
      final now = DateTime(2025, 1, 1);

      await insertRemoteAsset(checksum: 'alive-remote', deletedAt: null);
      await insertLocalAsset(checksum: 'reject-keep');
      await insertTrashedLocalAsset(checksum: 'approve-keep');
      await insertTrashedLocalAsset(checksum: 'local-trashed');

      await insertTrashSync(checksum: 'alive-remote', isSyncApproved: null, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'local-trashed', isSyncApproved: false, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'pending-keep', isSyncApproved: null, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'reject-orphan', isSyncApproved: false, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'reject-keep', isSyncApproved: false, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'approve-orphan', isSyncApproved: true, remoteDeletedAt: now);
      await insertTrashSync(checksum: 'approve-keep', isSyncApproved: true, remoteDeletedAt: now);

      final deleted = await repository.deleteOutdated();

      expect(deleted, 4);

      final remaining = await db.select(db.trashSyncEntity).get();
      final remainingChecksums = remaining.map((row) => row.checksum).toSet();
      expect(remainingChecksums, containsAll(['pending-keep', 'reject-keep', 'approve-keep']));
      expect(remainingChecksums, isNot(contains('alive-remote')));
      expect(remainingChecksums, isNot(contains('local-trashed')));
      expect(remainingChecksums, isNot(contains('reject-orphan')));
      expect(remainingChecksums, isNot(contains('approve-orphan')));
    });
  });
}
