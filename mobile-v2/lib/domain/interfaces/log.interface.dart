import 'dart:async';

import 'package:immich_mobile/domain/models/log.model.dart';

abstract class ILogRepository {
  /// Fetches all logs
  FutureOr<List<LogMessage>> fetchAll();

  /// Inserts a new log into the DB
  FutureOr<bool> add(LogMessage log);

  /// Bulk insert logs into DB
  FutureOr<bool> addAll(List<LogMessage> log);

  /// Clears all logs
  FutureOr<bool> clear();

  /// Truncates the logs to the most recent [limit]. Defaults to recent 250 logs
  FutureOr<void> truncateLogs({int limit = 250});
}
