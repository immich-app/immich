import 'package:drift/drift.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart' as entity;
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
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

class DriftUserRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftUserRepository(super.db) : _db = db;

  Future<UserDto?> get(String id) =>
      _db.managers.userEntity.filter((user) => user.id.equals(id)).getSingleOrNull().then((user) => user?.toDto());

  Future<UserDto> upsert(UserDto user) async {
    await _db.userEntity.insertOnConflictUpdate(
      UserEntityCompanion(
        id: Value(user.id),
        isAdmin: Value(user.isAdmin),
        updatedAt: Value(user.updatedAt),
        name: Value(user.name),
        email: Value(user.email),
        hasProfileImage: Value(user.hasProfileImage),
        profileChangedAt: Value(user.profileChangedAt),
      ),
    );
    return user;
  }
}

extension on UserEntityData {
  UserDto toDto() {
    return UserDto(
      id: id,
      email: email,
      name: name,
      isAdmin: isAdmin,
      updatedAt: updatedAt,
      profileChangedAt: profileChangedAt,
      hasProfileImage: hasProfileImage,
    );
  }
}
