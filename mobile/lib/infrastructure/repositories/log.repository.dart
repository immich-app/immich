import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/infrastructure/entities/log.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

final driftLogRepositoryProvider = Provider<LogRepository>(
  (ref) => LogRepository(ref.watch(driftProvider)),
);

class LogRepository {
  final Drift _db;

  const LogRepository(this._db);

  Future<bool> deleteAll() async {
    await _db.transaction(() async {
      await _db.delete(_db.loggerMessageEntity).go();
    });
    return true;
  }

  Future<List<LogMessage>> getAll() async {
    final query = _db.select(_db.loggerMessageEntity)
      ..orderBy([(t) => OrderingTerm.desc(t.createdAt)]);
    final results = await query.get();
    return results
        .map(
          (row) => LogMessage(
            message: row.message,
            level: row.level,
            createdAt: row.createdAt,
            logger: row.context1,
            error: row.details,
            stack: row.context2,
          ),
        )
        .toList();
  }

  Future<bool> insert(LogMessage log) async {
    await _db.transaction(() async {
      await _db.into(_db.loggerMessageEntity).insert(
            LoggerMessageEntityCompanion.insert(
              id: 0, // Will be auto-incremented by the database
              message: log.message,
              details: Value(log.error),
              level: log.level,
              createdAt: log.createdAt,
              context1: Value(log.logger),
              context2: Value(log.stack),
            ),
          );
    });
    return true;
  }

  Future<bool> insertAll(Iterable<LogMessage> logs) async {
    await _db.transaction(() async {
      for (final log in logs) {
        await _db.into(_db.loggerMessageEntity).insert(
              LoggerMessageEntityCompanion.insert(
                id: 0, // Will be auto-incremented by the database
                message: log.message,
                details: Value(log.error),
                level: log.level,
                createdAt: log.createdAt,
                context1: Value(log.logger),
                context2: Value(log.stack),
              ),
            );
      }
    });
    return true;
  }

  Future<void> truncate({int limit = 250}) async {
    await _db.transaction(() async {
      final countQuery = _db.selectOnly(_db.loggerMessageEntity)
        ..addColumns([_db.loggerMessageEntity.id.count()]);
      final countResult = await countQuery.getSingle();
      final count = countResult.read(_db.loggerMessageEntity.id.count()) ?? 0;

      if (count <= limit) return;

      final toRemove = count - limit;
      final oldestIds = await (_db.select(_db.loggerMessageEntity)
            ..orderBy([(t) => OrderingTerm.asc(t.createdAt)])
            ..limit(toRemove))
          .get();

      final idsToDelete = oldestIds.map((row) => row.id).toList();
      await (_db.delete(_db.loggerMessageEntity)
            ..where((tbl) => tbl.id.isIn(idsToDelete)))
          .go();
    });
  }
}
