import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset/trashed_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/trashed_local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/utils/asset.mixin.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_trashed_local_asset_checksum ON trashed_local_asset_entity (checksum)')
class TrashedLocalAssetEntity extends Table with DriftDefaultsMixin, AssetEntityMixin {
  const TrashedLocalAssetEntity();

  TextColumn get id => text()();

  TextColumn get albumId => text()();

  TextColumn get volume => text().nullable()();

  TextColumn get checksum => text().nullable()();

  BoolColumn get isFavorite => boolean().withDefault(const Constant(false))();

  IntColumn get orientation => integer().withDefault(const Constant(0))();

  @override
  Set<Column> get primaryKey => {id, albumId};
}

extension TrashedLocalAssetEntityDataDomainExtension on TrashedLocalAssetEntityData {
  TrashedAsset toDto() => TrashedAsset(
    id: id,
    name: name,
    volume: volume,
    albumId: albumId,
    checksum: checksum,
    type: type,
    createdAt: createdAt,
    updatedAt: updatedAt,
  );
}
