import 'dart:async';
import 'dart:io';

import 'package:drift/drift.dart';
// ignore: implementation_imports, invalid_use_of_internal_member
import 'package:drift/src/runtime/executor/stream_queries.dart' show StreamQueryStore;
import 'package:drift_sqlite_async/drift_sqlite_async.dart';
import 'package:flutter/foundation.dart';
import 'package:immich_mobile/infrastructure/entities/asset_edit.entity.dart';
import 'package:immich_mobile/infrastructure/entities/asset_face.entity.dart';
import 'package:immich_mobile/infrastructure/entities/asset_ocr.entity.dart';
import 'package:immich_mobile/infrastructure/entities/auth_user.entity.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_album_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/memory.entity.dart';
import 'package:immich_mobile/infrastructure/entities/memory_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/partner.entity.dart';
import 'package:immich_mobile/infrastructure/entities/person.entity.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album_user.entity.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset_cloud_id.entity.dart';
import 'package:immich_mobile/infrastructure/entities/server_deleted_checksum.entity.dart';
import 'package:immich_mobile/infrastructure/entities/settings.entity.dart';
import 'package:immich_mobile/infrastructure/entities/stack.entity.dart';
import 'package:immich_mobile/infrastructure/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/trash_sync.entity.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/infrastructure/entities/user_metadata.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.steps.dart';
import 'package:logging/logging.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqlite3/sqlite3.dart';
import 'package:sqlite3_connection_pool/sqlite3_connection_pool.dart';
import 'package:sqlite_async/native.dart';
import 'package:sqlite_async/sqlite_async.dart';

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
    TrashSyncEntity,
    ServerDeletedChecksumEntity,
    AssetEditEntity,
    SettingsEntity,
    AssetOcrEntity,
  ],
  include: {'package:immich_mobile/infrastructure/entities/merged_asset.drift'},
)
class Drift extends $Drift {
  final SqliteConnectionPool? _updatePool;

  Drift(super.executor) : _updatePool = null;

  Drift.sqlite(SqliteConnection db, SqliteConnectionPool updatePool)
    : _updatePool = updatePool,
      super(DatabaseConnection(SqliteAsyncQueryExecutor(db), streamQueries: _DriftPoolStreamQueries(updatePool)));

  @override
  Future<void> close() async {
    await super.close();
    _updatePool?.close();
  }

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

  Future<void> optimize({bool allTables = false}) async {
    try {
      if (allTables) {
        await customStatement('PRAGMA optimize=0x10002');
      }
      await customStatement('PRAGMA optimize');
    } catch (error) {
      Logger('Drift').fine('Failed to optimize database', error);
    }
  }

