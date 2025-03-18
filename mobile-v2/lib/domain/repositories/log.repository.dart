import 'dart:async';

import 'package:drift/drift.dart';
import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/entities/log.entity.drift.dart';
import 'package:immich_mobile/domain/interfaces/log.interface.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';

class LogRepository implements ILogRepository {
  final DriftDatabaseRepository _db;

  const LogRepository({required DriftDatabaseRepository db}) : _db = db;

  @override
  Future<List<LogMessage>> getAll() async {
    return await _db.managers.logs
        .orderBy((o) => o.createdAt.desc())
        .map(_toModel)
        .get();
  }

  @override
  Future<void> truncate({int limit = 250}) async {
    final totalCount = await _db.managers.logs.count();
    if (totalCount > limit) {
      final rowsToDelete = totalCount - limit;
      await _db.managers.logs
          .orderBy((o) => o.createdAt.asc())
          .limit(rowsToDelete)
          .delete();
    }
  }

  @override
  Future<bool> create(LogMessage log) async {
    try {
      await _db.logs.insertOne(_toEntity(log));
      return true;
    } catch (e) {
      debugPrint("Error while adding a log to the DB - $e");
      return false;
    }
  }

  @override
  Future<bool> createAll(Iterable<LogMessage> logs) async {
    try {
      await _db.batch((b) {
        b.insertAll(_db.logs, logs.map(_toEntity));
      });
      return true;
    } catch (e) {
      debugPrint("Error while adding a log to the DB - $e");
      return false;
    }
  }

  @override
  Future<bool> deleteAll() async {
    try {
      await _db.logs.deleteAll();
      return true;
    } catch (e) {
      debugPrint("Error while clearning the logs in DB - $e");
      return false;
    }
  }
}

LogsCompanion _toEntity(LogMessage log) {
  return LogsCompanion.insert(
    content: log.content,
    level: log.level,
    createdAt: Value(log.createdAt),
    logger: Value(log.logger),
    error: Value(log.error),
    stack: Value(log.stack),
  );
}

LogMessage _toModel(Log log) {
  return LogMessage(
    content: log.content,
    level: log.level,
    createdAt: log.createdAt,
    logger: log.logger,
    error: log.error,
    stack: log.stack,
  );
}
