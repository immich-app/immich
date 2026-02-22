import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

@TableIndex.sql(
  'CREATE INDEX IF NOT EXISTS idx_local_album_asset_album_asset ON local_album_asset_entity (album_id, asset_id)',
)
class LocalAlbumAssetEntity extends Table with DriftDefaultsMixin {
  const LocalAlbumAssetEntity();

  TextColumn get assetId => text().references(LocalAssetEntity, #id, onDelete: KeyAction.cascade)();

  TextColumn get albumId => text().references(LocalAlbumEntity, #id, onDelete: KeyAction.cascade)();

  // Used for mark & sweep
  BoolColumn get marker_ => boolean().nullable()();

  @override
  Set<Column> get primaryKey => {assetId, albumId};
}
