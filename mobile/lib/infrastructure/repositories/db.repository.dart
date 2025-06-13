import 'dart:async';

import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';
import 'package:immich_mobile/domain/interfaces/db.interface.dart';
import 'package:immich_mobile/infrastructure/entities/album_user.entity.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_album_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/merged_asset.view.drift.dart';
import 'package:immich_mobile/infrastructure/entities/partner.entity.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/infrastructure/entities/user_metadata.entity.dart';
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
    RemoteExifEntity,
    RemoteAssetEntity,
    RemoteAlbumEntity,
    RemoteAlbumAssetEntity,
    AlbumUserEntity,
  ],
  views: [MergedAssetView],
  include: {
    'package:immich_mobile/infrastructure/entities/merged_asset.view.drift',
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
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
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
