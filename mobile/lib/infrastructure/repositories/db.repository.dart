import 'dart:async';

import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';
import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/interfaces/db.interface.dart';
import 'package:immich_mobile/infrastructure/entities/asset_face.entity.dart';
import 'package:immich_mobile/infrastructure/entities/auth_user.entity.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_album_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/memory.entity.dart';
import 'package:immich_mobile/infrastructure/entities/memory_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/partner.entity.dart';
import 'package:immich_mobile/infrastructure/entities/person.entity.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album_user.entity.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/stack.entity.dart';
import 'package:immich_mobile/infrastructure/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/infrastructure/entities/user_metadata.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.steps.dart';
import 'package:isar/isar.dart' hide Index;

import 'db.repository.drift.dart';

// #zoneTxn is the symbol used by Isar to mark a transaction within the current zone
// ref: isar/isar_common.dart
const Symbol _kzoneTxn = #zoneTxn;

class IsarDatabaseRepository implements IDatabaseRepository {
  final Isar _db;
  const IsarDatabaseRepository(Isar db) : _db = db;

  // Isar do not support nested transactions. This is a workaround to prevent us from making nested transactions
  // Reuse the current transaction if it is already active, else start a new transaction
  @override
  Future<T> transaction<T>(Future<T> Function() callback) =>
      Zone.current[_kzoneTxn] == null ? _db.writeTxn(callback) : callback();
}

@DriftDatabase(
  tables: [
    AuthUserEntity,
    UserEntity,
    UserMetadataEntity,
    PartnerEntity,
    LocalAlbumEntity,
    LocalAssetEntity,
    LocalAlbumAssetEntity,
    RemoteAssetEntity,
    RemoteExifEntity,
    RemoteAlbumEntity,
    RemoteAlbumAssetEntity,
    RemoteAlbumUserEntity,
    MemoryEntity,
    MemoryAssetEntity,
    StackEntity,
    PersonEntity,
    AssetFaceEntity,
    StoreEntity,
  ],
  include: {'package:immich_mobile/infrastructure/entities/merged_asset.drift'},
)
class Drift extends $Drift implements IDatabaseRepository {
  Drift([QueryExecutor? executor])
    : super(executor ?? driftDatabase(name: 'immich', native: const DriftNativeOptions(shareAcrossIsolates: true)));

  @override
  int get schemaVersion => 10;

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onUpgrade: (m, from, to) async {
      // Run migration steps without foreign keys and re-enable them later
      await customStatement('PRAGMA foreign_keys = OFF');

      await m.runMigrationSteps(
        from: from,
        to: to,
        steps: migrationSteps(
          from1To2: (m, v2) async {
            for (final entity in v2.entities) {
              await m.drop(entity);
              await m.create(entity);
            }
          },
          from2To3: (m, v3) async {
            // Removed foreign key constraint on stack.primaryAssetId
            await m.alterTable(TableMigration(v3.stackEntity));
          },
          from3To4: (m, v4) async {
            // Thumbnail path column got removed from person_entity
            await m.alterTable(TableMigration(v4.personEntity));
            // asset_face_entity is added
            await m.create(v4.assetFaceEntity);
          },
          from4To5: (m, v5) async {
            await m.alterTable(
              TableMigration(
                v5.userEntity,
                newColumns: [v5.userEntity.hasProfileImage, v5.userEntity.profileChangedAt],
                columnTransformer: {v5.userEntity.profileChangedAt: currentDateAndTime},
              ),
            );
          },
          from5To6: (m, v6) async {
            // Drops the (checksum, ownerId) and adds it back as (ownerId, checksum)
            await customStatement('DROP INDEX IF EXISTS UQ_remote_asset_owner_checksum');
            await m.drop(v6.idxRemoteAssetOwnerChecksum);
            await m.create(v6.idxRemoteAssetOwnerChecksum);
            // Adds libraryId to remote_asset_entity
            await m.addColumn(v6.remoteAssetEntity, v6.remoteAssetEntity.libraryId);
            await m.drop(v6.uQRemoteAssetsOwnerChecksum);
            await m.create(v6.uQRemoteAssetsOwnerChecksum);
            await m.drop(v6.uQRemoteAssetsOwnerLibraryChecksum);
            await m.create(v6.uQRemoteAssetsOwnerLibraryChecksum);
          },
          from6To7: (m, v7) async {
            await m.createIndex(v7.idxLatLng);
          },
          from7To8: (m, v8) async {
            await m.create(v8.storeEntity);
          },
          from8To9: (m, v9) async {
            await m.addColumn(v9.localAlbumEntity, v9.localAlbumEntity.linkedRemoteAlbumId);
          },
          from9To10: (m, v10) async {
            await m.createTable(v10.authUserEntity);
            await m.addColumn(v10.userEntity, v10.userEntity.avatarColor);
            await m.alterTable(TableMigration(v10.userEntity));
          },
        ),
      );

      if (kDebugMode) {
        // Fail if the migration broke foreign keys
        final wrongFKs = await customSelect('PRAGMA foreign_key_check').get();
        assert(wrongFKs.isEmpty, '${wrongFKs.map((e) => e.data)}');
      }

      await customStatement('PRAGMA foreign_keys = ON;');
    },
    beforeOpen: (details) async {
      await customStatement('PRAGMA foreign_keys = ON');
      await customStatement('PRAGMA synchronous = NORMAL');
      await customStatement('PRAGMA journal_mode = WAL');
      await customStatement('PRAGMA busy_timeout = 30000');
    },
  );
}

class DriftDatabaseRepository implements IDatabaseRepository {
  final Drift _db;
  const DriftDatabaseRepository(this._db);

  @override
  Future<T> transaction<T>(Future<T> Function() callback) => _db.transaction(callback);
}
