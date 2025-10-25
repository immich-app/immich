// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/background_downloader.entity.drift.dart'
    as i1;

abstract class $DriftBackgroundDownloader extends i0.GeneratedDatabase {
  $DriftBackgroundDownloader(i0.QueryExecutor e) : super(e);
  $DriftBackgroundDownloaderManager get managers =>
      $DriftBackgroundDownloaderManager(this);
  late final i1.$TaskRecordEntityTable taskRecordEntity = i1
      .$TaskRecordEntityTable(this);
  late final i1.$PausedTasksEntityTable pausedTasksEntity = i1
      .$PausedTasksEntityTable(this);
  late final i1.$ModifiedTasksEntityTable modifiedTasksEntity = i1
      .$ModifiedTasksEntityTable(this);
  late final i1.$ResumeTasksEntityTable resumeTasksEntity = i1
      .$ResumeTasksEntityTable(this);
  @override
  Iterable<i0.TableInfo<i0.Table, Object?>> get allTables =>
      allSchemaEntities.whereType<i0.TableInfo<i0.Table, Object?>>();
  @override
  List<i0.DatabaseSchemaEntity> get allSchemaEntities => [
    taskRecordEntity,
    pausedTasksEntity,
    modifiedTasksEntity,
    resumeTasksEntity,
  ];
  @override
  i0.DriftDatabaseOptions get options =>
      const i0.DriftDatabaseOptions(storeDateTimeAsText: true);
}

class $DriftBackgroundDownloaderManager {
  final $DriftBackgroundDownloader _db;
  $DriftBackgroundDownloaderManager(this._db);
  i1.$$TaskRecordEntityTableTableManager get taskRecordEntity =>
      i1.$$TaskRecordEntityTableTableManager(_db, _db.taskRecordEntity);
  i1.$$PausedTasksEntityTableTableManager get pausedTasksEntity =>
      i1.$$PausedTasksEntityTableTableManager(_db, _db.pausedTasksEntity);
  i1.$$ModifiedTasksEntityTableTableManager get modifiedTasksEntity =>
      i1.$$ModifiedTasksEntityTableTableManager(_db, _db.modifiedTasksEntity);
  i1.$$ResumeTasksEntityTableTableManager get resumeTasksEntity =>
      i1.$$ResumeTasksEntityTableTableManager(_db, _db.resumeTasksEntity);
}
