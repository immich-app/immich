import 'package:drift/drift.dart' hide isNotNull, isNull;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/remote_deleted_local_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/trash_sync.entity.drift.dart';
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

}
