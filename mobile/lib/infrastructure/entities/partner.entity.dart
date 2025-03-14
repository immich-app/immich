import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';

class PartnerEntity extends Table {
  const PartnerEntity();

  TextColumn get sharedById =>
      text().references(UserEntity, #id, onDelete: KeyAction.cascade)();

  TextColumn get sharedWithId =>
      text().references(UserEntity, #id, onDelete: KeyAction.cascade)();

  BoolColumn get inTimeline => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {sharedById, sharedWithId};
}
