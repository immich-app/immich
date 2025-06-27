import 'package:drift/drift.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart';
import 'package:immich_mobile/domain/models/user_metadata.model.dart';

class DriftUserRepository {
  final Drift _db;
  const DriftUserRepository(this._db);

  Future<void> delete(List<String> ids) async {
    await _db.transaction(() async {
      await (_db.delete(_db.userEntity)..where((tbl) => tbl.id.isIn(ids))).go();
    });
  }

  Future<void> deleteAll() async {
    await _db.transaction(() async {
      await _db.delete(_db.userEntity).go();
    });
  }

  Future<List<UserDto>> getAll({SortUserBy? sortBy}) async {
    var query = _db.select(_db.userEntity);

    if (sortBy != null) {
      switch (sortBy) {
        case SortUserBy.id:
          query = query..orderBy([(u) => OrderingTerm.asc(u.id)]);
      }
    }

    final users = await query.get();
    return users.map((u) => _toDto(u)).toList();
  }

  Future<UserDto?> getByUserId(String id) async {
    final user = await (_db.select(_db.userEntity)
          ..where((tbl) => tbl.id.equals(id)))
        .getSingleOrNull();
    return user != null ? _toDto(user) : null;
  }

  Future<List<UserDto?>> getByUserIds(List<String> ids) async {
    final users = await (_db.select(_db.userEntity)
          ..where((tbl) => tbl.id.isIn(ids)))
        .get();

    // Create a map for quick lookup
    final userMap = {for (var user in users) user.id: _toDto(user)};

    // Return results in the same order as input ids
    return ids.map((id) => userMap[id]).toList();
  }

  Future<bool> insert(UserDto user) async {
    await _db.transaction(() async {
      await _db.into(_db.userEntity).insertOnConflictUpdate(_fromDto(user));
    });
    return true;
  }

  Future<UserDto> update(UserDto user) async {
    await _db.transaction(() async {
      await _db.into(_db.userEntity).insertOnConflictUpdate(_fromDto(user));
    });
    return user;
  }

  Future<bool> updateAll(List<UserDto> users) async {
    await _db.transaction(() async {
      await _db.batch((batch) {
        for (final user in users) {
          batch.insert(_db.userEntity, _fromDto(user),
              mode: InsertMode.insertOrReplace);
        }
      });
    });
    return true;
  }

  UserDto _toDto(UserEntityData entity) {
    return UserDto(
      id: entity.id,
      updatedAt: entity.updatedAt,
      email: entity.email,
      name: entity.name,
      isAdmin: entity.isAdmin,
      profileImagePath: entity.profileImagePath ?? '',
      // Note: These fields are not in the current UserEntity table but are in UserDto
      // You may need to add them to the table or provide defaults
      isPartnerSharedBy: false,
      isPartnerSharedWith: false,
      avatarColor: AvatarColor.primary,
      memoryEnabled: true,
      inTimeline: false,
      quotaUsageInBytes: entity.quotaUsageInBytes,
      quotaSizeInBytes: entity.quotaSizeInBytes ?? 0,
    );
  }

  UserEntityCompanion _fromDto(UserDto dto) {
    return UserEntityCompanion(
      id: Value(dto.id),
      name: Value(dto.name),
      isAdmin: Value(dto.isAdmin),
      email: Value(dto.email),
      profileImagePath: Value.absentIfNull(
          dto.profileImagePath?.isEmpty == true ? null : dto.profileImagePath),
      updatedAt: Value(dto.updatedAt),
      quotaSizeInBytes: Value.absentIfNull(
          dto.quotaSizeInBytes == 0 ? null : dto.quotaSizeInBytes),
      quotaUsageInBytes: Value(dto.quotaUsageInBytes),
    );
  }
}
