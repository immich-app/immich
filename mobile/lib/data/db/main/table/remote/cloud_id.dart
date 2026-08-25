import 'package:drift/drift.dart';
import 'package:immich_mobile/data/db/main/table/remote/asset.dart';
import 'package:immich_mobile/data/db/util/defaults_mixin.dart';

@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_remote_asset_cloud_id ON remote_asset_cloud_id_entity (cloud_id)')
class RemoteAssetCloudIdEntity extends Table with DriftDefaultsMixin {
  TextColumn get assetId => text().references(RemoteAssetEntity, #id, onDelete: KeyAction.cascade)();

  TextColumn get cloudId => text().nullable()();

  DateTimeColumn get createdAt => dateTime().nullable()();

  DateTimeColumn get adjustmentTime => dateTime().nullable()();

  RealColumn get latitude => real().nullable()();

  RealColumn get longitude => real().nullable()();

  @override
  Set<Column> get primaryKey => {assetId};
}
