// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/log.entity.drift.dart'
    as i1;

abstract class $DriftLogger extends i0.GeneratedDatabase {
  $DriftLogger(i0.QueryExecutor e) : super(e);
  $DriftLoggerManager get managers => $DriftLoggerManager(this);
  late final i1.$LogMessageEntityTable logMessageEntity = i1
      .$LogMessageEntityTable(this);
  @override
  Iterable<i0.TableInfo<i0.Table, Object?>> get allTables =>
      allSchemaEntities.whereType<i0.TableInfo<i0.Table, Object?>>();
  @override
  List<i0.DatabaseSchemaEntity> get allSchemaEntities => [logMessageEntity];
  @override
  i0.DriftDatabaseOptions get options =>
      const i0.DriftDatabaseOptions(storeDateTimeAsText: true);
}

class $DriftLoggerManager {
  final $DriftLogger _db;
  $DriftLoggerManager(this._db);
  i1.$$LogMessageEntityTableTableManager get logMessageEntity =>
      i1.$$LogMessageEntityTableTableManager(_db, _db.logMessageEntity);
}
