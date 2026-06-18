import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/utils/asset.mixin.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_local_asset_checksum ON local_asset_entity (checksum)')
@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_local_asset_cloud_id ON local_asset_entity (i_cloud_id)')
@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_local_asset_created_at ON local_asset_entity (created_at)')
@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_local_asset_prior_remote_id ON local_asset_entity (prior_remote_id)')
@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_local_asset_burst_id ON local_asset_entity (burst_id)')
class LocalAssetEntity extends Table with DriftDefaultsMixin, AssetEntityMixin {
  const LocalAssetEntity();

  TextColumn get id => text()();
  TextColumn get checksum => text().nullable()();

  // Only used during backup to mirror the favorite status of the asset in the server
  BoolColumn get isFavorite => boolean().withDefault(const Constant(false))();

  IntColumn get orientation => integer().withDefault(const Constant(0))();

  TextColumn get iCloudId => text().nullable()();

  DateTimeColumn get adjustmentTime => dateTime().nullable()();

  RealColumn get latitude => real().nullable()();

  RealColumn get longitude => real().nullable()();

  IntColumn get playbackStyle => intEnum<AssetPlaybackStyle>().withDefault(const Constant(0))();

  // remote id of the previous upload (iOS edit-pair stacking)
  TextColumn get priorRemoteId => text().nullable()();

  // local checksum at the last sync action. Lets the backup query skip a local
  // whose current hash matches nothing remote but is still "handled": the iOS
  // revert case, where the reverted render hashes fresh but is already reconciled.
  TextColumn get syncedChecksum => text().nullable()();

  // iOS burst grouping. burstId = PHAsset.burstIdentifier (null for non-burst).
  // isBurstRepresentative = the auto-picked lead frame at detection; the rep is
  // the timeline tile and the stack anchor. Both re-sync on every delta, so a
  // Photos re-pick that moves the rep flag is reflected.
  TextColumn get burstId => text().nullable()();
  BoolColumn get isBurstRepresentative => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {id};
}

extension LocalAssetEntityDataDomainExtension on LocalAssetEntityData {
  LocalAsset toDto({String? remoteId}) => LocalAsset(
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
    remoteId: remoteId,
    orientation: orientation,
    playbackStyle: playbackStyle,
    adjustmentTime: adjustmentTime,
    latitude: latitude,
    longitude: longitude,
    cloudId: iCloudId,
    isEdited: false,
    priorRemoteId: priorRemoteId,
    syncedChecksum: syncedChecksum,
    burstId: burstId,
    isBurstRepresentative: isBurstRepresentative,
  );
}
