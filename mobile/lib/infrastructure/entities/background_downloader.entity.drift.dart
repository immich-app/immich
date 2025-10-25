// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/background_downloader.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/background_downloader.entity.dart'
    as i2;

typedef $$TaskRecordEntityTableCreateCompanionBuilder =
    i1.TaskRecordEntityCompanion Function({
      required String taskId,
      required String url,
      required String filename,
      required String group,
      required String metaData,
      required int creationTime,
      required int status,
      required double progress,
      required String objectJsonMap,
    });
typedef $$TaskRecordEntityTableUpdateCompanionBuilder =
    i1.TaskRecordEntityCompanion Function({
      i0.Value<String> taskId,
      i0.Value<String> url,
      i0.Value<String> filename,
      i0.Value<String> group,
      i0.Value<String> metaData,
      i0.Value<int> creationTime,
      i0.Value<int> status,
      i0.Value<double> progress,
      i0.Value<String> objectJsonMap,
    });

class $$TaskRecordEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$TaskRecordEntityTable> {
  $$TaskRecordEntityTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnFilters<String> get taskId => $composableBuilder(
    column: $table.taskId,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<String> get url => $composableBuilder(
    column: $table.url,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<String> get filename => $composableBuilder(
    column: $table.filename,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<String> get group => $composableBuilder(
    column: $table.group,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<String> get metaData => $composableBuilder(
    column: $table.metaData,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get creationTime => $composableBuilder(
    column: $table.creationTime,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<double> get progress => $composableBuilder(
    column: $table.progress,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<String> get objectJsonMap => $composableBuilder(
    column: $table.objectJsonMap,
    builder: (column) => i0.ColumnFilters(column),
  );
}

class $$TaskRecordEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$TaskRecordEntityTable> {
  $$TaskRecordEntityTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnOrderings<String> get taskId => $composableBuilder(
    column: $table.taskId,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get url => $composableBuilder(
    column: $table.url,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get filename => $composableBuilder(
    column: $table.filename,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get group => $composableBuilder(
    column: $table.group,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get metaData => $composableBuilder(
    column: $table.metaData,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get creationTime => $composableBuilder(
    column: $table.creationTime,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<double> get progress => $composableBuilder(
    column: $table.progress,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get objectJsonMap => $composableBuilder(
    column: $table.objectJsonMap,
    builder: (column) => i0.ColumnOrderings(column),
  );
}

class $$TaskRecordEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$TaskRecordEntityTable> {
  $$TaskRecordEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<String> get taskId =>
      $composableBuilder(column: $table.taskId, builder: (column) => column);

  i0.GeneratedColumn<String> get url =>
      $composableBuilder(column: $table.url, builder: (column) => column);

  i0.GeneratedColumn<String> get filename =>
      $composableBuilder(column: $table.filename, builder: (column) => column);

  i0.GeneratedColumn<String> get group =>
      $composableBuilder(column: $table.group, builder: (column) => column);

  i0.GeneratedColumn<String> get metaData =>
      $composableBuilder(column: $table.metaData, builder: (column) => column);

  i0.GeneratedColumn<int> get creationTime => $composableBuilder(
    column: $table.creationTime,
    builder: (column) => column,
  );

  i0.GeneratedColumn<int> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  i0.GeneratedColumn<double> get progress =>
      $composableBuilder(column: $table.progress, builder: (column) => column);

  i0.GeneratedColumn<String> get objectJsonMap => $composableBuilder(
    column: $table.objectJsonMap,
    builder: (column) => column,
  );
}

class $$TaskRecordEntityTableTableManager
    extends
        i0.RootTableManager<
          i0.GeneratedDatabase,
          i1.$TaskRecordEntityTable,
          i1.TaskRecordEntityData,
          i1.$$TaskRecordEntityTableFilterComposer,
          i1.$$TaskRecordEntityTableOrderingComposer,
          i1.$$TaskRecordEntityTableAnnotationComposer,
          $$TaskRecordEntityTableCreateCompanionBuilder,
          $$TaskRecordEntityTableUpdateCompanionBuilder,
          (
            i1.TaskRecordEntityData,
            i0.BaseReferences<
              i0.GeneratedDatabase,
              i1.$TaskRecordEntityTable,
              i1.TaskRecordEntityData
            >,
          ),
          i1.TaskRecordEntityData,
          i0.PrefetchHooks Function()
        > {
  $$TaskRecordEntityTableTableManager(
    i0.GeneratedDatabase db,
    i1.$TaskRecordEntityTable table,
  ) : super(
        i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$TaskRecordEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () => i1
              .$$TaskRecordEntityTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              i1.$$TaskRecordEntityTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                i0.Value<String> taskId = const i0.Value.absent(),
                i0.Value<String> url = const i0.Value.absent(),
                i0.Value<String> filename = const i0.Value.absent(),
                i0.Value<String> group = const i0.Value.absent(),
                i0.Value<String> metaData = const i0.Value.absent(),
                i0.Value<int> creationTime = const i0.Value.absent(),
                i0.Value<int> status = const i0.Value.absent(),
                i0.Value<double> progress = const i0.Value.absent(),
                i0.Value<String> objectJsonMap = const i0.Value.absent(),
              }) => i1.TaskRecordEntityCompanion(
                taskId: taskId,
                url: url,
                filename: filename,
                group: group,
                metaData: metaData,
                creationTime: creationTime,
                status: status,
                progress: progress,
                objectJsonMap: objectJsonMap,
              ),
          createCompanionCallback:
              ({
                required String taskId,
                required String url,
                required String filename,
                required String group,
                required String metaData,
                required int creationTime,
                required int status,
                required double progress,
                required String objectJsonMap,
              }) => i1.TaskRecordEntityCompanion.insert(
                taskId: taskId,
                url: url,
                filename: filename,
                group: group,
                metaData: metaData,
                creationTime: creationTime,
                status: status,
                progress: progress,
                objectJsonMap: objectJsonMap,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), i0.BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$TaskRecordEntityTableProcessedTableManager =
    i0.ProcessedTableManager<
      i0.GeneratedDatabase,
      i1.$TaskRecordEntityTable,
      i1.TaskRecordEntityData,
      i1.$$TaskRecordEntityTableFilterComposer,
      i1.$$TaskRecordEntityTableOrderingComposer,
      i1.$$TaskRecordEntityTableAnnotationComposer,
      $$TaskRecordEntityTableCreateCompanionBuilder,
      $$TaskRecordEntityTableUpdateCompanionBuilder,
      (
        i1.TaskRecordEntityData,
        i0.BaseReferences<
          i0.GeneratedDatabase,
          i1.$TaskRecordEntityTable,
          i1.TaskRecordEntityData
        >,
      ),
      i1.TaskRecordEntityData,
      i0.PrefetchHooks Function()
    >;
typedef $$PausedTasksEntityTableCreateCompanionBuilder =
    i1.PausedTasksEntityCompanion Function({
      required String taskId,
      required int modified,
      required String objectJsonMap,
    });
typedef $$PausedTasksEntityTableUpdateCompanionBuilder =
    i1.PausedTasksEntityCompanion Function({
      i0.Value<String> taskId,
      i0.Value<int> modified,
      i0.Value<String> objectJsonMap,
    });

class $$PausedTasksEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$PausedTasksEntityTable> {
  $$PausedTasksEntityTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnFilters<String> get taskId => $composableBuilder(
    column: $table.taskId,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get modified => $composableBuilder(
    column: $table.modified,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<String> get objectJsonMap => $composableBuilder(
    column: $table.objectJsonMap,
    builder: (column) => i0.ColumnFilters(column),
  );
}

class $$PausedTasksEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$PausedTasksEntityTable> {
  $$PausedTasksEntityTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnOrderings<String> get taskId => $composableBuilder(
    column: $table.taskId,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get modified => $composableBuilder(
    column: $table.modified,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get objectJsonMap => $composableBuilder(
    column: $table.objectJsonMap,
    builder: (column) => i0.ColumnOrderings(column),
  );
}

class $$PausedTasksEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$PausedTasksEntityTable> {
  $$PausedTasksEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<String> get taskId =>
      $composableBuilder(column: $table.taskId, builder: (column) => column);

  i0.GeneratedColumn<int> get modified =>
      $composableBuilder(column: $table.modified, builder: (column) => column);

  i0.GeneratedColumn<String> get objectJsonMap => $composableBuilder(
    column: $table.objectJsonMap,
    builder: (column) => column,
  );
}

class $$PausedTasksEntityTableTableManager
    extends
        i0.RootTableManager<
          i0.GeneratedDatabase,
          i1.$PausedTasksEntityTable,
          i1.PausedTasksEntityData,
          i1.$$PausedTasksEntityTableFilterComposer,
          i1.$$PausedTasksEntityTableOrderingComposer,
          i1.$$PausedTasksEntityTableAnnotationComposer,
          $$PausedTasksEntityTableCreateCompanionBuilder,
          $$PausedTasksEntityTableUpdateCompanionBuilder,
          (
            i1.PausedTasksEntityData,
            i0.BaseReferences<
              i0.GeneratedDatabase,
              i1.$PausedTasksEntityTable,
              i1.PausedTasksEntityData
            >,
          ),
          i1.PausedTasksEntityData,
          i0.PrefetchHooks Function()
        > {
  $$PausedTasksEntityTableTableManager(
    i0.GeneratedDatabase db,
    i1.$PausedTasksEntityTable table,
  ) : super(
        i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$PausedTasksEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () => i1
              .$$PausedTasksEntityTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              i1.$$PausedTasksEntityTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                i0.Value<String> taskId = const i0.Value.absent(),
                i0.Value<int> modified = const i0.Value.absent(),
                i0.Value<String> objectJsonMap = const i0.Value.absent(),
              }) => i1.PausedTasksEntityCompanion(
                taskId: taskId,
                modified: modified,
                objectJsonMap: objectJsonMap,
              ),
          createCompanionCallback:
              ({
                required String taskId,
                required int modified,
                required String objectJsonMap,
              }) => i1.PausedTasksEntityCompanion.insert(
                taskId: taskId,
                modified: modified,
                objectJsonMap: objectJsonMap,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), i0.BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$PausedTasksEntityTableProcessedTableManager =
    i0.ProcessedTableManager<
      i0.GeneratedDatabase,
      i1.$PausedTasksEntityTable,
      i1.PausedTasksEntityData,
      i1.$$PausedTasksEntityTableFilterComposer,
      i1.$$PausedTasksEntityTableOrderingComposer,
      i1.$$PausedTasksEntityTableAnnotationComposer,
      $$PausedTasksEntityTableCreateCompanionBuilder,
      $$PausedTasksEntityTableUpdateCompanionBuilder,
      (
        i1.PausedTasksEntityData,
        i0.BaseReferences<
          i0.GeneratedDatabase,
          i1.$PausedTasksEntityTable,
          i1.PausedTasksEntityData
        >,
      ),
      i1.PausedTasksEntityData,
      i0.PrefetchHooks Function()
    >;
typedef $$ModifiedTasksEntityTableCreateCompanionBuilder =
    i1.ModifiedTasksEntityCompanion Function({
      required String taskId,
      required int modified,
      required String objectJsonMap,
    });
typedef $$ModifiedTasksEntityTableUpdateCompanionBuilder =
    i1.ModifiedTasksEntityCompanion Function({
      i0.Value<String> taskId,
      i0.Value<int> modified,
      i0.Value<String> objectJsonMap,
    });

class $$ModifiedTasksEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$ModifiedTasksEntityTable> {
  $$ModifiedTasksEntityTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnFilters<String> get taskId => $composableBuilder(
    column: $table.taskId,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get modified => $composableBuilder(
    column: $table.modified,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<String> get objectJsonMap => $composableBuilder(
    column: $table.objectJsonMap,
    builder: (column) => i0.ColumnFilters(column),
  );
}

class $$ModifiedTasksEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$ModifiedTasksEntityTable> {
  $$ModifiedTasksEntityTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnOrderings<String> get taskId => $composableBuilder(
    column: $table.taskId,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get modified => $composableBuilder(
    column: $table.modified,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get objectJsonMap => $composableBuilder(
    column: $table.objectJsonMap,
    builder: (column) => i0.ColumnOrderings(column),
  );
}

class $$ModifiedTasksEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$ModifiedTasksEntityTable> {
  $$ModifiedTasksEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<String> get taskId =>
      $composableBuilder(column: $table.taskId, builder: (column) => column);

  i0.GeneratedColumn<int> get modified =>
      $composableBuilder(column: $table.modified, builder: (column) => column);

  i0.GeneratedColumn<String> get objectJsonMap => $composableBuilder(
    column: $table.objectJsonMap,
    builder: (column) => column,
  );
}

class $$ModifiedTasksEntityTableTableManager
    extends
        i0.RootTableManager<
          i0.GeneratedDatabase,
          i1.$ModifiedTasksEntityTable,
          i1.ModifiedTasksEntityData,
          i1.$$ModifiedTasksEntityTableFilterComposer,
          i1.$$ModifiedTasksEntityTableOrderingComposer,
          i1.$$ModifiedTasksEntityTableAnnotationComposer,
          $$ModifiedTasksEntityTableCreateCompanionBuilder,
          $$ModifiedTasksEntityTableUpdateCompanionBuilder,
          (
            i1.ModifiedTasksEntityData,
            i0.BaseReferences<
              i0.GeneratedDatabase,
              i1.$ModifiedTasksEntityTable,
              i1.ModifiedTasksEntityData
            >,
          ),
          i1.ModifiedTasksEntityData,
          i0.PrefetchHooks Function()
        > {
  $$ModifiedTasksEntityTableTableManager(
    i0.GeneratedDatabase db,
    i1.$ModifiedTasksEntityTable table,
  ) : super(
        i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () => i1
              .$$ModifiedTasksEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              i1.$$ModifiedTasksEntityTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              i1.$$ModifiedTasksEntityTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                i0.Value<String> taskId = const i0.Value.absent(),
                i0.Value<int> modified = const i0.Value.absent(),
                i0.Value<String> objectJsonMap = const i0.Value.absent(),
              }) => i1.ModifiedTasksEntityCompanion(
                taskId: taskId,
                modified: modified,
                objectJsonMap: objectJsonMap,
              ),
          createCompanionCallback:
              ({
                required String taskId,
                required int modified,
                required String objectJsonMap,
              }) => i1.ModifiedTasksEntityCompanion.insert(
                taskId: taskId,
                modified: modified,
                objectJsonMap: objectJsonMap,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), i0.BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$ModifiedTasksEntityTableProcessedTableManager =
    i0.ProcessedTableManager<
      i0.GeneratedDatabase,
      i1.$ModifiedTasksEntityTable,
      i1.ModifiedTasksEntityData,
      i1.$$ModifiedTasksEntityTableFilterComposer,
      i1.$$ModifiedTasksEntityTableOrderingComposer,
      i1.$$ModifiedTasksEntityTableAnnotationComposer,
      $$ModifiedTasksEntityTableCreateCompanionBuilder,
      $$ModifiedTasksEntityTableUpdateCompanionBuilder,
      (
        i1.ModifiedTasksEntityData,
        i0.BaseReferences<
          i0.GeneratedDatabase,
          i1.$ModifiedTasksEntityTable,
          i1.ModifiedTasksEntityData
        >,
      ),
      i1.ModifiedTasksEntityData,
      i0.PrefetchHooks Function()
    >;
typedef $$ResumeTasksEntityTableCreateCompanionBuilder =
    i1.ResumeTasksEntityCompanion Function({
      required String taskId,
      required int modified,
      required String objectJsonMap,
    });
typedef $$ResumeTasksEntityTableUpdateCompanionBuilder =
    i1.ResumeTasksEntityCompanion Function({
      i0.Value<String> taskId,
      i0.Value<int> modified,
      i0.Value<String> objectJsonMap,
    });

class $$ResumeTasksEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$ResumeTasksEntityTable> {
  $$ResumeTasksEntityTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnFilters<String> get taskId => $composableBuilder(
    column: $table.taskId,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get modified => $composableBuilder(
    column: $table.modified,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<String> get objectJsonMap => $composableBuilder(
    column: $table.objectJsonMap,
    builder: (column) => i0.ColumnFilters(column),
  );
}

class $$ResumeTasksEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$ResumeTasksEntityTable> {
  $$ResumeTasksEntityTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnOrderings<String> get taskId => $composableBuilder(
    column: $table.taskId,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get modified => $composableBuilder(
    column: $table.modified,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get objectJsonMap => $composableBuilder(
    column: $table.objectJsonMap,
    builder: (column) => i0.ColumnOrderings(column),
  );
}

class $$ResumeTasksEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$ResumeTasksEntityTable> {
  $$ResumeTasksEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<String> get taskId =>
      $composableBuilder(column: $table.taskId, builder: (column) => column);

  i0.GeneratedColumn<int> get modified =>
      $composableBuilder(column: $table.modified, builder: (column) => column);

  i0.GeneratedColumn<String> get objectJsonMap => $composableBuilder(
    column: $table.objectJsonMap,
    builder: (column) => column,
  );
}

class $$ResumeTasksEntityTableTableManager
    extends
        i0.RootTableManager<
          i0.GeneratedDatabase,
          i1.$ResumeTasksEntityTable,
          i1.ResumeTasksEntityData,
          i1.$$ResumeTasksEntityTableFilterComposer,
          i1.$$ResumeTasksEntityTableOrderingComposer,
          i1.$$ResumeTasksEntityTableAnnotationComposer,
          $$ResumeTasksEntityTableCreateCompanionBuilder,
          $$ResumeTasksEntityTableUpdateCompanionBuilder,
          (
            i1.ResumeTasksEntityData,
            i0.BaseReferences<
              i0.GeneratedDatabase,
              i1.$ResumeTasksEntityTable,
              i1.ResumeTasksEntityData
            >,
          ),
          i1.ResumeTasksEntityData,
          i0.PrefetchHooks Function()
        > {
  $$ResumeTasksEntityTableTableManager(
    i0.GeneratedDatabase db,
    i1.$ResumeTasksEntityTable table,
  ) : super(
        i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$ResumeTasksEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () => i1
              .$$ResumeTasksEntityTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              i1.$$ResumeTasksEntityTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                i0.Value<String> taskId = const i0.Value.absent(),
                i0.Value<int> modified = const i0.Value.absent(),
                i0.Value<String> objectJsonMap = const i0.Value.absent(),
              }) => i1.ResumeTasksEntityCompanion(
                taskId: taskId,
                modified: modified,
                objectJsonMap: objectJsonMap,
              ),
          createCompanionCallback:
              ({
                required String taskId,
                required int modified,
                required String objectJsonMap,
              }) => i1.ResumeTasksEntityCompanion.insert(
                taskId: taskId,
                modified: modified,
                objectJsonMap: objectJsonMap,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), i0.BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$ResumeTasksEntityTableProcessedTableManager =
    i0.ProcessedTableManager<
      i0.GeneratedDatabase,
      i1.$ResumeTasksEntityTable,
      i1.ResumeTasksEntityData,
      i1.$$ResumeTasksEntityTableFilterComposer,
      i1.$$ResumeTasksEntityTableOrderingComposer,
      i1.$$ResumeTasksEntityTableAnnotationComposer,
      $$ResumeTasksEntityTableCreateCompanionBuilder,
      $$ResumeTasksEntityTableUpdateCompanionBuilder,
      (
        i1.ResumeTasksEntityData,
        i0.BaseReferences<
          i0.GeneratedDatabase,
          i1.$ResumeTasksEntityTable,
          i1.ResumeTasksEntityData
        >,
      ),
      i1.ResumeTasksEntityData,
      i0.PrefetchHooks Function()
    >;

class $TaskRecordEntityTable extends i2.TaskRecordEntity
    with i0.TableInfo<$TaskRecordEntityTable, i1.TaskRecordEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $TaskRecordEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _taskIdMeta = const i0.VerificationMeta(
    'taskId',
  );
  @override
  late final i0.GeneratedColumn<String> taskId = i0.GeneratedColumn<String>(
    'task_id',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _urlMeta = const i0.VerificationMeta('url');
  @override
  late final i0.GeneratedColumn<String> url = i0.GeneratedColumn<String>(
    'url',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _filenameMeta = const i0.VerificationMeta(
    'filename',
  );
  @override
  late final i0.GeneratedColumn<String> filename = i0.GeneratedColumn<String>(
    'filename',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _groupMeta = const i0.VerificationMeta(
    'group',
  );
  @override
  late final i0.GeneratedColumn<String> group = i0.GeneratedColumn<String>(
    'group',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _metaDataMeta = const i0.VerificationMeta(
    'metaData',
  );
  @override
  late final i0.GeneratedColumn<String> metaData = i0.GeneratedColumn<String>(
    'meta_data',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _creationTimeMeta =
      const i0.VerificationMeta('creationTime');
  @override
  late final i0.GeneratedColumn<int> creationTime = i0.GeneratedColumn<int>(
    'creation_time',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _statusMeta = const i0.VerificationMeta(
    'status',
  );
  @override
  late final i0.GeneratedColumn<int> status = i0.GeneratedColumn<int>(
    'status',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _progressMeta = const i0.VerificationMeta(
    'progress',
  );
  @override
  late final i0.GeneratedColumn<double> progress = i0.GeneratedColumn<double>(
    'progress',
    aliasedName,
    false,
    type: i0.DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _objectJsonMapMeta =
      const i0.VerificationMeta('objectJsonMap');
  @override
  late final i0.GeneratedColumn<String> objectJsonMap =
      i0.GeneratedColumn<String>(
        'object_json_map',
        aliasedName,
        false,
        type: i0.DriftSqlType.string,
        requiredDuringInsert: true,
      );
  @override
  List<i0.GeneratedColumn> get $columns => [
    taskId,
    url,
    filename,
    group,
    metaData,
    creationTime,
    status,
    progress,
    objectJsonMap,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'task_record_entity';
  @override
  i0.VerificationContext validateIntegrity(
    i0.Insertable<i1.TaskRecordEntityData> instance, {
    bool isInserting = false,
  }) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('task_id')) {
      context.handle(
        _taskIdMeta,
        taskId.isAcceptableOrUnknown(data['task_id']!, _taskIdMeta),
      );
    } else if (isInserting) {
      context.missing(_taskIdMeta);
    }
    if (data.containsKey('url')) {
      context.handle(
        _urlMeta,
        url.isAcceptableOrUnknown(data['url']!, _urlMeta),
      );
    } else if (isInserting) {
      context.missing(_urlMeta);
    }
    if (data.containsKey('filename')) {
      context.handle(
        _filenameMeta,
        filename.isAcceptableOrUnknown(data['filename']!, _filenameMeta),
      );
    } else if (isInserting) {
      context.missing(_filenameMeta);
    }
    if (data.containsKey('group')) {
      context.handle(
        _groupMeta,
        group.isAcceptableOrUnknown(data['group']!, _groupMeta),
      );
    } else if (isInserting) {
      context.missing(_groupMeta);
    }
    if (data.containsKey('meta_data')) {
      context.handle(
        _metaDataMeta,
        metaData.isAcceptableOrUnknown(data['meta_data']!, _metaDataMeta),
      );
    } else if (isInserting) {
      context.missing(_metaDataMeta);
    }
    if (data.containsKey('creation_time')) {
      context.handle(
        _creationTimeMeta,
        creationTime.isAcceptableOrUnknown(
          data['creation_time']!,
          _creationTimeMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_creationTimeMeta);
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    } else if (isInserting) {
      context.missing(_statusMeta);
    }
    if (data.containsKey('progress')) {
      context.handle(
        _progressMeta,
        progress.isAcceptableOrUnknown(data['progress']!, _progressMeta),
      );
    } else if (isInserting) {
      context.missing(_progressMeta);
    }
    if (data.containsKey('object_json_map')) {
      context.handle(
        _objectJsonMapMeta,
        objectJsonMap.isAcceptableOrUnknown(
          data['object_json_map']!,
          _objectJsonMapMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_objectJsonMapMeta);
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {taskId};
  @override
  i1.TaskRecordEntityData map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.TaskRecordEntityData(
      taskId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}task_id'],
      )!,
      url: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}url'],
      )!,
      filename: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}filename'],
      )!,
      group: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}group'],
      )!,
      metaData: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}meta_data'],
      )!,
      creationTime: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}creation_time'],
      )!,
      status: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}status'],
      )!,
      progress: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.double,
        data['${effectivePrefix}progress'],
      )!,
      objectJsonMap: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}object_json_map'],
      )!,
    );
  }

  @override
  $TaskRecordEntityTable createAlias(String alias) {
    return $TaskRecordEntityTable(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class TaskRecordEntityData extends i0.DataClass
    implements i0.Insertable<i1.TaskRecordEntityData> {
  final String taskId;
  final String url;
  final String filename;
  final String group;
  final String metaData;
  final int creationTime;
  final int status;
  final double progress;
  final String objectJsonMap;
  const TaskRecordEntityData({
    required this.taskId,
    required this.url,
    required this.filename,
    required this.group,
    required this.metaData,
    required this.creationTime,
    required this.status,
    required this.progress,
    required this.objectJsonMap,
  });
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['task_id'] = i0.Variable<String>(taskId);
    map['url'] = i0.Variable<String>(url);
    map['filename'] = i0.Variable<String>(filename);
    map['group'] = i0.Variable<String>(group);
    map['meta_data'] = i0.Variable<String>(metaData);
    map['creation_time'] = i0.Variable<int>(creationTime);
    map['status'] = i0.Variable<int>(status);
    map['progress'] = i0.Variable<double>(progress);
    map['object_json_map'] = i0.Variable<String>(objectJsonMap);
    return map;
  }

  factory TaskRecordEntityData.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return TaskRecordEntityData(
      taskId: serializer.fromJson<String>(json['taskId']),
      url: serializer.fromJson<String>(json['url']),
      filename: serializer.fromJson<String>(json['filename']),
      group: serializer.fromJson<String>(json['group']),
      metaData: serializer.fromJson<String>(json['metaData']),
      creationTime: serializer.fromJson<int>(json['creationTime']),
      status: serializer.fromJson<int>(json['status']),
      progress: serializer.fromJson<double>(json['progress']),
      objectJsonMap: serializer.fromJson<String>(json['objectJsonMap']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'taskId': serializer.toJson<String>(taskId),
      'url': serializer.toJson<String>(url),
      'filename': serializer.toJson<String>(filename),
      'group': serializer.toJson<String>(group),
      'metaData': serializer.toJson<String>(metaData),
      'creationTime': serializer.toJson<int>(creationTime),
      'status': serializer.toJson<int>(status),
      'progress': serializer.toJson<double>(progress),
      'objectJsonMap': serializer.toJson<String>(objectJsonMap),
    };
  }

  i1.TaskRecordEntityData copyWith({
    String? taskId,
    String? url,
    String? filename,
    String? group,
    String? metaData,
    int? creationTime,
    int? status,
    double? progress,
    String? objectJsonMap,
  }) => i1.TaskRecordEntityData(
    taskId: taskId ?? this.taskId,
    url: url ?? this.url,
    filename: filename ?? this.filename,
    group: group ?? this.group,
    metaData: metaData ?? this.metaData,
    creationTime: creationTime ?? this.creationTime,
    status: status ?? this.status,
    progress: progress ?? this.progress,
    objectJsonMap: objectJsonMap ?? this.objectJsonMap,
  );
  TaskRecordEntityData copyWithCompanion(i1.TaskRecordEntityCompanion data) {
    return TaskRecordEntityData(
      taskId: data.taskId.present ? data.taskId.value : this.taskId,
      url: data.url.present ? data.url.value : this.url,
      filename: data.filename.present ? data.filename.value : this.filename,
      group: data.group.present ? data.group.value : this.group,
      metaData: data.metaData.present ? data.metaData.value : this.metaData,
      creationTime: data.creationTime.present
          ? data.creationTime.value
          : this.creationTime,
      status: data.status.present ? data.status.value : this.status,
      progress: data.progress.present ? data.progress.value : this.progress,
      objectJsonMap: data.objectJsonMap.present
          ? data.objectJsonMap.value
          : this.objectJsonMap,
    );
  }

  @override
  String toString() {
    return (StringBuffer('TaskRecordEntityData(')
          ..write('taskId: $taskId, ')
          ..write('url: $url, ')
          ..write('filename: $filename, ')
          ..write('group: $group, ')
          ..write('metaData: $metaData, ')
          ..write('creationTime: $creationTime, ')
          ..write('status: $status, ')
          ..write('progress: $progress, ')
          ..write('objectJsonMap: $objectJsonMap')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    taskId,
    url,
    filename,
    group,
    metaData,
    creationTime,
    status,
    progress,
    objectJsonMap,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.TaskRecordEntityData &&
          other.taskId == this.taskId &&
          other.url == this.url &&
          other.filename == this.filename &&
          other.group == this.group &&
          other.metaData == this.metaData &&
          other.creationTime == this.creationTime &&
          other.status == this.status &&
          other.progress == this.progress &&
          other.objectJsonMap == this.objectJsonMap);
}

class TaskRecordEntityCompanion
    extends i0.UpdateCompanion<i1.TaskRecordEntityData> {
  final i0.Value<String> taskId;
  final i0.Value<String> url;
  final i0.Value<String> filename;
  final i0.Value<String> group;
  final i0.Value<String> metaData;
  final i0.Value<int> creationTime;
  final i0.Value<int> status;
  final i0.Value<double> progress;
  final i0.Value<String> objectJsonMap;
  const TaskRecordEntityCompanion({
    this.taskId = const i0.Value.absent(),
    this.url = const i0.Value.absent(),
    this.filename = const i0.Value.absent(),
    this.group = const i0.Value.absent(),
    this.metaData = const i0.Value.absent(),
    this.creationTime = const i0.Value.absent(),
    this.status = const i0.Value.absent(),
    this.progress = const i0.Value.absent(),
    this.objectJsonMap = const i0.Value.absent(),
  });
  TaskRecordEntityCompanion.insert({
    required String taskId,
    required String url,
    required String filename,
    required String group,
    required String metaData,
    required int creationTime,
    required int status,
    required double progress,
    required String objectJsonMap,
  }) : taskId = i0.Value(taskId),
       url = i0.Value(url),
       filename = i0.Value(filename),
       group = i0.Value(group),
       metaData = i0.Value(metaData),
       creationTime = i0.Value(creationTime),
       status = i0.Value(status),
       progress = i0.Value(progress),
       objectJsonMap = i0.Value(objectJsonMap);
  static i0.Insertable<i1.TaskRecordEntityData> custom({
    i0.Expression<String>? taskId,
    i0.Expression<String>? url,
    i0.Expression<String>? filename,
    i0.Expression<String>? group,
    i0.Expression<String>? metaData,
    i0.Expression<int>? creationTime,
    i0.Expression<int>? status,
    i0.Expression<double>? progress,
    i0.Expression<String>? objectJsonMap,
  }) {
    return i0.RawValuesInsertable({
      if (taskId != null) 'task_id': taskId,
      if (url != null) 'url': url,
      if (filename != null) 'filename': filename,
      if (group != null) 'group': group,
      if (metaData != null) 'meta_data': metaData,
      if (creationTime != null) 'creation_time': creationTime,
      if (status != null) 'status': status,
      if (progress != null) 'progress': progress,
      if (objectJsonMap != null) 'object_json_map': objectJsonMap,
    });
  }

  i1.TaskRecordEntityCompanion copyWith({
    i0.Value<String>? taskId,
    i0.Value<String>? url,
    i0.Value<String>? filename,
    i0.Value<String>? group,
    i0.Value<String>? metaData,
    i0.Value<int>? creationTime,
    i0.Value<int>? status,
    i0.Value<double>? progress,
    i0.Value<String>? objectJsonMap,
  }) {
    return i1.TaskRecordEntityCompanion(
      taskId: taskId ?? this.taskId,
      url: url ?? this.url,
      filename: filename ?? this.filename,
      group: group ?? this.group,
      metaData: metaData ?? this.metaData,
      creationTime: creationTime ?? this.creationTime,
      status: status ?? this.status,
      progress: progress ?? this.progress,
      objectJsonMap: objectJsonMap ?? this.objectJsonMap,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (taskId.present) {
      map['task_id'] = i0.Variable<String>(taskId.value);
    }
    if (url.present) {
      map['url'] = i0.Variable<String>(url.value);
    }
    if (filename.present) {
      map['filename'] = i0.Variable<String>(filename.value);
    }
    if (group.present) {
      map['group'] = i0.Variable<String>(group.value);
    }
    if (metaData.present) {
      map['meta_data'] = i0.Variable<String>(metaData.value);
    }
    if (creationTime.present) {
      map['creation_time'] = i0.Variable<int>(creationTime.value);
    }
    if (status.present) {
      map['status'] = i0.Variable<int>(status.value);
    }
    if (progress.present) {
      map['progress'] = i0.Variable<double>(progress.value);
    }
    if (objectJsonMap.present) {
      map['object_json_map'] = i0.Variable<String>(objectJsonMap.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('TaskRecordEntityCompanion(')
          ..write('taskId: $taskId, ')
          ..write('url: $url, ')
          ..write('filename: $filename, ')
          ..write('group: $group, ')
          ..write('metaData: $metaData, ')
          ..write('creationTime: $creationTime, ')
          ..write('status: $status, ')
          ..write('progress: $progress, ')
          ..write('objectJsonMap: $objectJsonMap')
          ..write(')'))
        .toString();
  }
}

class $PausedTasksEntityTable extends i2.PausedTasksEntity
    with i0.TableInfo<$PausedTasksEntityTable, i1.PausedTasksEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $PausedTasksEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _taskIdMeta = const i0.VerificationMeta(
    'taskId',
  );
  @override
  late final i0.GeneratedColumn<String> taskId = i0.GeneratedColumn<String>(
    'task_id',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _modifiedMeta = const i0.VerificationMeta(
    'modified',
  );
  @override
  late final i0.GeneratedColumn<int> modified = i0.GeneratedColumn<int>(
    'modified',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _objectJsonMapMeta =
      const i0.VerificationMeta('objectJsonMap');
  @override
  late final i0.GeneratedColumn<String> objectJsonMap =
      i0.GeneratedColumn<String>(
        'object_json_map',
        aliasedName,
        false,
        type: i0.DriftSqlType.string,
        requiredDuringInsert: true,
      );
  @override
  List<i0.GeneratedColumn> get $columns => [taskId, modified, objectJsonMap];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'paused_tasks_entity';
  @override
  i0.VerificationContext validateIntegrity(
    i0.Insertable<i1.PausedTasksEntityData> instance, {
    bool isInserting = false,
  }) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('task_id')) {
      context.handle(
        _taskIdMeta,
        taskId.isAcceptableOrUnknown(data['task_id']!, _taskIdMeta),
      );
    } else if (isInserting) {
      context.missing(_taskIdMeta);
    }
    if (data.containsKey('modified')) {
      context.handle(
        _modifiedMeta,
        modified.isAcceptableOrUnknown(data['modified']!, _modifiedMeta),
      );
    } else if (isInserting) {
      context.missing(_modifiedMeta);
    }
    if (data.containsKey('object_json_map')) {
      context.handle(
        _objectJsonMapMeta,
        objectJsonMap.isAcceptableOrUnknown(
          data['object_json_map']!,
          _objectJsonMapMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_objectJsonMapMeta);
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {taskId};
  @override
  i1.PausedTasksEntityData map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.PausedTasksEntityData(
      taskId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}task_id'],
      )!,
      modified: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}modified'],
      )!,
      objectJsonMap: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}object_json_map'],
      )!,
    );
  }

  @override
  $PausedTasksEntityTable createAlias(String alias) {
    return $PausedTasksEntityTable(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class PausedTasksEntityData extends i0.DataClass
    implements i0.Insertable<i1.PausedTasksEntityData> {
  final String taskId;
  final int modified;
  final String objectJsonMap;
  const PausedTasksEntityData({
    required this.taskId,
    required this.modified,
    required this.objectJsonMap,
  });
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['task_id'] = i0.Variable<String>(taskId);
    map['modified'] = i0.Variable<int>(modified);
    map['object_json_map'] = i0.Variable<String>(objectJsonMap);
    return map;
  }

  factory PausedTasksEntityData.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return PausedTasksEntityData(
      taskId: serializer.fromJson<String>(json['taskId']),
      modified: serializer.fromJson<int>(json['modified']),
      objectJsonMap: serializer.fromJson<String>(json['objectJsonMap']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'taskId': serializer.toJson<String>(taskId),
      'modified': serializer.toJson<int>(modified),
      'objectJsonMap': serializer.toJson<String>(objectJsonMap),
    };
  }

  i1.PausedTasksEntityData copyWith({
    String? taskId,
    int? modified,
    String? objectJsonMap,
  }) => i1.PausedTasksEntityData(
    taskId: taskId ?? this.taskId,
    modified: modified ?? this.modified,
    objectJsonMap: objectJsonMap ?? this.objectJsonMap,
  );
  PausedTasksEntityData copyWithCompanion(i1.PausedTasksEntityCompanion data) {
    return PausedTasksEntityData(
      taskId: data.taskId.present ? data.taskId.value : this.taskId,
      modified: data.modified.present ? data.modified.value : this.modified,
      objectJsonMap: data.objectJsonMap.present
          ? data.objectJsonMap.value
          : this.objectJsonMap,
    );
  }

  @override
  String toString() {
    return (StringBuffer('PausedTasksEntityData(')
          ..write('taskId: $taskId, ')
          ..write('modified: $modified, ')
          ..write('objectJsonMap: $objectJsonMap')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(taskId, modified, objectJsonMap);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.PausedTasksEntityData &&
          other.taskId == this.taskId &&
          other.modified == this.modified &&
          other.objectJsonMap == this.objectJsonMap);
}

class PausedTasksEntityCompanion
    extends i0.UpdateCompanion<i1.PausedTasksEntityData> {
  final i0.Value<String> taskId;
  final i0.Value<int> modified;
  final i0.Value<String> objectJsonMap;
  const PausedTasksEntityCompanion({
    this.taskId = const i0.Value.absent(),
    this.modified = const i0.Value.absent(),
    this.objectJsonMap = const i0.Value.absent(),
  });
  PausedTasksEntityCompanion.insert({
    required String taskId,
    required int modified,
    required String objectJsonMap,
  }) : taskId = i0.Value(taskId),
       modified = i0.Value(modified),
       objectJsonMap = i0.Value(objectJsonMap);
  static i0.Insertable<i1.PausedTasksEntityData> custom({
    i0.Expression<String>? taskId,
    i0.Expression<int>? modified,
    i0.Expression<String>? objectJsonMap,
  }) {
    return i0.RawValuesInsertable({
      if (taskId != null) 'task_id': taskId,
      if (modified != null) 'modified': modified,
      if (objectJsonMap != null) 'object_json_map': objectJsonMap,
    });
  }

  i1.PausedTasksEntityCompanion copyWith({
    i0.Value<String>? taskId,
    i0.Value<int>? modified,
    i0.Value<String>? objectJsonMap,
  }) {
    return i1.PausedTasksEntityCompanion(
      taskId: taskId ?? this.taskId,
      modified: modified ?? this.modified,
      objectJsonMap: objectJsonMap ?? this.objectJsonMap,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (taskId.present) {
      map['task_id'] = i0.Variable<String>(taskId.value);
    }
    if (modified.present) {
      map['modified'] = i0.Variable<int>(modified.value);
    }
    if (objectJsonMap.present) {
      map['object_json_map'] = i0.Variable<String>(objectJsonMap.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('PausedTasksEntityCompanion(')
          ..write('taskId: $taskId, ')
          ..write('modified: $modified, ')
          ..write('objectJsonMap: $objectJsonMap')
          ..write(')'))
        .toString();
  }
}

class $ModifiedTasksEntityTable extends i2.ModifiedTasksEntity
    with i0.TableInfo<$ModifiedTasksEntityTable, i1.ModifiedTasksEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $ModifiedTasksEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _taskIdMeta = const i0.VerificationMeta(
    'taskId',
  );
  @override
  late final i0.GeneratedColumn<String> taskId = i0.GeneratedColumn<String>(
    'task_id',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _modifiedMeta = const i0.VerificationMeta(
    'modified',
  );
  @override
  late final i0.GeneratedColumn<int> modified = i0.GeneratedColumn<int>(
    'modified',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _objectJsonMapMeta =
      const i0.VerificationMeta('objectJsonMap');
  @override
  late final i0.GeneratedColumn<String> objectJsonMap =
      i0.GeneratedColumn<String>(
        'object_json_map',
        aliasedName,
        false,
        type: i0.DriftSqlType.string,
        requiredDuringInsert: true,
      );
  @override
  List<i0.GeneratedColumn> get $columns => [taskId, modified, objectJsonMap];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'modified_tasks_entity';
  @override
  i0.VerificationContext validateIntegrity(
    i0.Insertable<i1.ModifiedTasksEntityData> instance, {
    bool isInserting = false,
  }) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('task_id')) {
      context.handle(
        _taskIdMeta,
        taskId.isAcceptableOrUnknown(data['task_id']!, _taskIdMeta),
      );
    } else if (isInserting) {
      context.missing(_taskIdMeta);
    }
    if (data.containsKey('modified')) {
      context.handle(
        _modifiedMeta,
        modified.isAcceptableOrUnknown(data['modified']!, _modifiedMeta),
      );
    } else if (isInserting) {
      context.missing(_modifiedMeta);
    }
    if (data.containsKey('object_json_map')) {
      context.handle(
        _objectJsonMapMeta,
        objectJsonMap.isAcceptableOrUnknown(
          data['object_json_map']!,
          _objectJsonMapMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_objectJsonMapMeta);
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {taskId};
  @override
  i1.ModifiedTasksEntityData map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.ModifiedTasksEntityData(
      taskId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}task_id'],
      )!,
      modified: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}modified'],
      )!,
      objectJsonMap: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}object_json_map'],
      )!,
    );
  }

  @override
  $ModifiedTasksEntityTable createAlias(String alias) {
    return $ModifiedTasksEntityTable(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class ModifiedTasksEntityData extends i0.DataClass
    implements i0.Insertable<i1.ModifiedTasksEntityData> {
  final String taskId;
  final int modified;
  final String objectJsonMap;
  const ModifiedTasksEntityData({
    required this.taskId,
    required this.modified,
    required this.objectJsonMap,
  });
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['task_id'] = i0.Variable<String>(taskId);
    map['modified'] = i0.Variable<int>(modified);
    map['object_json_map'] = i0.Variable<String>(objectJsonMap);
    return map;
  }

  factory ModifiedTasksEntityData.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return ModifiedTasksEntityData(
      taskId: serializer.fromJson<String>(json['taskId']),
      modified: serializer.fromJson<int>(json['modified']),
      objectJsonMap: serializer.fromJson<String>(json['objectJsonMap']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'taskId': serializer.toJson<String>(taskId),
      'modified': serializer.toJson<int>(modified),
      'objectJsonMap': serializer.toJson<String>(objectJsonMap),
    };
  }

  i1.ModifiedTasksEntityData copyWith({
    String? taskId,
    int? modified,
    String? objectJsonMap,
  }) => i1.ModifiedTasksEntityData(
    taskId: taskId ?? this.taskId,
    modified: modified ?? this.modified,
    objectJsonMap: objectJsonMap ?? this.objectJsonMap,
  );
  ModifiedTasksEntityData copyWithCompanion(
    i1.ModifiedTasksEntityCompanion data,
  ) {
    return ModifiedTasksEntityData(
      taskId: data.taskId.present ? data.taskId.value : this.taskId,
      modified: data.modified.present ? data.modified.value : this.modified,
      objectJsonMap: data.objectJsonMap.present
          ? data.objectJsonMap.value
          : this.objectJsonMap,
    );
  }

  @override
  String toString() {
    return (StringBuffer('ModifiedTasksEntityData(')
          ..write('taskId: $taskId, ')
          ..write('modified: $modified, ')
          ..write('objectJsonMap: $objectJsonMap')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(taskId, modified, objectJsonMap);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.ModifiedTasksEntityData &&
          other.taskId == this.taskId &&
          other.modified == this.modified &&
          other.objectJsonMap == this.objectJsonMap);
}

class ModifiedTasksEntityCompanion
    extends i0.UpdateCompanion<i1.ModifiedTasksEntityData> {
  final i0.Value<String> taskId;
  final i0.Value<int> modified;
  final i0.Value<String> objectJsonMap;
  const ModifiedTasksEntityCompanion({
    this.taskId = const i0.Value.absent(),
    this.modified = const i0.Value.absent(),
    this.objectJsonMap = const i0.Value.absent(),
  });
  ModifiedTasksEntityCompanion.insert({
    required String taskId,
    required int modified,
    required String objectJsonMap,
  }) : taskId = i0.Value(taskId),
       modified = i0.Value(modified),
       objectJsonMap = i0.Value(objectJsonMap);
  static i0.Insertable<i1.ModifiedTasksEntityData> custom({
    i0.Expression<String>? taskId,
    i0.Expression<int>? modified,
    i0.Expression<String>? objectJsonMap,
  }) {
    return i0.RawValuesInsertable({
      if (taskId != null) 'task_id': taskId,
      if (modified != null) 'modified': modified,
      if (objectJsonMap != null) 'object_json_map': objectJsonMap,
    });
  }

  i1.ModifiedTasksEntityCompanion copyWith({
    i0.Value<String>? taskId,
    i0.Value<int>? modified,
    i0.Value<String>? objectJsonMap,
  }) {
    return i1.ModifiedTasksEntityCompanion(
      taskId: taskId ?? this.taskId,
      modified: modified ?? this.modified,
      objectJsonMap: objectJsonMap ?? this.objectJsonMap,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (taskId.present) {
      map['task_id'] = i0.Variable<String>(taskId.value);
    }
    if (modified.present) {
      map['modified'] = i0.Variable<int>(modified.value);
    }
    if (objectJsonMap.present) {
      map['object_json_map'] = i0.Variable<String>(objectJsonMap.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('ModifiedTasksEntityCompanion(')
          ..write('taskId: $taskId, ')
          ..write('modified: $modified, ')
          ..write('objectJsonMap: $objectJsonMap')
          ..write(')'))
        .toString();
  }
}

class $ResumeTasksEntityTable extends i2.ResumeTasksEntity
    with i0.TableInfo<$ResumeTasksEntityTable, i1.ResumeTasksEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $ResumeTasksEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _taskIdMeta = const i0.VerificationMeta(
    'taskId',
  );
  @override
  late final i0.GeneratedColumn<String> taskId = i0.GeneratedColumn<String>(
    'task_id',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _modifiedMeta = const i0.VerificationMeta(
    'modified',
  );
  @override
  late final i0.GeneratedColumn<int> modified = i0.GeneratedColumn<int>(
    'modified',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _objectJsonMapMeta =
      const i0.VerificationMeta('objectJsonMap');
  @override
  late final i0.GeneratedColumn<String> objectJsonMap =
      i0.GeneratedColumn<String>(
        'object_json_map',
        aliasedName,
        false,
        type: i0.DriftSqlType.string,
        requiredDuringInsert: true,
      );
  @override
  List<i0.GeneratedColumn> get $columns => [taskId, modified, objectJsonMap];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'resume_tasks_entity';
  @override
  i0.VerificationContext validateIntegrity(
    i0.Insertable<i1.ResumeTasksEntityData> instance, {
    bool isInserting = false,
  }) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('task_id')) {
      context.handle(
        _taskIdMeta,
        taskId.isAcceptableOrUnknown(data['task_id']!, _taskIdMeta),
      );
    } else if (isInserting) {
      context.missing(_taskIdMeta);
    }
    if (data.containsKey('modified')) {
      context.handle(
        _modifiedMeta,
        modified.isAcceptableOrUnknown(data['modified']!, _modifiedMeta),
      );
    } else if (isInserting) {
      context.missing(_modifiedMeta);
    }
    if (data.containsKey('object_json_map')) {
      context.handle(
        _objectJsonMapMeta,
        objectJsonMap.isAcceptableOrUnknown(
          data['object_json_map']!,
          _objectJsonMapMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_objectJsonMapMeta);
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {taskId};
  @override
  i1.ResumeTasksEntityData map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.ResumeTasksEntityData(
      taskId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}task_id'],
      )!,
      modified: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}modified'],
      )!,
      objectJsonMap: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}object_json_map'],
      )!,
    );
  }

  @override
  $ResumeTasksEntityTable createAlias(String alias) {
    return $ResumeTasksEntityTable(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class ResumeTasksEntityData extends i0.DataClass
    implements i0.Insertable<i1.ResumeTasksEntityData> {
  final String taskId;
  final int modified;
  final String objectJsonMap;
  const ResumeTasksEntityData({
    required this.taskId,
    required this.modified,
    required this.objectJsonMap,
  });
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['task_id'] = i0.Variable<String>(taskId);
    map['modified'] = i0.Variable<int>(modified);
    map['object_json_map'] = i0.Variable<String>(objectJsonMap);
    return map;
  }

  factory ResumeTasksEntityData.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return ResumeTasksEntityData(
      taskId: serializer.fromJson<String>(json['taskId']),
      modified: serializer.fromJson<int>(json['modified']),
      objectJsonMap: serializer.fromJson<String>(json['objectJsonMap']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'taskId': serializer.toJson<String>(taskId),
      'modified': serializer.toJson<int>(modified),
      'objectJsonMap': serializer.toJson<String>(objectJsonMap),
    };
  }

  i1.ResumeTasksEntityData copyWith({
    String? taskId,
    int? modified,
    String? objectJsonMap,
  }) => i1.ResumeTasksEntityData(
    taskId: taskId ?? this.taskId,
    modified: modified ?? this.modified,
    objectJsonMap: objectJsonMap ?? this.objectJsonMap,
  );
  ResumeTasksEntityData copyWithCompanion(i1.ResumeTasksEntityCompanion data) {
    return ResumeTasksEntityData(
      taskId: data.taskId.present ? data.taskId.value : this.taskId,
      modified: data.modified.present ? data.modified.value : this.modified,
      objectJsonMap: data.objectJsonMap.present
          ? data.objectJsonMap.value
          : this.objectJsonMap,
    );
  }

  @override
  String toString() {
    return (StringBuffer('ResumeTasksEntityData(')
          ..write('taskId: $taskId, ')
          ..write('modified: $modified, ')
          ..write('objectJsonMap: $objectJsonMap')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(taskId, modified, objectJsonMap);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.ResumeTasksEntityData &&
          other.taskId == this.taskId &&
          other.modified == this.modified &&
          other.objectJsonMap == this.objectJsonMap);
}

class ResumeTasksEntityCompanion
    extends i0.UpdateCompanion<i1.ResumeTasksEntityData> {
  final i0.Value<String> taskId;
  final i0.Value<int> modified;
  final i0.Value<String> objectJsonMap;
  const ResumeTasksEntityCompanion({
    this.taskId = const i0.Value.absent(),
    this.modified = const i0.Value.absent(),
    this.objectJsonMap = const i0.Value.absent(),
  });
  ResumeTasksEntityCompanion.insert({
    required String taskId,
    required int modified,
    required String objectJsonMap,
  }) : taskId = i0.Value(taskId),
       modified = i0.Value(modified),
       objectJsonMap = i0.Value(objectJsonMap);
  static i0.Insertable<i1.ResumeTasksEntityData> custom({
    i0.Expression<String>? taskId,
    i0.Expression<int>? modified,
    i0.Expression<String>? objectJsonMap,
  }) {
    return i0.RawValuesInsertable({
      if (taskId != null) 'task_id': taskId,
      if (modified != null) 'modified': modified,
      if (objectJsonMap != null) 'object_json_map': objectJsonMap,
    });
  }

  i1.ResumeTasksEntityCompanion copyWith({
    i0.Value<String>? taskId,
    i0.Value<int>? modified,
    i0.Value<String>? objectJsonMap,
  }) {
    return i1.ResumeTasksEntityCompanion(
      taskId: taskId ?? this.taskId,
      modified: modified ?? this.modified,
      objectJsonMap: objectJsonMap ?? this.objectJsonMap,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (taskId.present) {
      map['task_id'] = i0.Variable<String>(taskId.value);
    }
    if (modified.present) {
      map['modified'] = i0.Variable<int>(modified.value);
    }
    if (objectJsonMap.present) {
      map['object_json_map'] = i0.Variable<String>(objectJsonMap.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('ResumeTasksEntityCompanion(')
          ..write('taskId: $taskId, ')
          ..write('modified: $modified, ')
          ..write('objectJsonMap: $objectJsonMap')
          ..write(')'))
        .toString();
  }
}
