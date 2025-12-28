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
import 'package:immich_mobile/infrastructure/entities/remote_asset_cloud_id.entity.dart';
import 'package:immich_mobile/infrastructure/entities/stack.entity.dart';
import 'package:immich_mobile/infrastructure/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/trashed_local_asset.entity.dart';
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
    RemoteAssetCloudIdEntity,
    MemoryEntity,
    MemoryAssetEntity,
    StackEntity,
    PersonEntity,
    AssetFaceEntity,
    StoreEntity,
    TrashedLocalAssetEntity,
  ],
  include: {'package:immich_mobile/infrastructure/entities/merged_asset.drift'},
)
class Drift extends $Drift implements IDatabaseRepository {
  Drift([QueryExecutor? executor])
    : super(executor ?? driftDatabase(name: 'immich', native: const DriftNativeOptions(shareAcrossIsolates: true)));

  Future<void> reset() async {
    // https://github.com/simolus3/drift/commit/bd80a46264b6dd833ef4fd87fffc03f5a832ab41#diff-3f879e03b4a35779344ef16170b9353608dd9c42385f5402ec6035aac4dd8a04R76-R94
    await exclusively(() async {
      // https://stackoverflow.com/a/65743498/25690041
      await customStatement('PRAGMA writable_schema = 1;');
      await customStatement('DELETE FROM sqlite_master;');
      await customStatement('VACUUM;');
      await customStatement('PRAGMA writable_schema = 0;');
      await customStatement('PRAGMA integrity_check');

      await customStatement('PRAGMA user_version = 0');
      await beforeOpen(
        // ignore: invalid_use_of_internal_member
        resolvedEngine.executor,
        OpeningDetails(null, schemaVersion),
      );
      await customStatement('PRAGMA user_version = $schemaVersion');

      // Refresh all stream queries
      notifyUpdates({for (final table in allTables) TableUpdate.onTable(table)});
    });
  }

  @override
  int get schemaVersion => 15;

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
          from10To11: (m, v11) async {
            await m.addColumn(v11.localAlbumAssetEntity, v11.localAlbumAssetEntity.marker_);
          },
          from11To12: (m, v12) async {
            final localToUTCMapping = {
              v12.localAssetEntity: [v12.localAssetEntity.createdAt, v12.localAssetEntity.updatedAt],
              v12.localAlbumEntity: [v12.localAlbumEntity.updatedAt],
            };

            for (final entry in localToUTCMapping.entries) {
              final table = entry.key;
              await m.alterTable(
                TableMigration(
                  table,
                  columnTransformer: {
                    for (final column in entry.value)
                      column: column.modify(const DateTimeModifier.utc()).strftime('%Y-%m-%dT%H:%M:%fZ'),
                  },
                ),
              );
            }
          },
          from12To13: (m, v13) async {
            await m.create(v13.trashedLocalAssetEntity);
            await m.createIndex(v13.idxTrashedLocalAssetChecksum);
            await m.createIndex(v13.idxTrashedLocalAssetAlbum);
          },
          from13To14: (m, v14) async {
            await m.addColumn(v14.localAssetEntity, v14.localAssetEntity.adjustmentTime);
            await m.addColumn(v14.localAssetEntity, v14.localAssetEntity.latitude);
            await m.addColumn(v14.localAssetEntity, v14.localAssetEntity.longitude);
          },
          from14To15: (m, v15) async {
            // Add i_cloud_id to local and remote asset tables
            await m.addColumn(v15.localAssetEntity, v15.localAssetEntity.iCloudId);
            await m.createIndex(v15.idxLocalAssetCloudId);
            await m.createTable(v15.remoteAssetCloudIdEntity);
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
