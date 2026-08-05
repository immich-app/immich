import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/infrastructure/utils/datetime_clamp.type.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_stack_primary_asset_id ON stack_entity (primary_asset_id)')
class StackEntity extends Table with DriftDefaultsMixin {
  const StackEntity();

  TextColumn get id => text()();

  DateTimeColumn get createdAt => customType(clampedDateTime).withDefault(currentDateAndTime)();

  DateTimeColumn get updatedAt => customType(clampedDateTime).withDefault(currentDateAndTime)();

  TextColumn get ownerId => text().references(UserEntity, #id, onDelete: KeyAction.cascade)();

  TextColumn get primaryAssetId => text()();

  @override
  Set<Column> get primaryKey => {id};
}
