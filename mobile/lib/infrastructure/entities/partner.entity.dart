import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class PartnerEntity extends Table with DriftDefaultsMixin {
  const PartnerEntity();

  BlobColumn get sharedById =>
      blob().references(UserEntity, #id, onDelete: KeyAction.cascade)();

  BlobColumn get sharedWithId =>
      blob().references(UserEntity, #id, onDelete: KeyAction.cascade)();

  BoolColumn get inTimeline => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {sharedById, sharedWithId};

  @override
  bool get isStrict => true;

  @override
  bool get withoutRowId => true;
}
