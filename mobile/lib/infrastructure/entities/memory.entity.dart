import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/infrastructure/utils/datetime_clamp.type.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class MemoryEntity extends Table with DriftDefaultsMixin {
  const MemoryEntity();

  TextColumn get id => text()();

  DateTimeColumn get createdAt => customType(clampedDateTime).withDefault(currentDateAndTime)();

  DateTimeColumn get updatedAt => customType(clampedDateTime).withDefault(currentDateAndTime)();

  DateTimeColumn get deletedAt => customType(clampedDateTime).nullable()();

  TextColumn get ownerId => text().references(UserEntity, #id, onDelete: KeyAction.cascade)();

  IntColumn get type => intEnum<MemoryTypeEnum>()();

  TextColumn get data => text()();

  BoolColumn get isSaved => boolean().withDefault(const Constant(false))();

  DateTimeColumn get memoryAt => customType(clampedDateTime)();

  DateTimeColumn get seenAt => customType(clampedDateTime).nullable()();

  DateTimeColumn get showAt => customType(clampedDateTime).nullable()();

  DateTimeColumn get hideAt => customType(clampedDateTime).nullable()();

  @override
  Set<Column> get primaryKey => {id};
}
