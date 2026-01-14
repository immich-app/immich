import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

@TableIndex(name: 'idx_trash_sync_checksum', columns: {#checksum})
@TableIndex(name: 'idx_trash_sync_status', columns: {#isSyncApproved})
@TableIndex(name: 'idx_trash_sync_checksum_status', columns: {#checksum, #isSyncApproved})
class TrashSyncEntity extends Table with DriftDefaultsMixin {
  const TrashSyncEntity();

  TextColumn get checksum => text()();

  BoolColumn get isSyncApproved => boolean().nullable()();

  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {checksum};
}
