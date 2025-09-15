import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/utils/asset.mixin.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_local_asset_checksum ON local_asset_entity (checksum)')
class LocalAssetEntity extends Table with DriftDefaultsMixin, AssetEntityMixin {
  const LocalAssetEntity();

  TextColumn get id => text()();
  TextColumn get checksum => text().nullable()();

  // Only used during backup to mirror the favorite status of the asset in the server
  BoolColumn get isFavorite => boolean().withDefault(const Constant(false))();

  IntColumn get orientation => integer().withDefault(const Constant(0))();

  @override
  Set<Column> get primaryKey => {id};
}

extension LocalAssetEntityDataDomainExtension on LocalAssetEntityData {
  LocalAsset toDto() => LocalAsset(
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
    remoteId: null,
    orientation: orientation,
  );
}
