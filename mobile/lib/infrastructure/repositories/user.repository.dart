import 'package:drift/drift.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/models/user_metadata.model.dart';
import 'package:immich_mobile/infrastructure/entities/auth_user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart' as entity;
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/user_metadata.repository.dart';
import 'package:isar/isar.dart';

class IsarUserRepository extends IsarDatabaseRepository {
  final Isar _db;
  const IsarUserRepository(super.db) : _db = db;

  Future<void> delete(List<String> ids) async {
    await transaction(() async {
      await _db.users.deleteAllById(ids);
    });
  }

  Future<void> deleteAll() async {
    await transaction(() async {
      await _db.users.clear();
    });
  }

  Future<List<UserDto>> getAll({SortUserBy? sortBy}) async {
    return (await _db.users
            .where()
            .optional(
              sortBy != null,
              (query) => switch (sortBy!) {
                SortUserBy.id => query.sortById(),
              },
            )
            .findAll())
        .map((u) => u.toDto())
        .toList();
  }

  Future<UserDto?> getByUserId(String id) async {
    return (await _db.users.getById(id))?.toDto();
  }

  Future<List<UserDto?>> getByUserIds(List<String> ids) async {
    return (await _db.users.getAllById(ids)).map((u) => u?.toDto()).toList();
  }

  Future<bool> insert(UserDto user) async {
    await transaction(() async {
      await _db.users.put(entity.User.fromDto(user));
    });
    return true;
  }

  Future<UserDto> update(UserDto user) async {
    await transaction(() async {
      await _db.users.put(entity.User.fromDto(user));
    });
    return user;
  }

  Future<bool> updateAll(List<UserDto> users) async {
    await transaction(() async {
      await _db.users.putAll(users.map(entity.User.fromDto).toList());
    });
    return true;
  }
}

class DriftAuthUserRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftAuthUserRepository(super.db) : _db = db;

  Future<UserDto?> get(String id) async {
    final user = await _db.managers.authUserEntity.filter((user) => user.id.equals(id)).getSingleOrNull();

    if (user == null) return null;

    final query = _db.userMetadataEntity.select()..where((e) => e.userId.equals(id));
    final metadata = await query.map((row) => row.toDto()).get();

    return user.toDto(metadata);
  }

  Future<UserDto> upsert(UserDto user) async {
    await _db.authUserEntity.insertOnConflictUpdate(
      AuthUserEntityCompanion(
        id: Value(user.id),
        name: Value(user.name),
        email: Value(user.email),
        hasProfileImage: Value(user.hasProfileImage),
        profileChangedAt: Value(user.profileChangedAt),
        isAdmin: Value(user.isAdmin),
        quotaSizeInBytes: Value(user.quotaSizeInBytes),
        quotaUsageInBytes: Value(user.quotaUsageInBytes),
        avatarColor: Value(user.avatarColor),
      ),
    );
    return user;
  }
}

extension on AuthUserEntityData {
  UserDto toDto([List<UserMetadata>? metadata]) {
    bool memoryEnabled = true;

    if (metadata != null) {
      for (final meta in metadata) {
        if (meta.key == UserMetadataKey.preferences && meta.preferences != null) {
          memoryEnabled = meta.preferences?.memoriesEnabled ?? true;
        }
      }
    }

    return UserDto(
      id: id,
      email: email,
      name: name,
      profileChangedAt: profileChangedAt,
      hasProfileImage: hasProfileImage,
      avatarColor: avatarColor,
      memoryEnabled: memoryEnabled,
      isAdmin: isAdmin,
      quotaSizeInBytes: quotaSizeInBytes,
      quotaUsageInBytes: quotaUsageInBytes,
    );
  }
}
