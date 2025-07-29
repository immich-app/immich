import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/entities/log.entity.drift.dart';
import 'package:immich_mobile/domain/models/log.model.dart' as domain;

class LogMessageEntity extends Table {
  const LogMessageEntity();

  @override
  String get tableName => 'logger_messages';

  IntColumn get id => integer().autoIncrement()();
  TextColumn get message => text()();
  TextColumn get details => text().nullable()();
  IntColumn get level => intEnum<domain.LogLevel>()();
  DateTimeColumn get createdAt => dateTime()();
  TextColumn get logger => text().nullable()();
  TextColumn get stack => text().nullable()();
}

extension LogMessageEntityDataDomainEx on LogMessageEntityData {
  domain.LogMessage toDto() => domain.LogMessage(
    message: message,
    level: level,
    createdAt: createdAt,
    logger: logger,
    error: details,
    stack: stack,
  );
}
