import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:isar/isar.dart';

part 'log.entity.g.dart';

@Collection(inheritance: false)
class LoggerMessage {
  final Id id = Isar.autoIncrement;
  final String message;
  final String? details;
  @Enumerated(EnumType.ordinal)
  final LogLevel level;
  final DateTime createdAt;
  final String? context1;
  final String? context2;

  const LoggerMessage({
    required this.message,
    required this.details,
    this.level = LogLevel.info,
    required this.createdAt,
    required this.context1,
    required this.context2,
  });

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
