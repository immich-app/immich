import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/user_metadata.model.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class UserMetadataEntity extends Table with DriftDefaultsMixin {
  const UserMetadataEntity();

  TextColumn get userId =>
      text().references(UserEntity, #id, onDelete: KeyAction.cascade)();

  IntColumn get key => intEnum<UserMetadataKey>()();

  BlobColumn get value => blob().map(userMetadataConverter)();

  @override
  Set<Column> get primaryKey => {userId, key};
}

final JsonTypeConverter2<Map<String, Object?>, Uint8List, Object?>
    userMetadataConverter = TypeConverter.jsonb(
  fromJson: (json) => json as Map<String, Object?>,
);
