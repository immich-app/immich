import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/entities/person.entity.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class PersonUserEntity extends Table with DriftDefaultsMixin {
  const PersonUserEntity();

  TextColumn get personId => text().references(PersonEntity, #id, onDelete: KeyAction.cascade)();

  TextColumn get ownerId => text().references(UserEntity, #id, onDelete: KeyAction.cascade)();

  BoolColumn get isFavorite => boolean().withDefault(const Constant(false))();

  BoolColumn get isHidden => boolean().withDefault(const Constant(false))();

  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {personId, ownerId};
}
