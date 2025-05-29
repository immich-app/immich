import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/utils/asset.mixin.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

@TableIndex(name: 'local_asset_checksum', columns: {#checksum})
class LocalAssetEntity extends Table with DriftDefaultsMixin, AssetEntityMixin {
  const LocalAssetEntity();

  TextColumn get id => text()();
  TextColumn get checksum => text().nullable()();

  // Only used during backup to mirror the favorite status of the asset in the server
  BoolColumn get isFavorite => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {id};
}
