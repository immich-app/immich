import 'dart:async';

import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/entities/user.entity.drift.dart';
import 'package:immich_mobile/domain/interfaces/user.interface.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';
import 'package:immich_mobile/utils/mixins/log.mixin.dart';

class UserRepository with LogMixin implements IUserRepository {
  final DriftDatabaseRepository _db;

  const UserRepository({required DriftDatabaseRepository db}) : _db = db;

  @override
  Future<User?> getForId(String userId) async {
    return await _db.managers.user
        .filter((f) => f.id.equals(userId))
        .map(_toModel)
        .getSingleOrNull();
  }

  @override
  Future<bool> upsert(User user) async {
    try {
      await _db.user.insertOnConflictUpdate(
        UserCompanion.insert(
          id: user.id,
          updatedAt: Value(user.updatedAt),
          name: user.name,
          email: user.email,
          isAdmin: Value(user.isAdmin),
          quotaSizeInBytes: Value(user.quotaSizeInBytes),
          quotaUsageInBytes: Value(user.quotaSizeInBytes),
          inTimeline: Value(user.inTimeline),
          profileImagePath: user.profileImagePath,
          memoryEnabled: Value(user.memoryEnabled),
          avatarColor: user.avatarColor,
        ),
      );
      return true;
    } catch (e, s) {
      log.e("Cannot insert User into table - $user", e, s);
      return false;
    }
  }

  @override
  Future<void> deleteAll() async {
    await _db.user.deleteAll();
  }
}

User _toModel(UserData user) {
  return User(
    id: user.id,
    updatedAt: user.updatedAt,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    quotaSizeInBytes: user.quotaSizeInBytes,
    quotaUsageInBytes: user.quotaUsageInBytes,
    inTimeline: user.inTimeline,
    profileImagePath: user.profileImagePath,
    memoryEnabled: user.memoryEnabled,
    avatarColor: user.avatarColor,
  );
}
