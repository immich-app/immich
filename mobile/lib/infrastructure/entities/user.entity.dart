import 'package:drift/drift.dart' hide Index;
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class UserEntity extends Table with DriftDefaultsMixin {
  const UserEntity();

  TextColumn get id => text()();
  TextColumn get name => text()();
  TextColumn get email => text()();

  // Profile image
  BoolColumn get hasProfileImage => boolean().withDefault(const Constant(false))();
  DateTimeColumn get profileChangedAt => dateTime().withDefault(currentDateAndTime)();
  IntColumn get avatarColor => intEnum<AvatarColor>().withDefault(const Constant(0))();

  @override
  Set<Column> get primaryKey => {id};
}
