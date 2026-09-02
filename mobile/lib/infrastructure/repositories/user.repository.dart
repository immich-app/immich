import 'package:drift/drift.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/data/db/main/table/user/auth_user.drift.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/models/user_metadata.model.dart';
import 'package:immich_mobile/infrastructure/mapper.dart';
import 'package:immich_mobile/infrastructure/repositories/user.repository.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/user_metadata.repository.dart';

@DriftAccessor()
class UserRepository extends DatabaseAccessor<Drift> with $UserRepositoryMixin {
  UserRepository(super.attachedDatabase);

  Drift get _db => attachedDatabase;

  Stream<Iterable<User>> getAll() => _db.select(_db.userEntity).map(mapToUser).watch();

  Stream<User?> watch(String id) =>
      (_db.select(_db.userEntity)..where((u) => u.id.equals(id))).map(mapToUser).watchSingleOrNull();
}

@DriftAccessor()
class AuthUserRepository extends DatabaseAccessor<Drift> with $AuthUserRepositoryMixin {
  AuthUserRepository(super.attachedDatabase);

  Drift get _db => attachedDatabase;

  Future<UserDto?> get(String id) async {
    final user = await _db.managers.authUserEntity.filter((user) => user.id.equals(id)).getSingleOrNull();

    if (user == null) {
      return null;
    }

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
      updatedAt: profileChangedAt,
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
