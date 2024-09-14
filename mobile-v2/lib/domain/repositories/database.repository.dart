import 'package:drift/drift.dart';
// ignore: depend_on_referenced_packages
import 'package:drift_dev/api/migrations.dart';
import 'package:drift_flutter/drift_flutter.dart';
import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/entities/album.entity.dart';
import 'package:immich_mobile/domain/entities/asset.entity.dart';
import 'package:immich_mobile/domain/entities/log.entity.dart';
import 'package:immich_mobile/domain/entities/store.entity.dart';
import 'package:immich_mobile/domain/entities/user.entity.dart';

import 'database.repository.drift.dart';

@DriftDatabase(tables: [Logs, Store, LocalAlbum, Asset, User])
class DriftDatabaseRepository extends $DriftDatabaseRepository {
  DriftDatabaseRepository([QueryExecutor? executor])
      : super(executor ??
            driftDatabase(
              name: 'db',
              native: const DriftNativeOptions(shareAcrossIsolates: true),
            ));

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) => m.createAll(),
        beforeOpen: (details) async {
          if (kDebugMode) {
            await validateDatabaseSchema();
          }

          await customStatement('PRAGMA journal_mode = WAL');
          await customStatement('PRAGMA foreign_keys = ON');
        },
        // ignore: no-empty-block
        onUpgrade: (m, from, to) async {},
      );
}
