import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset_edit.model.dart';
import 'package:immich_mobile/infrastructure/entities/asset_edit.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_asset_edit_asset_id ON asset_edit_entity (asset_id)')
class AssetEditEntity extends Table with DriftDefaultsMixin {
  const AssetEditEntity();

  TextColumn get id => text()();

  TextColumn get assetId => text().references(RemoteAssetEntity, #id, onDelete: KeyAction.cascade)();

  IntColumn get action => intEnum<AssetEditAction>()();

  BlobColumn get parameters => blob().map(editParameterConverter)();

  IntColumn get sequence => integer()();

  @override
  Set<Column> get primaryKey => {id};
}

final JsonTypeConverter2<Map<String, Object?>, Uint8List, Object?> editParameterConverter = TypeConverter.jsonb(
  fromJson: (json) => json as Map<String, Object?>,
);

extension AssetEditEntityDataDomainEx on AssetEditEntityData {
  AssetEdit toDto() {
    return AssetEdit(action: action, parameters: parameters);
  }
}
