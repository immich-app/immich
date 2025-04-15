import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/user_metadata.model.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class UserMetadataEntity extends Table with DriftDefaultsMixin {
  const UserMetadataEntity();

  BlobColumn get userId =>
      blob().references(UserEntity, #id, onDelete: KeyAction.cascade)();
  TextColumn get preferences => text().map(userPreferenceConverter)();

  @override
  Set<Column> get primaryKey => {userId};
}

final JsonTypeConverter2<UserPreferences, String, Object?>
    userPreferenceConverter = TypeConverter.json2(
  fromJson: (json) => UserPreferences.fromMap(json as Map<String, Object?>),
  toJson: (pref) => pref.toMap(),
);
