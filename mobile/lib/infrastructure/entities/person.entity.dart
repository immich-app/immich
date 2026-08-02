import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/infrastructure/utils/datetime.converter.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_person_owner_id ON person_entity (owner_id)')
class PersonEntity extends Table with DriftDefaultsMixin {
  const PersonEntity();

  TextColumn get id => text()();

  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime).map(const DateTimeClampConverter())();

  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime).map(const DateTimeClampConverter())();

  TextColumn get ownerId => text().references(UserEntity, #id, onDelete: KeyAction.cascade)();

  TextColumn get name => text()();

  TextColumn get faceAssetId => text().nullable()();

  BoolColumn get isFavorite => boolean()();

  BoolColumn get isHidden => boolean()();

  TextColumn get color => text().nullable()();

  DateTimeColumn get birthDate => dateTime().nullable().map(const DateTimeClampConverter())();

  @override
  Set<Column> get primaryKey => {id};
}
