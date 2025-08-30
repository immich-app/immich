import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset/asset_metadata.model.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class RemoteAssetMetadataEntity extends Table with DriftDefaultsMixin {
  const RemoteAssetMetadataEntity();

  TextColumn get assetId => text().references(RemoteAssetEntity, #id, onDelete: KeyAction.cascade)();

  TextColumn get key => text().map(const RemoteAssetMetadataKeyConverter())();

  BlobColumn get value => blob().map(assetMetadataConverter)();

  @override
  Set<Column> get primaryKey => {assetId, key};
}

class RemoteAssetMetadataKeyConverter extends TypeConverter<RemoteAssetMetadataKey, String> {
  const RemoteAssetMetadataKeyConverter();

  @override
  RemoteAssetMetadataKey fromSql(String fromDb) => RemoteAssetMetadataKey.fromKey(fromDb);

  @override
  String toSql(RemoteAssetMetadataKey value) => value.key;
}

final JsonTypeConverter2<Map<String, Object?>, Uint8List, Object?> assetMetadataConverter = TypeConverter.jsonb(
  fromJson: (json) => json as Map<String, Object?>,
);
