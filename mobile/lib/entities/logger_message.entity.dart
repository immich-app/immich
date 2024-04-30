// ignore_for_file: constant_identifier_names

import 'package:isar/isar.dart';
import 'package:logging/logging.dart';

part 'logger_message.entity.g.dart';

@Collection(inheritance: false)
class LoggerMessage {
  Id id = Isar.autoIncrement;
  String message;
  String? details;
  @Enumerated(EnumType.ordinal)
  LogLevel level = LogLevel.INFO;
  DateTime createdAt;
  String? context1;
  String? context2;

  LoggerMessage({
    required this.message,
    required this.details,
    required this.level,
    required this.createdAt,
    required this.context1,
    required this.context2,
  });

  @override
  String toString() {
    return 'InAppLoggerMessage(message: $message, level: $level, createdAt: $createdAt)';
  }
}

/// Log levels according to dart logging [Level]
enum LogLevel {
  ALL,
  FINEST,
  FINER,
  FINE,
  CONFIG,
  INFO,
  WARNING,
  SEVERE,
  SHOUT,
  OFF,
}

extension LevelExtension on Level {
  LogLevel toLogLevel() => LogLevel.values[Level.LEVELS.indexOf(this)];
}
