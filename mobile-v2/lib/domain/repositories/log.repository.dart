import 'dart:async';

import 'package:drift/drift.dart';
import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/entities/log.entity.drift.dart';
import 'package:immich_mobile/domain/interfaces/log.interface.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';

class LogDriftRepository implements ILogRepository {
  final DriftDatabaseRepository _db;

  const LogDriftRepository(this._db);

  @override
  Future<List<LogMessage>> getAll() async {
    return await _db.managers.logs.map(_toModel).get();
  }

  @override
  Future<void> truncate({int limit = 250}) async {
    final totalCount = await _db.managers.logs.count();
    if (totalCount > limit) {
      final rowsToDelete = totalCount - limit;
      await _db.managers.logs
          .orderBy((o) => o.createdAt.desc())
          .limit(rowsToDelete)
          .delete();
    }
  }

  @override
  FutureOr<bool> create(LogMessage log) async {
    try {
      await _db.into(_db.logs).insert(LogsCompanion.insert(
            content: log.content,
            level: log.level,
            createdAt: Value(log.createdAt),
            error: Value(log.error),
            logger: Value(log.logger),
            stack: Value(log.stack),
          ));
      return true;
    } catch (e) {
      debugPrint("Error while adding a log to the DB - $e");
      return false;
    }
  }

  @override
  FutureOr<bool> createAll(List<LogMessage> logs) async {
    try {
      await _db.batch((b) {
        b.insertAll(
          _db.logs,
          logs.map((log) => LogsCompanion.insert(
                content: log.content,
                level: log.level,
                createdAt: Value(log.createdAt),
                error: Value(log.error),
                logger: Value(log.logger),
                stack: Value(log.stack),
              )),
        );
      });
      return true;
    } catch (e) {
      debugPrint("Error while adding a log to the DB - $e");
      return false;
    }
  }

  @override
  FutureOr<bool> deleteAll() async {
    try {
      await _db.managers.logs.delete();
      return true;
    } catch (e) {
      debugPrint("Error while clearning the logs in DB - $e");
      return false;
    }
  }
}

LogMessage _toModel(Log log) {
  return LogMessage(
    content: log.content,
    createdAt: log.createdAt,
    level: log.level,
    error: log.error,
    logger: log.logger,
    stack: log.stack,
  );
}
