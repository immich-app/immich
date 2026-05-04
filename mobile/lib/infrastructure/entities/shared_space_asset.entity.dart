import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/entities/shared_space.entity.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

@TableIndex.sql(
  'CREATE INDEX IF NOT EXISTS idx_shared_space_asset_space_asset ON shared_space_asset_entity (space_id, asset_id)',
)
@TableIndex.sql(
  'CREATE INDEX IF NOT EXISTS idx_shared_space_asset_asset_space ON shared_space_asset_entity (asset_id, space_id)',
)
class SharedSpaceAssetEntity extends Table with DriftDefaultsMixin {
  const SharedSpaceAssetEntity();

  TextColumn get spaceId => text().references(SharedSpaceEntity, #id, onDelete: KeyAction.cascade)();

  // Intentionally NO references() on assetId — see design doc "Sync ordering"
  // section. The asset row may not yet be locally synced when the join row arrives,
  // and ordering between the two streams is not guaranteed.
  TextColumn get assetId => text()();

  @override
  Set<Column> get primaryKey => {spaceId, assetId};
}
