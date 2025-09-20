import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/asset/trashed_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/trashed_local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_trashed_local_asset_checksum ON trashed_local_asset_entity (checksum)')
class TrashedLocalAssetEntity extends Table with DriftDefaultsMixin {
  const TrashedLocalAssetEntity();

  TextColumn get id => text()();

  TextColumn get albumId => text()();

  TextColumn get checksum => text().nullable()();

  TextColumn get name => text()();

  IntColumn get type => intEnum<AssetType>()();

  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  IntColumn get size => integer().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

extension TrashedLocalAssetEntityDataDomainExtension on TrashedLocalAssetEntityData {
  TrashedAsset toDto(String albumId) => TrashedAsset(
    id: id,
    name: name,
    albumId: albumId,
    checksum: checksum,
    type: type,
    createdAt: createdAt,
    updatedAt: updatedAt,
    size: size,
  );
}
