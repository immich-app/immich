import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/user_metadata.model.dart';
import 'package:immich_mobile/infrastructure/entities/user_metadata.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftUserMetadataRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftUserMetadataRepository(this._db) : super(_db);

  Future<List<UserMetadata>> getUserMetadata(String userId) {
    final query = _db.userMetadataEntity.select()
      ..where((e) => e.userId.equals(userId));

    return query.map((userMetadata) {
      return userMetadata.toDto();
    }).get();
  }
}

extension on UserMetadataEntityData {
  UserMetadata toDto() => switch (key) {
        UserMetadataKey.onboarding => UserMetadata(
            userId: userId,
            key: key,
            onboarding: Onboarding.fromMap(value),
          ),
        UserMetadataKey.preferences => UserMetadata(
            userId: userId,
            key: key,
            preferences: Preferences.fromMap(value),
          ),
        UserMetadataKey.license => UserMetadata(
            userId: userId,
            key: key,
            license: License.fromMap(value),
          ),
      };
}