  @override
  int get schemaVersion => 32;

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onUpgrade: (m, from, to) async {
      // Run migration steps without foreign keys and re-enable them later
      await customStatement('PRAGMA foreign_keys = OFF');

      try {
        await transaction(
          () => m.runMigrationSteps(
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
                await m.alterTable(
                  TableMigration(
                    v15.trashedLocalAssetEntity,
                    columnTransformer: {v15.trashedLocalAssetEntity.source: const Constant(0)}, // TrashOrigin.localSync
                    newColumns: [v15.trashedLocalAssetEntity.source],
                  ),
                );
              },
              from15To16: (m, v16) async {
                // Add i_cloud_id to local and remote asset tables
                await m.addColumn(v16.localAssetEntity, v16.localAssetEntity.iCloudId);
                await m.createIndex(v16.idxLocalAssetCloudId);
                await m.createTable(v16.remoteAssetCloudIdEntity);
              },
              from16To17: (m, v17) async {
                await m.addColumn(v17.remoteAssetEntity, v17.remoteAssetEntity.isEdited);
              },
              from17To18: (m, v18) async {
                await m.createIndex(v18.idxRemoteAssetCloudId);
              },
              from18To19: (m, v19) async {
                await m.createIndex(v19.idxAssetFacePersonId);
                await m.createIndex(v19.idxAssetFaceAssetId);
                await m.createIndex(v19.idxLocalAlbumAssetAlbumAsset);
                await m.createIndex(v19.idxPartnerSharedWithId);
                await m.createIndex(v19.idxPersonOwnerId);
                await m.createIndex(v19.idxRemoteAlbumOwnerId);
                await m.createIndex(v19.idxRemoteAlbumAssetAlbumAsset);
                await m.createIndex(v19.idxRemoteAssetStackId);
                await m.createIndex(v19.idxRemoteAssetLocalDateTimeDay);
                await m.createIndex(v19.idxRemoteAssetLocalDateTimeMonth);
                await m.createIndex(v19.idxStackPrimaryAssetId);
              },
              from19To20: (m, v20) async {
                await m.addColumn(v20.assetFaceEntity, v20.assetFaceEntity.isVisible);
                await m.addColumn(v20.assetFaceEntity, v20.assetFaceEntity.deletedAt);
              },
              from20To21: (m, v21) async {
                await m.addColumn(v21.localAssetEntity, v21.localAssetEntity.playbackStyle);
                await m.addColumn(v21.trashedLocalAssetEntity, v21.trashedLocalAssetEntity.playbackStyle);
              },
              from21To22: (m, v22) async {
                await m.createTable(v22.assetEditEntity);
                await m.createIndex(v22.idxAssetEditAssetId);
              },
              from22To23: (m, v23) async {
                await m.renameColumn(v23.localAssetEntity, 'duration_in_seconds', v23.localAssetEntity.durationMs);
                await m.renameColumn(v23.remoteAssetEntity, 'duration_in_seconds', v23.remoteAssetEntity.durationMs);
                await m.renameColumn(
                  v23.trashedLocalAssetEntity,
                  'duration_in_seconds',
                  v23.trashedLocalAssetEntity.durationMs,
                );

                await localAssetEntity.update().write(
                  LocalAssetEntityCompanion.custom(durationMs: v23.localAssetEntity.durationMs * const Constant(1000)),
                );
                await remoteAssetEntity.update().write(
                  RemoteAssetEntityCompanion.custom(
                    durationMs: v23.remoteAssetEntity.durationMs * const Constant(1000),
                  ),
                );
                await customStatement('UPDATE trashed_local_asset_entity SET duration_ms = duration_ms * 1000');
              },
              from23To24: (m, v24) async {
                await customStatement('DROP INDEX IF EXISTS idx_remote_album_owner_id');
                await m.alterTable(TableMigration(v24.remoteAlbumEntity));
              },
              from24To25: (m, v25) async {
                await m.createTable(v25.metadata);
                await customStatement('DROP INDEX IF EXISTS idx_remote_asset_owner_checksum');
                await customStatement('DROP INDEX IF EXISTS idx_remote_asset_local_date_time_day');
                await customStatement('DROP INDEX IF EXISTS idx_remote_asset_local_date_time_month');
                await m.createIndex(v25.idxRemoteAssetOwnerVisibilityDeletedCreated);
                await m.createIndex(v25.idxRemoteExifCity);
                await m.createIndex(v25.idxAssetFaceVisiblePerson);
              },
              from25To26: (m, v26) async {
                await m.addColumn(v26.remoteAssetEntity, v26.remoteAssetEntity.uploadedAt);
              },
              from26To27: (m, v27) async {
                await customStatement('ALTER TABLE metadata RENAME TO settings');
              },
              from27To28: (m, v28) async {
                await m.createIndex(v28.idxLocalAssetCreatedAt);
              },
              from28To29: (m, v29) async {
                await m.createTable(v29.assetOcrEntity);
                await m.createIndex(v29.idxAssetOcrAssetId);
              },
              from29To30: (m, v30) async {
                await m.alterTable(TableMigration(v30.settings));
              },
              from30To31: (m, v31) async {
                await m.createIndex(v31.idxRemoteAssetUploaded);
              },
              from31To32: (m, v32) async {
                await m.createTable(v32.trashSync);
                await m.create(v32.idxTrashSyncChecksum);
                await m.createTable(v32.serverDeletedChecksum);
                await m.create(v32.idxRemoteAssetSoftDeletedChecksum);
                await m.deleteTable('trashed_local_asset_entity');
              },
            ),
          ),
        );

