import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class AuthUserEntity extends Table with DriftDefaultsMixin {
  const AuthUserEntity();

  TextColumn get id => text()();
  TextColumn get name => text()();
  TextColumn get email => text()();
  BoolColumn get isAdmin => boolean().withDefault(const Constant(false))();

  // Profile image
  BoolColumn get hasProfileImage => boolean().withDefault(const Constant(false))();
  DateTimeColumn get profileChangedAt => dateTime().withDefault(currentDateAndTime)();
  IntColumn get avatarColor => intEnum<AvatarColor>()();

  // Quota
  IntColumn get quotaSizeInBytes => integer().withDefault(const Constant(0))();
  IntColumn get quotaUsageInBytes => integer().withDefault(const Constant(0))();

  // Locked Folder
  TextColumn get pinCode => text().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}
