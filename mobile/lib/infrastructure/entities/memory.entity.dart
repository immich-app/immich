import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class MemoryEntity extends Table with DriftDefaultsMixin {
  const MemoryEntity();

  TextColumn get id => text()();

  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  DateTimeColumn get deletedAt => dateTime().nullable()();

  TextColumn get ownerId =>
      text().references(UserEntity, #id, onDelete: KeyAction.cascade)();

  IntColumn get type => intEnum<MemoryTypeEnum>()();

  TextColumn get data => text()();

  BoolColumn get isSaved => boolean().withDefault(const Constant(false))();

  DateTimeColumn get memoryAt => dateTime()();

  DateTimeColumn get seenAt => dateTime().nullable()();

  DateTimeColumn get showAt => dateTime().nullable()();

  DateTimeColumn get hideAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}
