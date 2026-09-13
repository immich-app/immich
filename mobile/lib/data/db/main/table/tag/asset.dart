import 'package:drift/drift.dart';
import 'package:immich_mobile/data/db/main/table/remote/asset.dart';
import 'package:immich_mobile/data/db/main/table/tag/tag.dart';
import 'package:immich_mobile/data/db/util/defaults_mixin.dart';

@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_tag_asset_tag_asset ON tag_asset_entity (tag_id, asset_id)')
class TagAssetEntity extends Table with DriftDefaultsMixin {
  const TagAssetEntity();

  TextColumn get assetId => text().references(RemoteAssetEntity, #id, onDelete: KeyAction.cascade)();

  TextColumn get tagId => text().references(TagEntity, #id, onDelete: KeyAction.cascade)();

  @override
  Set<Column> get primaryKey => {assetId, tagId};
}
