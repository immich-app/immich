import 'package:drift/drift.dart';
import 'package:immich_mobile/data/db/main/table/local/trashed_asset.drift.dart';
import 'package:immich_mobile/data/db/util/asset_mixin.dart';
import 'package:immich_mobile/data/db/util/defaults_mixin.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

enum TrashOrigin {
  // do not change this order!
  localSync,
  remoteSync,
  localUser,
}

@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_trashed_local_asset_checksum ON trashed_local_asset_entity (checksum)')
@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_trashed_local_asset_album ON trashed_local_asset_entity (album_id)')
class TrashedLocalAssetEntity extends Table with DriftDefaultsMixin, AssetEntityMixin {
  const TrashedLocalAssetEntity();

  TextColumn get id => text()();

  TextColumn get albumId => text()();

  TextColumn get checksum => text().nullable()();

  BoolColumn get isFavorite => boolean().withDefault(const Constant(false))();

  IntColumn get orientation => integer().withDefault(const Constant(0))();

  IntColumn get source => intEnum<TrashOrigin>()();

  IntColumn get playbackStyle => intEnum<AssetPlaybackStyle>().withDefault(const Constant(0))();

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
