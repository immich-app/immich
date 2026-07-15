import 'package:drift/drift.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_trash_sync_checksum ON trash_sync (checksum)')
class TrashSyncEntity extends Table with DriftDefaultsMixin {
  const TrashSyncEntity();

  TextColumn get assetId => text()();

  TextColumn get checksum => text()();

  IntColumn get status => intEnum<TrashSyncStatus>().withDefault(Constant(TrashSyncStatus.pending.index))();

  DateTimeColumn get assetUpdatedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {assetId};

  @override
  String get tableName => "trash_sync";
}
