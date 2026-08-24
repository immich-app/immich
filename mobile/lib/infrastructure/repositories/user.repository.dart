import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/models/user_metadata.model.dart';
import 'package:immich_mobile/infrastructure/entities/auth_user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/mapper.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/user.repository.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/user_metadata.repository.dart';

@DriftAccessor()
class UserRepository extends DatabaseAccessor<Drift> with $UserRepositoryMixin {
  UserRepository(super.attachedDatabase);

  Drift get _db => attachedDatabase;

  Stream<Iterable<User>> getAll() => _db.select(_db.userEntity).map(mapToUser).watch();
}

@DriftAccessor()
class AuthUserRepository extends DatabaseAccessor<Drift> with $AuthUserRepositoryMixin {
  AuthUserRepository(super.attachedDatabase);

  Drift get _db => attachedDatabase;

  Selectable<UserDto?> get _authUserQuery {
    final query = _db.select(_db.authUserEntity).join([
      leftOuterJoin(
        _db.userMetadataEntity,
        _db.userMetadataEntity.userId.equalsExp(_db.authUserEntity.id) &
            _db.userMetadataEntity.key.equalsValue(.preferences),
      ),
    ])..limit(1);

    return query.map((row) {
      final user = row.readTable(_db.authUserEntity);
      final preferences = row.readTableOrNull(_db.userMetadataEntity);
      return user.toDto(preferences != null ? [preferences.toDto()] : null);
    });
  }

  Future<UserDto?> get() => _authUserQuery.getSingleOrNull();

  Stream<UserDto?> watch() => _authUserQuery.watchSingleOrNull();

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
