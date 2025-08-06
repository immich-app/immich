import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';
import 'package:immich_mobile/domain/interfaces/db.interface.dart';
import 'package:immich_mobile/infrastructure/entities/log.entity.dart';

import 'logger_db.repository.drift.dart';

@DriftDatabase(tables: [LogMessageEntity])
class DriftLogger extends $DriftLogger implements IDatabaseRepository {
  DriftLogger([QueryExecutor? executor])
    : super(
        executor ?? driftDatabase(name: 'immich_logs', native: const DriftNativeOptions(shareAcrossIsolates: true)),
      );

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
    beforeOpen: (details) async {
      await customStatement('PRAGMA foreign_keys = ON');
      await customStatement('PRAGMA synchronous = NORMAL');
      await customStatement('PRAGMA journal_mode = WAL');
      await customStatement('PRAGMA busy_timeout = 500');
    },
  );
}
