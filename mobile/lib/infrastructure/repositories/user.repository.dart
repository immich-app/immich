import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/models/user_metadata.model.dart';
import 'package:immich_mobile/infrastructure/entities/auth_user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/mapper.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/user_metadata.repository.dart';

class UserRepository {
  final Drift _db;
  const UserRepository(this._db);

  Stream<Iterable<User>> getAll() => _db.select(_db.userEntity).map(mapToUser).watch();
}

class DriftAuthUserRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftAuthUserRepository(super.db) : _db = db;

  Selectable<UserDto?> get _authUserQuery => (_db.authUserEntity.select()..limit(1)).asyncMap(_toDto);

  Future<UserDto?> get() => _authUserQuery.getSingleOrNull();

  Stream<UserDto?> watch() => _authUserQuery.watchSingleOrNull();

  Future<UserDto> _toDto(AuthUserEntityData user) async {
    final query = _db.userMetadataEntity.select()..where((e) => e.userId.equals(user.id));
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
