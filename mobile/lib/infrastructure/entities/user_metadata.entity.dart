import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/user_metadata.model.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';

class UserMetadataEntity extends Table {
  const UserMetadataEntity();

  BlobColumn get userId =>
      blob().references(UserEntity, #id, onDelete: KeyAction.cascade)();
  TextColumn get preferences => text().map(userPreferenceConverter)();

  @override
  Set<Column> get primaryKey => {userId};

  @override
  bool get isStrict => true;

  @override
  bool get withoutRowId => true;
}

final JsonTypeConverter2<UserPreferences, String, Object?>
    userPreferenceConverter = TypeConverter.json2(
  fromJson: (json) => UserPreferences.fromMap(json as Map<String, Object?>),
  toJson: (pref) => pref.toMap(),
);
