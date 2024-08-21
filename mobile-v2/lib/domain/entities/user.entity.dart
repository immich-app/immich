import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/user.model.dart';

class User extends Table {
  const User();

  TextColumn get id => text()();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();
  TextColumn get name => text()();
  TextColumn get email => text()();
  BoolColumn get isAdmin => boolean().withDefault(const Constant(false))();
  // Quota
  IntColumn get quotaSizeInBytes => integer().withDefault(const Constant(0))();
  IntColumn get quotaUsageInBytes => integer().withDefault(const Constant(0))();
  // Sharing
  BoolColumn get inTimeline => boolean().withDefault(const Constant(false))();
  // User prefs
  TextColumn get profileImagePath => text()();
  BoolColumn get memoryEnabled => boolean().withDefault(const Constant(true))();
  IntColumn get avatarColor => intEnum<UserAvatarColor>()();

  @override
  Set<Column> get primaryKey => {id};
}
