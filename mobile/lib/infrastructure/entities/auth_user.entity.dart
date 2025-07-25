import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/models/user_metadata.model.dart';
import 'package:immich_mobile/infrastructure/entities/auth_user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class AuthUserEntity extends Table with DriftDefaultsMixin {
  const AuthUserEntity();

  TextColumn get id => text()();

  TextColumn get name => text()();

  TextColumn get email => text()();

  DateTimeColumn get deletedAt => dateTime().nullable()();

  IntColumn get avatarColor => intEnum<AvatarColor>().nullable()();

  BoolColumn get isAdmin => boolean().withDefault(const Constant(false))();

  TextColumn get oauthId => text().withDefault(const Constant(''))();

  TextColumn get pinCode => text().nullable()();

  BoolColumn get hasProfileImage => boolean().withDefault(const Constant(false))();

  DateTimeColumn get profileChangedAt => dateTime().withDefault(currentDateAndTime)();

  IntColumn get quotaSizeInBytes => integer().nullable()();

  IntColumn get quotaUsageInBytes => integer().withDefault(const Constant(0))();

  TextColumn get storageLabel => text().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

extension AuthUserEntityDataDomainEx on AuthUserEntityData {
  AuthUser toDto() => AuthUser(
        id: id,
        name: name,
        email: email,
        deletedAt: deletedAt,
        avatarColor: avatarColor,
        isAdmin: isAdmin,
        oauthId: oauthId,
        pinCode: pinCode,
        hasProfileImage: hasProfileImage,
        profileChangedAt: profileChangedAt,
        quotaSizeInBytes: quotaSizeInBytes,
        quotaUsageInBytes: quotaUsageInBytes,
        storageLabel: storageLabel,
      );
}
