import 'package:drift/drift.dart';
import 'package:immich_mobile/data/db/main/table/user/user.dart';
import 'package:immich_mobile/data/db/util/defaults_mixin.dart';

@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_tag_owner_id ON tag_entity (owner_id)')
class TagEntity extends Table with DriftDefaultsMixin {
  const TagEntity();

  TextColumn get id => text()();

  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  TextColumn get ownerId => text().references(UserEntity, #id, onDelete: KeyAction.cascade)();

  TextColumn get parentId => text().nullable()();

  TextColumn get value => text()();

  TextColumn get color => text().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}
