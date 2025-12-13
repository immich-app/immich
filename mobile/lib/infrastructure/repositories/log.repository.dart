import 'package:drift/drift.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/infrastructure/entities/log.entity.dart';
import 'package:immich_mobile/infrastructure/entities/log.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/logger_db.repository.dart';

class LogRepository {
  final DriftLogger _db;
  const LogRepository(this._db);

  Future<bool> deleteAll() async {
    await _db.logMessageEntity.deleteAll();
    return true;
  }

  Future<List<LogMessage>> getAll({int limit = 250}) async {
    final query = _db.logMessageEntity.select()
      ..orderBy([(row) => OrderingTerm.desc(row.createdAt)])
      ..limit(limit);

    return query.map((log) => log.toDto()).get();
  }

  LogMessageEntityCompanion _toEntityCompanion(LogMessage log) {
    return LogMessageEntityCompanion.insert(
      message: log.message,
      level: log.level,
      createdAt: log.createdAt,
      logger: Value(log.logger),
      details: Value(log.error),
      stack: Value(log.stack),
    );
  }

  Future<bool> insert(LogMessage log) async {
    final logEntity = _toEntityCompanion(log);

    try {
      await _db.logMessageEntity.insertOne(logEntity);
    } catch (e) {
      return false;
    }

    return true;
  }

  Future<bool> insertAll(Iterable<LogMessage> logs) async {
    final logEntities = logs.map(_toEntityCompanion).toList();
    await _db.logMessageEntity.insertAll(logEntities);

    return true;
  }

  Future<void> deleteByLogger(String logger) async {
    await _db.logMessageEntity.deleteWhere((row) => row.logger.equals(logger));
  }

  Stream<List<LogMessage>> watchMessages(String logger) {
    final query = _db.logMessageEntity.select()
      ..orderBy([(row) => OrderingTerm.desc(row.createdAt)])
      ..where((row) => row.logger.equals(logger));

    return query.watch().map((rows) => rows.map((row) => row.toDto()).toList());
  }

  Future<void> truncate({int limit = kLogTruncateLimit}) async {
    final totalCount = await _db.managers.logMessageEntity.count();
    if (totalCount > limit) {
      final rowsToDelete = totalCount - limit;

      await _db.managers.logMessageEntity.orderBy((o) => o.createdAt.asc()).limit(rowsToDelete).delete();
    }
  }
}
