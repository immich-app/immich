import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:isar/isar.dart';

part 'log.entity.g.dart';

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
    return 'LoggerMessage(message: $message, level: $level, createdAt: $createdAt)';
  }

  LogMessage toDto() {
    return LogMessage(
      message: message,
      level: level,
      createdAt: createdAt,
      logger: context1,
      error: details,
      stack: context2,
    );
  }

  static LoggerMessage fromDto(LogMessage log) {
    return LoggerMessage(
      message: log.message,
      details: log.error,
      level: log.level,
      createdAt: log.createdAt,
      context1: log.logger,
      context2: log.stack,
    );
  }
}
