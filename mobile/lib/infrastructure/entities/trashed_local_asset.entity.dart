import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/trashed_local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/utils/asset.mixin.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_trashed_local_asset_checksum ON trashed_local_asset_entity (checksum)')
@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_trashed_local_asset_album ON trashed_local_asset_entity (album_id)')
class TrashedLocalAssetEntity extends Table with DriftDefaultsMixin, AssetEntityMixin {
  const TrashedLocalAssetEntity();

  TextColumn get id => text()();

  TextColumn get albumId => text()();

  TextColumn get checksum => text().nullable()();

  BoolColumn get isFavorite => boolean().withDefault(const Constant(false))();

  IntColumn get orientation => integer().withDefault(const Constant(0))();

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
    durationInSeconds: durationInSeconds,
    isFavorite: isFavorite,
    height: height,
    width: width,
    orientation: orientation,
  );
}
