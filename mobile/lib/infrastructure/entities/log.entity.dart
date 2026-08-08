import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/log.model.dart' as domain;
import 'package:immich_mobile/infrastructure/entities/log.entity.drift.dart';
import 'package:immich_mobile/infrastructure/utils/datetime_clamp.type.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class LogMessageEntity extends Table with DriftDefaultsMixin {
  const LogMessageEntity();

  @override
  String get tableName => 'logger_messages';

  @override
  bool get isStrict => false;

  @override
  bool get withoutRowId => false;

  IntColumn get id => integer().autoIncrement()();
  TextColumn get message => text()();
  TextColumn get details => text().nullable()();
  IntColumn get level => intEnum<domain.LogLevel>()();
  DateTimeColumn get createdAt => customType(clampedDateTime)();
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
