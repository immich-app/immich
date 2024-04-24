import 'package:immich_mobile/domain/entities/log.entity.drift.dart';
import 'package:immich_mobile/domain/interfaces/log.interface.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';

class LogDriftRepository implements ILogRepository {
  final DriftDatabaseRepository db;

  const LogDriftRepository(this.db);

  @override
  Future<List<LogMessage>> fetchLogs() async {
    return await db.select(db.logs).map((l) => l.toModel()).get();
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
}

extension _LogToLogMessage on Log {
  LogMessage toModel() {
    return LogMessage(
      id: id,
      content: content,
      createdAt: createdAt,
      level: level,
      error: error,
      logger: logger,
      stack: stack,
    );
  }
}
