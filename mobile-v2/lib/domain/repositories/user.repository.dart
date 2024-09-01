import 'dart:async';

import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/entities/user.entity.drift.dart';
import 'package:immich_mobile/domain/interfaces/user.interface.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';
import 'package:immich_mobile/utils/mixins/log_context.mixin.dart';

class UserDriftRepository with LogContext implements IUserRepository {
  final DriftDatabaseRepository db;

  const UserDriftRepository(this.db);

  @override
  FutureOr<User?> fetch(String userId) async {
    return await db.managers.user
        .filter((f) => f.id.equals(userId))
        .map(_toModel)
        .getSingleOrNull();
  }

  @override
  FutureOr<bool> add(User user) async {
    try {
      await db.into(db.user).insertOnConflictUpdate(
            UserCompanion.insert(
              id: user.id,
              name: user.name,
              email: user.email,
              profileImagePath: user.profileImagePath,
              avatarColor: user.avatarColor,
              inTimeline: Value(user.inTimeline),
              isAdmin: Value(user.isAdmin),
              memoryEnabled: Value(user.memoryEnabled),
              quotaSizeInBytes: Value(user.quotaSizeInBytes),
              quotaUsageInBytes: Value(user.quotaSizeInBytes),
              updatedAt: Value(user.updatedAt),
            ),
          );
      return true;
    } catch (e, s) {
      log.severe("Cannot insert User into table - $user", e, s);
      return false;
    }
  }
}

User _toModel(UserData user) {
  return User(
    id: user.id,
    email: user.email,
    avatarColor: user.avatarColor,
    inTimeline: user.inTimeline,
    isAdmin: user.isAdmin,
    memoryEnabled: user.memoryEnabled,
    name: user.name,
    profileImagePath: user.profileImagePath,
    quotaSizeInBytes: user.quotaSizeInBytes,
    quotaUsageInBytes: user.quotaUsageInBytes,
    updatedAt: user.updatedAt,
  );
}
