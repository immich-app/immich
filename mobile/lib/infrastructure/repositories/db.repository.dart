import 'dart:async';

import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';
import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/interfaces/db.interface.dart';
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
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/infrastructure/entities/user_metadata.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.steps.dart';
import 'package:isar/isar.dart';

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
  ],
  include: {
    'package:immich_mobile/infrastructure/entities/merged_asset.drift',
  },
)
class Drift extends $Drift implements IDatabaseRepository {
  Drift([QueryExecutor? executor])
      : super(
          executor ??
              driftDatabase(
                name: 'immich',
                native: const DriftNativeOptions(shareAcrossIsolates: true),
              ),
        );

  @override
  int get schemaVersion => 3;

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
            ),
          );

          if (kDebugMode) {
            // Fail if the migration broke foreign keys
            final wrongFKs =
                await customSelect('PRAGMA foreign_key_check').get();
            assert(wrongFKs.isEmpty, '${wrongFKs.map((e) => e.data)}');
          }

          await customStatement('PRAGMA foreign_keys = ON;');
        },
        beforeOpen: (details) async {
          await customStatement('PRAGMA foreign_keys = ON');
          await customStatement('PRAGMA synchronous = NORMAL');
          await customStatement('PRAGMA journal_mode = WAL');
        },
      );
}

class DriftDatabaseRepository implements IDatabaseRepository {
  final Drift _db;
  const DriftDatabaseRepository(this._db);

  @override
  Future<T> transaction<T>(Future<T> Function() callback) =>
      _db.transaction(callback);
}
