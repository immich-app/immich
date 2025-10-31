import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/trash_sync.model.dart';
import 'package:immich_mobile/infrastructure/entities/trash_sync.entity.drift.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

@TableIndex(name: 'idx_trash_sync_checksum', columns: {#checksum})
class TrashSyncEntity extends Table with DriftDefaultsMixin {
  const TrashSyncEntity();

  TextColumn get assetId => text()();

  TextColumn get checksum => text()();

  BoolColumn get isSyncApproved => boolean().nullable()();

  IntColumn get actionType => intEnum<TrashActionType>()();

  @override
  Set<Column> get primaryKey => {assetId};
}

extension LocalAssetEntityDataDomainEx on TrashSyncEntityData {
  TrashSyncDecision toDto() => TrashSyncDecision(
    assetId: assetId,
    checksum: checksum,
    isSyncApproved: isSyncApproved,
    actionType: actionType,
  );
}
