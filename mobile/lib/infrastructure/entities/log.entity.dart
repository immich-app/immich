import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';
import 'package:isar/isar.dart';
import 'package:drift/drift.dart';

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

class LoggerMessageEntity extends Table with DriftDefaultsMixin {
  const LoggerMessageEntity();

  IntColumn get id => integer().autoIncrement()();

  TextColumn get message => text()();

  TextColumn get details => text().nullable()();

  IntColumn get level => intEnum<LogLevel>()();

  DateTimeColumn get createdAt => dateTime()();

  TextColumn get context1 => text().nullable()();

  TextColumn get context2 => text().nullable()();
}
