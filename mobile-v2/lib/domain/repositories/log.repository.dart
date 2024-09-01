import 'dart:async';

import 'package:drift/drift.dart';
import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/entities/log.entity.drift.dart';
import 'package:immich_mobile/domain/interfaces/log.interface.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';

class LogDriftRepository implements ILogRepository {
  final DriftDatabaseRepository db;

  const LogDriftRepository(this.db);

  @override
  Future<List<LogMessage>> fetchAll() async {
    return await db.managers.logs.map(_toModel).get();
  }

  @override
  Future<void> truncateLogs({int limit = 250}) async {
    final totalCount = await db.managers.logs.count();
    if (totalCount > limit) {
      final rowsToDelete = totalCount - limit;
      await db.managers.logs
          .orderBy((o) => o.createdAt.desc())
          .limit(rowsToDelete)
          .delete();
    }
  }

  @override
  FutureOr<bool> add(LogMessage log) async {
    try {
      await db.into(db.logs).insert(LogsCompanion.insert(
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
  FutureOr<bool> addAll(List<LogMessage> logs) async {
    try {
      await db.batch((b) {
        b.insertAll(
          db.logs,
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
  FutureOr<bool> clear() async {
    try {
      await db.managers.logs.delete();
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
