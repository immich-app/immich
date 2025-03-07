import 'dart:async';

import 'package:immich_mobile/domain/interfaces/db.interface.dart';
import 'package:immich_mobile/domain/models/log.model.dart';

abstract interface class ILogRepository implements IDatabaseRepository {
  Future<bool> insert(LogMessage log);

  Future<bool> insertAll(Iterable<LogMessage> logs);

  Future<List<LogMessage>> getAll();

  Future<bool> deleteAll();

  /// Truncates the logs to the most recent [limit]. Defaults to recent 250 logs
  Future<void> truncate({int limit = 250});
}
