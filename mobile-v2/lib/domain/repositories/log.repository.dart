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
  Future<List<LogMessage>> fetchLogs() async {
    return await db.managers.logs.map((l) => l.toModel()).get();
  }

  @override
  Future<void> truncateLogs({int limit = 250}) {
    return db.transaction(() async {
      final totalCount = await db.managers.logs.count();
      if (totalCount > limit) {
        final rowsToDelete = totalCount - limit;
        await db.managers.logs
            .orderBy((o) => o.createdAt.desc())
            .limit(rowsToDelete)
            .delete();
      }
    });
  }

  @override
  FutureOr<bool> add(LogMessage log) async {
    try {
      await db.transaction(() async {
        await db.into(db.logs).insert(LogsCompanion.insert(
              content: log.content,
              level: log.level,
              createdAt: Value(log.createdAt),
              error: Value(log.error),
              logger: Value(log.logger),
              stack: Value(log.stack),
            ));
      });
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

extension _LogToLogMessage on Log {
  LogMessage toModel() {
    return LogMessage(
      content: content,
      createdAt: createdAt,
      level: level,
      error: error,
      logger: logger,
      stack: stack,
    );
  }
}
