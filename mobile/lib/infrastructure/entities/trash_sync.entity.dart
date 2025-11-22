import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/trash_sync.model.dart';
import 'package:immich_mobile/infrastructure/entities/trash_sync.entity.drift.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

@TableIndex(name: 'idx_trash_sync_checksum', columns: {#checksum})
@TableIndex(name: 'idx_trash_sync_status', columns: {#isSyncApproved})
@TableIndex(name: 'idx_trash_sync_checksum_status', columns: {#checksum, #isSyncApproved})
class TrashSyncEntity extends Table with DriftDefaultsMixin {
  const TrashSyncEntity();

  TextColumn get assetId => text()();

  TextColumn get checksum => text()();

  BoolColumn get isSyncApproved => boolean().nullable()();

  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {checksum};
}

extension LocalAssetEntityDataDomainEx on TrashSyncEntityData {
  TrashSyncDecision toDto() => TrashSyncDecision(assetId: assetId, checksum: checksum, isSyncApproved: isSyncApproved);
}