        if (kDebugMode) {
          // Fail if the migration broke foreign keys
          final wrongFKs = await customSelect('PRAGMA foreign_key_check').get();
          assert(wrongFKs.isEmpty, '${wrongFKs.map((e) => e.data)}');
        }
      } finally {
        await customStatement('PRAGMA foreign_keys = ON;');
      }

      await optimize();
    },
    beforeOpen: (details) async {
      await customStatement('PRAGMA foreign_keys = ON');
      await customStatement('PRAGMA synchronous = NORMAL');
      await customStatement('PRAGMA journal_mode = WAL');
      await customStatement('PRAGMA busy_timeout = 30000'); // 30s
      await customStatement('PRAGMA cache_size = -32000'); // 32MB
      await customStatement('PRAGMA temp_store = MEMORY');
    },
  );
}

class DriftDatabaseRepository {
  final Drift _db;
  const DriftDatabaseRepository(this._db);

  Future<T> transaction<T>(Future<T> Function() callback) => _db.transaction(callback);

  BaseSelectStatement currentUserIdQuery() => _db.selectOnly(_db.authUserEntity)..addColumns([_db.authUserEntity.id]);
}

// ignore: invalid_use_of_internal_member
final class _DriftPoolStreamQueries extends StreamQueryStore {
  _DriftPoolStreamQueries(this._pool);

  final SqliteConnectionPool _pool;

  @override
  void handleTableUpdates(Set<TableUpdate> updates) {
    if (updates.isEmpty) {
      return;
    }
    _pool.dispatchUpdateNotification([for (final update in updates) update.table]);
  }

  @override
  Stream<Set<TableUpdate>> updatesForSync(TableUpdateQuery query) {
    return _pool.updatedTables
        .map((tables) => {for (final table in tables) TableUpdate(table)})
        .where((updates) => updates.any(query.matches));
  }
}

Future<void> deleteSqliteDatabase({required String name}) async {
  final file = await _databaseFile(name);
  await [
    file.path,
    '${file.path}-wal',
    '${file.path}-shm',
  ].map((path) => File(path).delete().catchError((_) => File(path), test: (e) => e is FileSystemException)).wait;
}

Future<SqliteConnection> openSqliteConnection({required String name}) async {
  return _openImmichDatabase(await _databaseFile(name));
}

Future<(SqliteConnection, SqliteConnectionPool)> openSqliteConnectionWithUpdatePool({required String name}) async {
  final file = await _databaseFile(name);
  final db = _openImmichDatabase(file);
  await db.initialize();
  final updatePool = SqliteConnectionPool.open(
    name: file.path,
    openConnections: () => throw StateError('Pool for "$name" should already be open via sqlite_async'),
  );
  return (db, updatePool);
}

Future<File> _databaseFile(String name) async {
  final dbFolder = await getApplicationDocumentsDirectory();
  return File(p.join(dbFolder.path, '$name.sqlite'));
}

SqliteDatabase _openImmichDatabase(File file) {
  return SqliteDatabase.withFactory(
    ImmichSqliteOpenFactory(
      path: file.path,
      sqliteOptions: const SqliteOptions(
        journalMode: SqliteJournalMode.wal, // PRAGMA journal_mode (writer only)
        synchronous: SqliteSynchronous.normal, // PRAGMA synchronous
        lockTimeout: Duration(seconds: 30), // -> PRAGMA busy_timeout = 30000
      ),
    ),
  );
}

@visibleForTesting
final class ImmichSqliteOpenFactory extends NativeSqliteOpenFactory {
  ImmichSqliteOpenFactory({required super.path, super.sqliteOptions});

  @override
  List<String> pragmaStatements(SqliteOpenOptions options) {
    return [
      ...super.pragmaStatements(options),
      'PRAGMA cache_size = -32000', // 32MB
      'PRAGMA temp_store = MEMORY',
      'PRAGMA foreign_keys = ON',
    ];
  }
}

Future<void> configureSqliteCache() async {
  // Make sqlite3 pick a more suitable location for temporary files - the
  // one from the system may be inaccessible due to sand-boxing.
  final cacheBase = (await getTemporaryDirectory()).path;
  // We can't access /tmp on Android, which sqlite3 would try by default.
  // Explicitly tell it about the correct temporary directory.
  sqlite3.tempDirectory = cacheBase;
}
