import 'dart:async';

import 'package:immich_mobile/domain/models/log.model.dart';

abstract interface class ILogRepository {
  /// Inserts a new log into the DB
  FutureOr<bool> create(LogMessage log);

  /// Bulk insert logs into DB
  FutureOr<bool> createAll(List<LogMessage> log);

  /// Fetches all logs
  FutureOr<List<LogMessage>> getAll();

  /// Clears all logs
  FutureOr<bool> deleteAll();

  /// Truncates the logs to the most recent [limit]. Defaults to recent 250 logs
  FutureOr<void> truncate({int limit = 250});
}
