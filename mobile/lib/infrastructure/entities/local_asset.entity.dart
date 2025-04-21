import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset/asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/utils/asset.mixin.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

@TableIndex(name: 'local_asset_checksum', columns: {#checksum})
class LocalAssetEntity extends Table with DriftDefaultsMixin, AssetEntityMixin {
  const LocalAssetEntity();

  TextColumn get localId => text()();

  TextColumn get checksum => text().nullable()();

  IntColumn get width => integer().nullable()();

  IntColumn get height => integer().nullable()();

  @override
  Set<Column> get primaryKey => {localId};
}

extension LocalAssetEntityX on LocalAssetEntityData {
  LocalAsset toDto() {
    return LocalAsset(
      localId: localId,
      name: name,
      checksum: checksum,
      type: type,
      createdAt: createdAt,
      updatedAt: updatedAt,
      width: width,
      height: height,
      durationInSeconds: durationInSeconds,
    );
  }
}
