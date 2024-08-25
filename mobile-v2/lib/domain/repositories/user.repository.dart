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
  FutureOr<User?> getUser(String userId) async {
    return await db.managers.user
        .filter((f) => f.id.equals(userId))
        .map((u) => u.toModel())
        .getSingleOrNull();
  }

  @override
  FutureOr<bool> insertUser(User user) async {
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

extension _UserDataToUser on UserData {
  User toModel() {
    return User(
      id: id,
      email: email,
      avatarColor: avatarColor,
      inTimeline: inTimeline,
      isAdmin: isAdmin,
      memoryEnabled: memoryEnabled,
      name: name,
      profileImagePath: profileImagePath,
      quotaSizeInBytes: quotaSizeInBytes,
      quotaUsageInBytes: quotaUsageInBytes,
      updatedAt: updatedAt,
    );
  }
}
