import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/infrastructure/utils/datetime.converter.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class MemoryEntity extends Table with DriftDefaultsMixin {
  const MemoryEntity();

  TextColumn get id => text()();

  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime).map(const DateTimeClampConverter())();

  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime).map(const DateTimeClampConverter())();

  DateTimeColumn get deletedAt => dateTime().nullable().map(const DateTimeClampConverter())();

  TextColumn get ownerId => text().references(UserEntity, #id, onDelete: KeyAction.cascade)();

  IntColumn get type => intEnum<MemoryTypeEnum>()();

  TextColumn get data => text()();

  BoolColumn get isSaved => boolean().withDefault(const Constant(false))();

  DateTimeColumn get memoryAt => dateTime().map(const DateTimeClampConverter())();

  DateTimeColumn get seenAt => dateTime().nullable().map(const DateTimeClampConverter())();

  DateTimeColumn get showAt => dateTime().nullable().map(const DateTimeClampConverter())();

  DateTimeColumn get hideAt => dateTime().nullable().map(const DateTimeClampConverter())();

  @override
  Set<Column> get primaryKey => {id};
}
