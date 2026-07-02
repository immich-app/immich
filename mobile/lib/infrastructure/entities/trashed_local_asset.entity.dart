import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/trashed_local_asset.entity.drift.dart';

enum TrashOrigin {
  // do not change this order!
  localSync,
  remoteSync,
  localUser,
}

@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_trashed_local_asset_checksum ON trashed_local_asset_entity (checksum)')
@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_trashed_local_asset_album ON trashed_local_asset_entity (album_id)')
class TrashedLocalAssetEntity extends LocalAssetEntity {
  const TrashedLocalAssetEntity();

  TextColumn get albumId => text()();

  IntColumn get source => intEnum<TrashOrigin>()();

  @override
  Set<Column> get primaryKey => {id, albumId};
}

extension TrashedLocalAssetEntityDataDomainExtension on TrashedLocalAssetEntityData {
  LocalAsset toLocalAsset() => LocalAsset(
    id: id,
    name: name,
    checksum: checksum,
    type: type,
    createdAt: createdAt,
    updatedAt: updatedAt,
    durationMs: durationMs,
    isFavorite: isFavorite,
    height: height,
    width: width,
    orientation: orientation,
    playbackStyle: playbackStyle,
    isEdited: false,
  );
}
