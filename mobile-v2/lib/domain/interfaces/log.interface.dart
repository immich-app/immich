import 'dart:async';

import 'package:immich_mobile/domain/models/log.model.dart';

abstract interface class ILogRepository {
  /// Inserts a new log into the DB
  Future<bool> create(LogMessage log);

  /// Bulk insert logs into DB
  Future<bool> createAll(Iterable<LogMessage> log);

  /// Fetches all logs
  Future<List<LogMessage>> getAll();

  /// Clears all logs
  Future<bool> deleteAll();

  /// Truncates the logs to the most recent [limit]. Defaults to recent 250 logs
  Future<void> truncate({int limit = 250});
}
