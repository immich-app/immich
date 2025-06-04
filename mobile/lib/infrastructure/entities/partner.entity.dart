import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class PartnerEntity extends Table with DriftDefaultsMixin {
  const PartnerEntity();

  TextColumn get sharedById =>
      text().references(UserEntity, #id, onDelete: KeyAction.cascade)();

  TextColumn get sharedWithId =>
      text().references(UserEntity, #id, onDelete: KeyAction.cascade)();

  BoolColumn get inTimeline => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {sharedById, sharedWithId};
}
