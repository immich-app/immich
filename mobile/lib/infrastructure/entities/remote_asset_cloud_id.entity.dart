import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class RemoteAssetCloudIdEntity extends Table with DriftDefaultsMixin {
  TextColumn get assetId => text().references(RemoteAssetEntity, #id, onDelete: KeyAction.cascade)();

  TextColumn get cloudId => text().unique().nullable()();

  TextColumn get eTag => text().nullable()();

  @override
  Set<Column> get primaryKey => {assetId};
}
