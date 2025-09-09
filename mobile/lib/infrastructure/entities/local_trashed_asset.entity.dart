import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/local_trashed_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_trashed_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

@TableIndex.sql(
  'CREATE INDEX IF NOT EXISTS idx_local_trashed_asset_remote_id ON local_trashed_asset_entity (remote_id)',
)
class LocalTrashedAssetEntity extends Table with DriftDefaultsMixin {
  const LocalTrashedAssetEntity();

  TextColumn get id => text()();

  TextColumn get remoteId => text().references(RemoteAssetEntity, #id, onDelete: KeyAction.cascade)();

  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

extension LocalTrashedAssetEntityDataDomainExtension on LocalTrashedAssetEntityData {
  LocalTrashedAsset toDto() => LocalTrashedAsset(localId: id, remoteId: remoteId, createdAt: createdAt);
}
