import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_trash_sync_is_sync_approved ON trash_sync_entity (is_sync_approved)')
@TableIndex.sql(
    'CREATE INDEX IF NOT EXISTS idx_trash_sync_checksum_status ON trash_sync_entity (checksum, is_sync_approved)')
class TrashSyncEntity extends Table with DriftDefaultsMixin {
  const TrashSyncEntity();

  TextColumn get checksum => text()();

  BoolColumn get isSyncApproved => boolean().nullable()();

  DateTimeColumn get remoteDeletedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {checksum};
}
