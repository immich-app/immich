import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

@TableIndex.sql(
  'CREATE INDEX IF NOT EXISTS idx_remote_album_asset_album_asset ON remote_album_asset_entity (album_id, asset_id)',
)
class RemoteAlbumAssetEntity extends Table with DriftDefaultsMixin {
  const RemoteAlbumAssetEntity();

  TextColumn get assetId => text().references(RemoteAssetEntity, #id, onDelete: KeyAction.cascade)();

  TextColumn get albumId => text().references(RemoteAlbumEntity, #id, onDelete: KeyAction.cascade)();

  @override
  Set<Column> get primaryKey => {assetId, albumId};
}
