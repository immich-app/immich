import 'package:drift/drift.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/data/db/main/table/user/metadata.drift.dart';
import 'package:immich_mobile/domain/models/user_metadata.model.dart';

@DriftAccessor()
class UserMetadataRepository extends DatabaseAccessor<Drift> {
  UserMetadataRepository(super.attachedDatabase);

  Drift get _db => attachedDatabase;

  Future<List<UserMetadata>> getUserMetadata(String userId) {
    final query = _db.userMetadataEntity.select()..where((e) => e.userId.equals(userId));

    return query.map((userMetadata) {
      return userMetadata.toDto();
    }).get();
  }
}

extension UserMetadataDataExtension on UserMetadataEntityData {
  UserMetadata toDto() => switch (key) {
    UserMetadataKey.onboarding => UserMetadata(userId: userId, key: key, onboarding: Onboarding.fromMap(value)),
    UserMetadataKey.preferences => UserMetadata(userId: userId, key: key, preferences: Preferences.fromMap(value)),
    UserMetadataKey.license => UserMetadata(userId: userId, key: key, license: License.fromMap(value)),
  };
}
