import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/interfaces/user.interface.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart'
    as entity;
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:isar/isar.dart';

class IsarUserRepository extends IsarDatabaseRepository
    implements IUserRepository {
  final Isar _db;
  const IsarUserRepository(super.db) : _db = db;

  @override
  Future<void> delete(List<int> ids) async {
    await transaction(() async {
      await _db.users.deleteAll(ids);
    });
  }

  @override
  Future<void> deleteAll() async {
    await transaction(() async {
      await _db.users.clear();
    });
  }

  @override
  Future<User?> get(int id) async {
    return (await _db.users.get(id))?.toDto();
  }

  @override
  Future<List<User>> getAll({SortUserBy? sortBy}) async {
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

  @override
  Future<User?> getByUserId(String id) async {
    return (await _db.users.getById(id))?.toDto();
  }

  @override
  Future<List<User?>> getByUserIds(List<String> ids) async {
    return (await _db.users.getAllById(ids)).map((u) => u?.toDto()).toList();
  }

  @override
  Future<bool> insert(User user) async {
    await transaction(() async {
      await _db.users.put(entity.User.fromDto(user));
    });
    return true;
  }

  @override
  Future<User> update(User user) async {
    await transaction(() async {
      await _db.users.put(entity.User.fromDto(user));
    });
    return user;
  }

  @override
  Future<bool> updateAll(List<User> users) async {
    await transaction(() async {
      await _db.users.putAll(users.map(entity.User.fromDto).toList());
    });
    return true;
  }
}

class DriftUserRepository extends DriftDatabaseRepository
    implements IUserRepository {
  final Drift _db;
  const DriftUserRepository(this._db) : super(_db);

  @override
  Future<void> delete(List<int> ids) {
    return _db.managers.userEntity.filter((row) => row.id.isIn(ids)).delete();
  }

  @override
  Future<void> deleteAll() {
    return _db.managers.userEntity.delete();
  }

  @override
  Future<User?> get(int id) {
    return _db.managers.userEntity
        .filter((row) => row.id.equals(id))
        .getSingleOrNull();
  }

  @override
  Future<List<User>> getAll({SortUserBy? sortBy}) async {
    final query = _db.userEntity.select();
    if (sortBy != null) {
      query.orderBy([(u) => OrderingTerm(expression: u.id)]);
    }
    return await query.get();
  }

  @override
  Future<User?> getByUserId(String id) {
    return _db.managers.userEntity
        .filter((row) => row.uid.equals(id))
        .getSingleOrNull();
  }

  @override
  Future<List<User?>> getByUserIds(List<String> ids) {
    return _db.managers.userEntity.filter((row) => row.uid.isIn(ids)).get();
  }

  @override
  Future<bool> insert(User user) async {
    return await _db.userEntity.insertOnConflictUpdate(user.toCompanion()) == 1;
  }

  @override
  Future<User> update(User user) {
    return _db.userEntity.insertReturning(
      user.toCompanion(),
      onConflict: DoUpdate((_) => user.toCompanion()),
    );
  }

  @override
  Future<bool> updateAll(List<User> users) async {
    await _db.batch((batch) {
      final rows = users.map((u) => u.toCompanion());
      for (final row in rows) {
        batch.insert(_db.userEntity, row, onConflict: DoUpdate((_) => row));
      }
    });

    return true;
  }
}

extension on User {
  UserEntityCompanion toCompanion() {
    return UserEntityCompanion(
      id: Value(id),
      uid: Value(uid),
      updatedAt: Value(updatedAt),
      name: Value(name),
      email: Value(email),
      isAdmin: Value(isAdmin),
      quotaSizeInBytes: Value(quotaSizeInBytes),
      quotaUsageInBytes: Value(quotaUsageInBytes),
      isPartnerSharedBy: Value(isPartnerSharedBy),
      isPartnerSharedWith: Value(isPartnerSharedWith),
      inTimeline: Value(inTimeline),
      profileImagePath: Value(profileImagePath ?? ""),
      memoryEnabled: Value(memoryEnabled),
      avatarColor: Value(avatarColor),
    );
  }
}
