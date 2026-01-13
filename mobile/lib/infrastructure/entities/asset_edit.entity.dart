import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset/asset_edit.model.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class AssetEditEntity extends Table with DriftDefaultsMixin {
  const AssetEditEntity();

  TextColumn get id => text()();

  TextColumn get assetId => text().references(RemoteAssetEntity, #id, onDelete: KeyAction.cascade)();

  IntColumn get action => intEnum<AssetEditAction>()();

  BlobColumn get parameters => blob().map(editParameterConverter)();

  @override
  Set<Column> get primaryKey => {id};
}

final JsonTypeConverter2<Map<String, Object?>, Uint8List, Object?> editParameterConverter = TypeConverter.jsonb(
  fromJson: (json) => json as Map<String, Object?>,
);
