// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/upload_tasks.drift.dart'
    as i1;
import 'package:drift/internal/modular.dart' as i2;

typedef $UploadTasksCreateCompanionBuilder =
    i1.UploadTasksCompanion Function({
      i0.Value<int?> id,
      required int attempts,
      required int createdAt,
      i0.Value<String?> filePath,
      i0.Value<int?> isLivePhoto,
      i0.Value<int?> lastError,
      i0.Value<String?> livePhotoVideoId,
      required String localId,
      required int method,
      required double priority,
      i0.Value<int?> retryAfter,
      required int status,
    });
typedef $UploadTasksUpdateCompanionBuilder =
    i1.UploadTasksCompanion Function({
      i0.Value<int?> id,
      i0.Value<int> attempts,
      i0.Value<int> createdAt,
      i0.Value<String?> filePath,
      i0.Value<int?> isLivePhoto,
      i0.Value<int?> lastError,
      i0.Value<String?> livePhotoVideoId,
      i0.Value<String> localId,
      i0.Value<int> method,
      i0.Value<double> priority,
      i0.Value<int?> retryAfter,
      i0.Value<int> status,
    });

class $UploadTasksFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.UploadTasks> {
  $UploadTasksFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get attempts => $composableBuilder(
    column: $table.attempts,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<String> get filePath => $composableBuilder(
    column: $table.filePath,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get isLivePhoto => $composableBuilder(
    column: $table.isLivePhoto,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get lastError => $composableBuilder(
    column: $table.lastError,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<String> get livePhotoVideoId => $composableBuilder(
    column: $table.livePhotoVideoId,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<String> get localId => $composableBuilder(
    column: $table.localId,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get method => $composableBuilder(
    column: $table.method,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<double> get priority => $composableBuilder(
    column: $table.priority,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get retryAfter => $composableBuilder(
    column: $table.retryAfter,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => i0.ColumnFilters(column),
  );
}

class $UploadTasksOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.UploadTasks> {
  $UploadTasksOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get attempts => $composableBuilder(
    column: $table.attempts,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get filePath => $composableBuilder(
    column: $table.filePath,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get isLivePhoto => $composableBuilder(
    column: $table.isLivePhoto,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get lastError => $composableBuilder(
    column: $table.lastError,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get livePhotoVideoId => $composableBuilder(
    column: $table.livePhotoVideoId,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get localId => $composableBuilder(
    column: $table.localId,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get method => $composableBuilder(
    column: $table.method,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<double> get priority => $composableBuilder(
    column: $table.priority,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get retryAfter => $composableBuilder(
    column: $table.retryAfter,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => i0.ColumnOrderings(column),
  );
}

class $UploadTasksAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.UploadTasks> {
  $UploadTasksAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  i0.GeneratedColumn<int> get attempts =>
      $composableBuilder(column: $table.attempts, builder: (column) => column);

  i0.GeneratedColumn<int> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  i0.GeneratedColumn<String> get filePath =>
      $composableBuilder(column: $table.filePath, builder: (column) => column);

  i0.GeneratedColumn<int> get isLivePhoto => $composableBuilder(
    column: $table.isLivePhoto,
    builder: (column) => column,
  );

  i0.GeneratedColumn<int> get lastError =>
      $composableBuilder(column: $table.lastError, builder: (column) => column);

  i0.GeneratedColumn<String> get livePhotoVideoId => $composableBuilder(
    column: $table.livePhotoVideoId,
    builder: (column) => column,
  );

  i0.GeneratedColumn<String> get localId =>
      $composableBuilder(column: $table.localId, builder: (column) => column);

  i0.GeneratedColumn<int> get method =>
      $composableBuilder(column: $table.method, builder: (column) => column);

  i0.GeneratedColumn<double> get priority =>
      $composableBuilder(column: $table.priority, builder: (column) => column);

  i0.GeneratedColumn<int> get retryAfter => $composableBuilder(
    column: $table.retryAfter,
    builder: (column) => column,
  );

  i0.GeneratedColumn<int> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);
}

class $UploadTasksTableManager
    extends
        i0.RootTableManager<
          i0.GeneratedDatabase,
          i1.UploadTasks,
          i1.UploadTask,
          i1.$UploadTasksFilterComposer,
          i1.$UploadTasksOrderingComposer,
          i1.$UploadTasksAnnotationComposer,
          $UploadTasksCreateCompanionBuilder,
          $UploadTasksUpdateCompanionBuilder,
          (
            i1.UploadTask,
            i0.BaseReferences<
              i0.GeneratedDatabase,
              i1.UploadTasks,
              i1.UploadTask
            >,
          ),
          i1.UploadTask,
          i0.PrefetchHooks Function()
        > {
  $UploadTasksTableManager(i0.GeneratedDatabase db, i1.UploadTasks table)
    : super(
        i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$UploadTasksFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              i1.$UploadTasksOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              i1.$UploadTasksAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                i0.Value<int?> id = const i0.Value.absent(),
                i0.Value<int> attempts = const i0.Value.absent(),
                i0.Value<int> createdAt = const i0.Value.absent(),
                i0.Value<String?> filePath = const i0.Value.absent(),
                i0.Value<int?> isLivePhoto = const i0.Value.absent(),
                i0.Value<int?> lastError = const i0.Value.absent(),
                i0.Value<String?> livePhotoVideoId = const i0.Value.absent(),
                i0.Value<String> localId = const i0.Value.absent(),
                i0.Value<int> method = const i0.Value.absent(),
                i0.Value<double> priority = const i0.Value.absent(),
                i0.Value<int?> retryAfter = const i0.Value.absent(),
                i0.Value<int> status = const i0.Value.absent(),
              }) => i1.UploadTasksCompanion(
                id: id,
                attempts: attempts,
                createdAt: createdAt,
                filePath: filePath,
                isLivePhoto: isLivePhoto,
                lastError: lastError,
                livePhotoVideoId: livePhotoVideoId,
                localId: localId,
                method: method,
                priority: priority,
                retryAfter: retryAfter,
                status: status,
              ),
          createCompanionCallback:
              ({
                i0.Value<int?> id = const i0.Value.absent(),
                required int attempts,
                required int createdAt,
                i0.Value<String?> filePath = const i0.Value.absent(),
                i0.Value<int?> isLivePhoto = const i0.Value.absent(),
                i0.Value<int?> lastError = const i0.Value.absent(),
                i0.Value<String?> livePhotoVideoId = const i0.Value.absent(),
                required String localId,
                required int method,
                required double priority,
                i0.Value<int?> retryAfter = const i0.Value.absent(),
                required int status,
              }) => i1.UploadTasksCompanion.insert(
                id: id,
                attempts: attempts,
                createdAt: createdAt,
                filePath: filePath,
                isLivePhoto: isLivePhoto,
                lastError: lastError,
                livePhotoVideoId: livePhotoVideoId,
                localId: localId,
                method: method,
                priority: priority,
                retryAfter: retryAfter,
                status: status,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), i0.BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $UploadTasksProcessedTableManager =
    i0.ProcessedTableManager<
      i0.GeneratedDatabase,
      i1.UploadTasks,
      i1.UploadTask,
      i1.$UploadTasksFilterComposer,
      i1.$UploadTasksOrderingComposer,
      i1.$UploadTasksAnnotationComposer,
      $UploadTasksCreateCompanionBuilder,
      $UploadTasksUpdateCompanionBuilder,
      (
        i1.UploadTask,
        i0.BaseReferences<i0.GeneratedDatabase, i1.UploadTasks, i1.UploadTask>,
      ),
      i1.UploadTask,
      i0.PrefetchHooks Function()
    >;
typedef $UploadTaskStatsCreateCompanionBuilder =
    i1.UploadTaskStatsCompanion Function({
      required int pendingDownloads,
      required int pendingUploads,
      required int queuedDownloads,
      required int queuedUploads,
      required int failedDownloads,
      required int failedUploads,
      required int completedUploads,
      required int skippedUploads,
      i0.Value<int> rowid,
    });
typedef $UploadTaskStatsUpdateCompanionBuilder =
    i1.UploadTaskStatsCompanion Function({
      i0.Value<int> pendingDownloads,
      i0.Value<int> pendingUploads,
      i0.Value<int> queuedDownloads,
      i0.Value<int> queuedUploads,
      i0.Value<int> failedDownloads,
      i0.Value<int> failedUploads,
      i0.Value<int> completedUploads,
      i0.Value<int> skippedUploads,
      i0.Value<int> rowid,
    });

class $UploadTaskStatsFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.UploadTaskStats> {
  $UploadTaskStatsFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnFilters<int> get pendingDownloads => $composableBuilder(
    column: $table.pendingDownloads,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get pendingUploads => $composableBuilder(
    column: $table.pendingUploads,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get queuedDownloads => $composableBuilder(
    column: $table.queuedDownloads,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get queuedUploads => $composableBuilder(
    column: $table.queuedUploads,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get failedDownloads => $composableBuilder(
    column: $table.failedDownloads,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get failedUploads => $composableBuilder(
    column: $table.failedUploads,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get completedUploads => $composableBuilder(
    column: $table.completedUploads,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get skippedUploads => $composableBuilder(
    column: $table.skippedUploads,
    builder: (column) => i0.ColumnFilters(column),
  );
}

class $UploadTaskStatsOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.UploadTaskStats> {
  $UploadTaskStatsOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnOrderings<int> get pendingDownloads => $composableBuilder(
    column: $table.pendingDownloads,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get pendingUploads => $composableBuilder(
    column: $table.pendingUploads,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get queuedDownloads => $composableBuilder(
    column: $table.queuedDownloads,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get queuedUploads => $composableBuilder(
    column: $table.queuedUploads,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get failedDownloads => $composableBuilder(
    column: $table.failedDownloads,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get failedUploads => $composableBuilder(
    column: $table.failedUploads,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get completedUploads => $composableBuilder(
    column: $table.completedUploads,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get skippedUploads => $composableBuilder(
    column: $table.skippedUploads,
    builder: (column) => i0.ColumnOrderings(column),
  );
}

class $UploadTaskStatsAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.UploadTaskStats> {
  $UploadTaskStatsAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<int> get pendingDownloads => $composableBuilder(
    column: $table.pendingDownloads,
    builder: (column) => column,
  );

  i0.GeneratedColumn<int> get pendingUploads => $composableBuilder(
    column: $table.pendingUploads,
    builder: (column) => column,
  );

  i0.GeneratedColumn<int> get queuedDownloads => $composableBuilder(
    column: $table.queuedDownloads,
    builder: (column) => column,
  );

  i0.GeneratedColumn<int> get queuedUploads => $composableBuilder(
    column: $table.queuedUploads,
    builder: (column) => column,
  );

  i0.GeneratedColumn<int> get failedDownloads => $composableBuilder(
    column: $table.failedDownloads,
    builder: (column) => column,
  );

  i0.GeneratedColumn<int> get failedUploads => $composableBuilder(
    column: $table.failedUploads,
    builder: (column) => column,
  );

  i0.GeneratedColumn<int> get completedUploads => $composableBuilder(
    column: $table.completedUploads,
    builder: (column) => column,
  );

  i0.GeneratedColumn<int> get skippedUploads => $composableBuilder(
    column: $table.skippedUploads,
    builder: (column) => column,
  );
}

class $UploadTaskStatsTableManager
    extends
        i0.RootTableManager<
          i0.GeneratedDatabase,
          i1.UploadTaskStats,
          i1.UploadTaskStat,
          i1.$UploadTaskStatsFilterComposer,
          i1.$UploadTaskStatsOrderingComposer,
          i1.$UploadTaskStatsAnnotationComposer,
          $UploadTaskStatsCreateCompanionBuilder,
          $UploadTaskStatsUpdateCompanionBuilder,
          (
            i1.UploadTaskStat,
            i0.BaseReferences<
              i0.GeneratedDatabase,
              i1.UploadTaskStats,
              i1.UploadTaskStat
            >,
          ),
          i1.UploadTaskStat,
          i0.PrefetchHooks Function()
        > {
  $UploadTaskStatsTableManager(
    i0.GeneratedDatabase db,
    i1.UploadTaskStats table,
  ) : super(
        i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$UploadTaskStatsFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              i1.$UploadTaskStatsOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              i1.$UploadTaskStatsAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                i0.Value<int> pendingDownloads = const i0.Value.absent(),
                i0.Value<int> pendingUploads = const i0.Value.absent(),
                i0.Value<int> queuedDownloads = const i0.Value.absent(),
                i0.Value<int> queuedUploads = const i0.Value.absent(),
                i0.Value<int> failedDownloads = const i0.Value.absent(),
                i0.Value<int> failedUploads = const i0.Value.absent(),
                i0.Value<int> completedUploads = const i0.Value.absent(),
                i0.Value<int> skippedUploads = const i0.Value.absent(),
                i0.Value<int> rowid = const i0.Value.absent(),
              }) => i1.UploadTaskStatsCompanion(
                pendingDownloads: pendingDownloads,
                pendingUploads: pendingUploads,
                queuedDownloads: queuedDownloads,
                queuedUploads: queuedUploads,
                failedDownloads: failedDownloads,
                failedUploads: failedUploads,
                completedUploads: completedUploads,
                skippedUploads: skippedUploads,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required int pendingDownloads,
                required int pendingUploads,
                required int queuedDownloads,
                required int queuedUploads,
                required int failedDownloads,
                required int failedUploads,
                required int completedUploads,
                required int skippedUploads,
                i0.Value<int> rowid = const i0.Value.absent(),
              }) => i1.UploadTaskStatsCompanion.insert(
                pendingDownloads: pendingDownloads,
                pendingUploads: pendingUploads,
                queuedDownloads: queuedDownloads,
                queuedUploads: queuedUploads,
                failedDownloads: failedDownloads,
                failedUploads: failedUploads,
                completedUploads: completedUploads,
                skippedUploads: skippedUploads,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), i0.BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $UploadTaskStatsProcessedTableManager =
    i0.ProcessedTableManager<
      i0.GeneratedDatabase,
      i1.UploadTaskStats,
      i1.UploadTaskStat,
      i1.$UploadTaskStatsFilterComposer,
      i1.$UploadTaskStatsOrderingComposer,
      i1.$UploadTaskStatsAnnotationComposer,
      $UploadTaskStatsCreateCompanionBuilder,
      $UploadTaskStatsUpdateCompanionBuilder,
      (
        i1.UploadTaskStat,
        i0.BaseReferences<
          i0.GeneratedDatabase,
          i1.UploadTaskStats,
          i1.UploadTaskStat
        >,
      ),
      i1.UploadTaskStat,
      i0.PrefetchHooks Function()
    >;

class UploadTasks extends i0.Table
    with i0.TableInfo<UploadTasks, i1.UploadTask> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  UploadTasks(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _idMeta = const i0.VerificationMeta('id');
  late final i0.GeneratedColumn<int> id = i0.GeneratedColumn<int>(
    'id',
    aliasedName,
    true,
    hasAutoIncrement: true,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: false,
    $customConstraints: 'PRIMARY KEY AUTOINCREMENT',
  );
  static const i0.VerificationMeta _attemptsMeta = const i0.VerificationMeta(
    'attempts',
  );
  late final i0.GeneratedColumn<int> attempts = i0.GeneratedColumn<int>(
    'attempts',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: true,
    $customConstraints: 'NOT NULL',
  );
  static const i0.VerificationMeta _createdAtMeta = const i0.VerificationMeta(
    'createdAt',
  );
  late final i0.GeneratedColumn<int> createdAt = i0.GeneratedColumn<int>(
    'created_at',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: true,
    $customConstraints: 'NOT NULL',
  );
  static const i0.VerificationMeta _filePathMeta = const i0.VerificationMeta(
    'filePath',
  );
  late final i0.GeneratedColumn<String> filePath = i0.GeneratedColumn<String>(
    'file_path',
    aliasedName,
    true,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: false,
    $customConstraints: '',
  );
  static const i0.VerificationMeta _isLivePhotoMeta = const i0.VerificationMeta(
    'isLivePhoto',
  );
  late final i0.GeneratedColumn<int> isLivePhoto = i0.GeneratedColumn<int>(
    'is_live_photo',
    aliasedName,
    true,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: false,
    $customConstraints: '',
  );
  static const i0.VerificationMeta _lastErrorMeta = const i0.VerificationMeta(
    'lastError',
  );
  late final i0.GeneratedColumn<int> lastError = i0.GeneratedColumn<int>(
    'last_error',
    aliasedName,
    true,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: false,
    $customConstraints: '',
  );
  static const i0.VerificationMeta _livePhotoVideoIdMeta =
      const i0.VerificationMeta('livePhotoVideoId');
  late final i0.GeneratedColumn<String> livePhotoVideoId =
      i0.GeneratedColumn<String>(
        'live_photo_video_id',
        aliasedName,
        true,
        type: i0.DriftSqlType.string,
        requiredDuringInsert: false,
        $customConstraints: '',
      );
  static const i0.VerificationMeta _localIdMeta = const i0.VerificationMeta(
    'localId',
  );
  late final i0.GeneratedColumn<String> localId = i0.GeneratedColumn<String>(
    'local_id',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
    $customConstraints: 'NOT NULL',
  );
  static const i0.VerificationMeta _methodMeta = const i0.VerificationMeta(
    'method',
  );
  late final i0.GeneratedColumn<int> method = i0.GeneratedColumn<int>(
    'method',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: true,
    $customConstraints: 'NOT NULL',
  );
  static const i0.VerificationMeta _priorityMeta = const i0.VerificationMeta(
    'priority',
  );
  late final i0.GeneratedColumn<double> priority = i0.GeneratedColumn<double>(
    'priority',
    aliasedName,
    false,
    type: i0.DriftSqlType.double,
    requiredDuringInsert: true,
    $customConstraints: 'NOT NULL',
  );
  static const i0.VerificationMeta _retryAfterMeta = const i0.VerificationMeta(
    'retryAfter',
  );
  late final i0.GeneratedColumn<int> retryAfter = i0.GeneratedColumn<int>(
    'retry_after',
    aliasedName,
    true,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: false,
    $customConstraints: '',
  );
  static const i0.VerificationMeta _statusMeta = const i0.VerificationMeta(
    'status',
  );
  late final i0.GeneratedColumn<int> status = i0.GeneratedColumn<int>(
    'status',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: true,
    $customConstraints: 'NOT NULL',
  );
  @override
  List<i0.GeneratedColumn> get $columns => [
    id,
    attempts,
    createdAt,
    filePath,
    isLivePhoto,
    lastError,
    livePhotoVideoId,
    localId,
    method,
    priority,
    retryAfter,
    status,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'upload_tasks';
  @override
  i0.VerificationContext validateIntegrity(
    i0.Insertable<i1.UploadTask> instance, {
    bool isInserting = false,
  }) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('attempts')) {
      context.handle(
        _attemptsMeta,
        attempts.isAcceptableOrUnknown(data['attempts']!, _attemptsMeta),
      );
    } else if (isInserting) {
      context.missing(_attemptsMeta);
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('file_path')) {
      context.handle(
        _filePathMeta,
        filePath.isAcceptableOrUnknown(data['file_path']!, _filePathMeta),
      );
    }
    if (data.containsKey('is_live_photo')) {
      context.handle(
        _isLivePhotoMeta,
        isLivePhoto.isAcceptableOrUnknown(
          data['is_live_photo']!,
          _isLivePhotoMeta,
        ),
      );
    }
    if (data.containsKey('last_error')) {
      context.handle(
        _lastErrorMeta,
        lastError.isAcceptableOrUnknown(data['last_error']!, _lastErrorMeta),
      );
    }
    if (data.containsKey('live_photo_video_id')) {
      context.handle(
        _livePhotoVideoIdMeta,
        livePhotoVideoId.isAcceptableOrUnknown(
          data['live_photo_video_id']!,
          _livePhotoVideoIdMeta,
        ),
      );
    }
    if (data.containsKey('local_id')) {
      context.handle(
        _localIdMeta,
        localId.isAcceptableOrUnknown(data['local_id']!, _localIdMeta),
      );
    } else if (isInserting) {
      context.missing(_localIdMeta);
    }
    if (data.containsKey('method')) {
      context.handle(
        _methodMeta,
        method.isAcceptableOrUnknown(data['method']!, _methodMeta),
      );
    } else if (isInserting) {
      context.missing(_methodMeta);
    }
    if (data.containsKey('priority')) {
      context.handle(
        _priorityMeta,
        priority.isAcceptableOrUnknown(data['priority']!, _priorityMeta),
      );
    } else if (isInserting) {
      context.missing(_priorityMeta);
    }
    if (data.containsKey('retry_after')) {
      context.handle(
        _retryAfterMeta,
        retryAfter.isAcceptableOrUnknown(data['retry_after']!, _retryAfterMeta),
      );
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    } else if (isInserting) {
      context.missing(_statusMeta);
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {id};
  @override
  i1.UploadTask map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.UploadTask(
      id: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}id'],
      ),
      attempts: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}attempts'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}created_at'],
      )!,
      filePath: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}file_path'],
      ),
      isLivePhoto: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}is_live_photo'],
      ),
      lastError: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}last_error'],
      ),
      livePhotoVideoId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}live_photo_video_id'],
      ),
      localId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}local_id'],
      )!,
      method: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}method'],
      )!,
      priority: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.double,
        data['${effectivePrefix}priority'],
      )!,
      retryAfter: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}retry_after'],
      ),
      status: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}status'],
      )!,
    );
  }

  @override
  UploadTasks createAlias(String alias) {
    return UploadTasks(attachedDatabase, alias);
  }

  @override
  bool get dontWriteConstraints => true;
}

class UploadTask extends i0.DataClass implements i0.Insertable<i1.UploadTask> {
  final int? id;
  final int attempts;
  final int createdAt;
  final String? filePath;
  final int? isLivePhoto;
  final int? lastError;
  final String? livePhotoVideoId;
  final String localId;
  final int method;
  final double priority;
  final int? retryAfter;
  final int status;
  const UploadTask({
    this.id,
    required this.attempts,
    required this.createdAt,
    this.filePath,
    this.isLivePhoto,
    this.lastError,
    this.livePhotoVideoId,
    required this.localId,
    required this.method,
    required this.priority,
    this.retryAfter,
    required this.status,
  });
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (!nullToAbsent || id != null) {
      map['id'] = i0.Variable<int>(id);
    }
    map['attempts'] = i0.Variable<int>(attempts);
    map['created_at'] = i0.Variable<int>(createdAt);
    if (!nullToAbsent || filePath != null) {
      map['file_path'] = i0.Variable<String>(filePath);
    }
    if (!nullToAbsent || isLivePhoto != null) {
      map['is_live_photo'] = i0.Variable<int>(isLivePhoto);
    }
    if (!nullToAbsent || lastError != null) {
      map['last_error'] = i0.Variable<int>(lastError);
    }
    if (!nullToAbsent || livePhotoVideoId != null) {
      map['live_photo_video_id'] = i0.Variable<String>(livePhotoVideoId);
    }
    map['local_id'] = i0.Variable<String>(localId);
    map['method'] = i0.Variable<int>(method);
    map['priority'] = i0.Variable<double>(priority);
    if (!nullToAbsent || retryAfter != null) {
      map['retry_after'] = i0.Variable<int>(retryAfter);
    }
    map['status'] = i0.Variable<int>(status);
    return map;
  }

  factory UploadTask.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return UploadTask(
      id: serializer.fromJson<int?>(json['id']),
      attempts: serializer.fromJson<int>(json['attempts']),
      createdAt: serializer.fromJson<int>(json['created_at']),
      filePath: serializer.fromJson<String?>(json['file_path']),
      isLivePhoto: serializer.fromJson<int?>(json['is_live_photo']),
      lastError: serializer.fromJson<int?>(json['last_error']),
      livePhotoVideoId: serializer.fromJson<String?>(
        json['live_photo_video_id'],
      ),
      localId: serializer.fromJson<String>(json['local_id']),
      method: serializer.fromJson<int>(json['method']),
      priority: serializer.fromJson<double>(json['priority']),
      retryAfter: serializer.fromJson<int?>(json['retry_after']),
      status: serializer.fromJson<int>(json['status']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int?>(id),
      'attempts': serializer.toJson<int>(attempts),
      'created_at': serializer.toJson<int>(createdAt),
      'file_path': serializer.toJson<String?>(filePath),
      'is_live_photo': serializer.toJson<int?>(isLivePhoto),
      'last_error': serializer.toJson<int?>(lastError),
      'live_photo_video_id': serializer.toJson<String?>(livePhotoVideoId),
      'local_id': serializer.toJson<String>(localId),
      'method': serializer.toJson<int>(method),
      'priority': serializer.toJson<double>(priority),
      'retry_after': serializer.toJson<int?>(retryAfter),
      'status': serializer.toJson<int>(status),
    };
  }

  i1.UploadTask copyWith({
    i0.Value<int?> id = const i0.Value.absent(),
    int? attempts,
    int? createdAt,
    i0.Value<String?> filePath = const i0.Value.absent(),
    i0.Value<int?> isLivePhoto = const i0.Value.absent(),
    i0.Value<int?> lastError = const i0.Value.absent(),
    i0.Value<String?> livePhotoVideoId = const i0.Value.absent(),
    String? localId,
    int? method,
    double? priority,
    i0.Value<int?> retryAfter = const i0.Value.absent(),
    int? status,
  }) => i1.UploadTask(
    id: id.present ? id.value : this.id,
    attempts: attempts ?? this.attempts,
    createdAt: createdAt ?? this.createdAt,
    filePath: filePath.present ? filePath.value : this.filePath,
    isLivePhoto: isLivePhoto.present ? isLivePhoto.value : this.isLivePhoto,
    lastError: lastError.present ? lastError.value : this.lastError,
    livePhotoVideoId: livePhotoVideoId.present
        ? livePhotoVideoId.value
        : this.livePhotoVideoId,
    localId: localId ?? this.localId,
    method: method ?? this.method,
    priority: priority ?? this.priority,
    retryAfter: retryAfter.present ? retryAfter.value : this.retryAfter,
    status: status ?? this.status,
  );
  UploadTask copyWithCompanion(i1.UploadTasksCompanion data) {
    return UploadTask(
      id: data.id.present ? data.id.value : this.id,
      attempts: data.attempts.present ? data.attempts.value : this.attempts,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      filePath: data.filePath.present ? data.filePath.value : this.filePath,
      isLivePhoto: data.isLivePhoto.present
          ? data.isLivePhoto.value
          : this.isLivePhoto,
      lastError: data.lastError.present ? data.lastError.value : this.lastError,
      livePhotoVideoId: data.livePhotoVideoId.present
          ? data.livePhotoVideoId.value
          : this.livePhotoVideoId,
      localId: data.localId.present ? data.localId.value : this.localId,
      method: data.method.present ? data.method.value : this.method,
      priority: data.priority.present ? data.priority.value : this.priority,
      retryAfter: data.retryAfter.present
          ? data.retryAfter.value
          : this.retryAfter,
      status: data.status.present ? data.status.value : this.status,
    );
  }

  @override
  String toString() {
    return (StringBuffer('UploadTask(')
          ..write('id: $id, ')
          ..write('attempts: $attempts, ')
          ..write('createdAt: $createdAt, ')
          ..write('filePath: $filePath, ')
          ..write('isLivePhoto: $isLivePhoto, ')
          ..write('lastError: $lastError, ')
          ..write('livePhotoVideoId: $livePhotoVideoId, ')
          ..write('localId: $localId, ')
          ..write('method: $method, ')
          ..write('priority: $priority, ')
          ..write('retryAfter: $retryAfter, ')
          ..write('status: $status')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    attempts,
    createdAt,
    filePath,
    isLivePhoto,
    lastError,
    livePhotoVideoId,
    localId,
    method,
    priority,
    retryAfter,
    status,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.UploadTask &&
          other.id == this.id &&
          other.attempts == this.attempts &&
          other.createdAt == this.createdAt &&
          other.filePath == this.filePath &&
          other.isLivePhoto == this.isLivePhoto &&
          other.lastError == this.lastError &&
          other.livePhotoVideoId == this.livePhotoVideoId &&
          other.localId == this.localId &&
          other.method == this.method &&
          other.priority == this.priority &&
          other.retryAfter == this.retryAfter &&
          other.status == this.status);
}

class UploadTasksCompanion extends i0.UpdateCompanion<i1.UploadTask> {
  final i0.Value<int?> id;
  final i0.Value<int> attempts;
  final i0.Value<int> createdAt;
  final i0.Value<String?> filePath;
  final i0.Value<int?> isLivePhoto;
  final i0.Value<int?> lastError;
  final i0.Value<String?> livePhotoVideoId;
  final i0.Value<String> localId;
  final i0.Value<int> method;
  final i0.Value<double> priority;
  final i0.Value<int?> retryAfter;
  final i0.Value<int> status;
  const UploadTasksCompanion({
    this.id = const i0.Value.absent(),
    this.attempts = const i0.Value.absent(),
    this.createdAt = const i0.Value.absent(),
    this.filePath = const i0.Value.absent(),
    this.isLivePhoto = const i0.Value.absent(),
    this.lastError = const i0.Value.absent(),
    this.livePhotoVideoId = const i0.Value.absent(),
    this.localId = const i0.Value.absent(),
    this.method = const i0.Value.absent(),
    this.priority = const i0.Value.absent(),
    this.retryAfter = const i0.Value.absent(),
    this.status = const i0.Value.absent(),
  });
  UploadTasksCompanion.insert({
    this.id = const i0.Value.absent(),
    required int attempts,
    required int createdAt,
    this.filePath = const i0.Value.absent(),
    this.isLivePhoto = const i0.Value.absent(),
    this.lastError = const i0.Value.absent(),
    this.livePhotoVideoId = const i0.Value.absent(),
    required String localId,
    required int method,
    required double priority,
    this.retryAfter = const i0.Value.absent(),
    required int status,
  }) : attempts = i0.Value(attempts),
       createdAt = i0.Value(createdAt),
       localId = i0.Value(localId),
       method = i0.Value(method),
       priority = i0.Value(priority),
       status = i0.Value(status);
  static i0.Insertable<i1.UploadTask> custom({
    i0.Expression<int>? id,
    i0.Expression<int>? attempts,
    i0.Expression<int>? createdAt,
    i0.Expression<String>? filePath,
    i0.Expression<int>? isLivePhoto,
    i0.Expression<int>? lastError,
    i0.Expression<String>? livePhotoVideoId,
    i0.Expression<String>? localId,
    i0.Expression<int>? method,
    i0.Expression<double>? priority,
    i0.Expression<int>? retryAfter,
    i0.Expression<int>? status,
  }) {
    return i0.RawValuesInsertable({
      if (id != null) 'id': id,
      if (attempts != null) 'attempts': attempts,
      if (createdAt != null) 'created_at': createdAt,
      if (filePath != null) 'file_path': filePath,
      if (isLivePhoto != null) 'is_live_photo': isLivePhoto,
      if (lastError != null) 'last_error': lastError,
      if (livePhotoVideoId != null) 'live_photo_video_id': livePhotoVideoId,
      if (localId != null) 'local_id': localId,
      if (method != null) 'method': method,
      if (priority != null) 'priority': priority,
      if (retryAfter != null) 'retry_after': retryAfter,
      if (status != null) 'status': status,
    });
  }

  i1.UploadTasksCompanion copyWith({
    i0.Value<int?>? id,
    i0.Value<int>? attempts,
    i0.Value<int>? createdAt,
    i0.Value<String?>? filePath,
    i0.Value<int?>? isLivePhoto,
    i0.Value<int?>? lastError,
    i0.Value<String?>? livePhotoVideoId,
    i0.Value<String>? localId,
    i0.Value<int>? method,
    i0.Value<double>? priority,
    i0.Value<int?>? retryAfter,
    i0.Value<int>? status,
  }) {
    return i1.UploadTasksCompanion(
      id: id ?? this.id,
      attempts: attempts ?? this.attempts,
      createdAt: createdAt ?? this.createdAt,
      filePath: filePath ?? this.filePath,
      isLivePhoto: isLivePhoto ?? this.isLivePhoto,
      lastError: lastError ?? this.lastError,
      livePhotoVideoId: livePhotoVideoId ?? this.livePhotoVideoId,
      localId: localId ?? this.localId,
      method: method ?? this.method,
      priority: priority ?? this.priority,
      retryAfter: retryAfter ?? this.retryAfter,
      status: status ?? this.status,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (id.present) {
      map['id'] = i0.Variable<int>(id.value);
    }
    if (attempts.present) {
      map['attempts'] = i0.Variable<int>(attempts.value);
    }
    if (createdAt.present) {
      map['created_at'] = i0.Variable<int>(createdAt.value);
    }
    if (filePath.present) {
      map['file_path'] = i0.Variable<String>(filePath.value);
    }
    if (isLivePhoto.present) {
      map['is_live_photo'] = i0.Variable<int>(isLivePhoto.value);
    }
    if (lastError.present) {
      map['last_error'] = i0.Variable<int>(lastError.value);
    }
    if (livePhotoVideoId.present) {
      map['live_photo_video_id'] = i0.Variable<String>(livePhotoVideoId.value);
    }
    if (localId.present) {
      map['local_id'] = i0.Variable<String>(localId.value);
    }
    if (method.present) {
      map['method'] = i0.Variable<int>(method.value);
    }
    if (priority.present) {
      map['priority'] = i0.Variable<double>(priority.value);
    }
    if (retryAfter.present) {
      map['retry_after'] = i0.Variable<int>(retryAfter.value);
    }
    if (status.present) {
      map['status'] = i0.Variable<int>(status.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('UploadTasksCompanion(')
          ..write('id: $id, ')
          ..write('attempts: $attempts, ')
          ..write('createdAt: $createdAt, ')
          ..write('filePath: $filePath, ')
          ..write('isLivePhoto: $isLivePhoto, ')
          ..write('lastError: $lastError, ')
          ..write('livePhotoVideoId: $livePhotoVideoId, ')
          ..write('localId: $localId, ')
          ..write('method: $method, ')
          ..write('priority: $priority, ')
          ..write('retryAfter: $retryAfter, ')
          ..write('status: $status')
          ..write(')'))
        .toString();
  }
}

class UploadTaskStats extends i0.Table
    with i0.TableInfo<UploadTaskStats, i1.UploadTaskStat> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  UploadTaskStats(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _pendingDownloadsMeta =
      const i0.VerificationMeta('pendingDownloads');
  late final i0.GeneratedColumn<int> pendingDownloads = i0.GeneratedColumn<int>(
    'pending_downloads',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: true,
    $customConstraints: 'NOT NULL',
  );
  static const i0.VerificationMeta _pendingUploadsMeta =
      const i0.VerificationMeta('pendingUploads');
  late final i0.GeneratedColumn<int> pendingUploads = i0.GeneratedColumn<int>(
    'pending_uploads',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: true,
    $customConstraints: 'NOT NULL',
  );
  static const i0.VerificationMeta _queuedDownloadsMeta =
      const i0.VerificationMeta('queuedDownloads');
  late final i0.GeneratedColumn<int> queuedDownloads = i0.GeneratedColumn<int>(
    'queued_downloads',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: true,
    $customConstraints: 'NOT NULL',
  );
  static const i0.VerificationMeta _queuedUploadsMeta =
      const i0.VerificationMeta('queuedUploads');
  late final i0.GeneratedColumn<int> queuedUploads = i0.GeneratedColumn<int>(
    'queued_uploads',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: true,
    $customConstraints: 'NOT NULL',
  );
  static const i0.VerificationMeta _failedDownloadsMeta =
      const i0.VerificationMeta('failedDownloads');
  late final i0.GeneratedColumn<int> failedDownloads = i0.GeneratedColumn<int>(
    'failed_downloads',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: true,
    $customConstraints: 'NOT NULL',
  );
  static const i0.VerificationMeta _failedUploadsMeta =
      const i0.VerificationMeta('failedUploads');
  late final i0.GeneratedColumn<int> failedUploads = i0.GeneratedColumn<int>(
    'failed_uploads',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: true,
    $customConstraints: 'NOT NULL',
  );
  static const i0.VerificationMeta _completedUploadsMeta =
      const i0.VerificationMeta('completedUploads');
  late final i0.GeneratedColumn<int> completedUploads = i0.GeneratedColumn<int>(
    'completed_uploads',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: true,
    $customConstraints: 'NOT NULL',
  );
  static const i0.VerificationMeta _skippedUploadsMeta =
      const i0.VerificationMeta('skippedUploads');
  late final i0.GeneratedColumn<int> skippedUploads = i0.GeneratedColumn<int>(
    'skipped_uploads',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: true,
    $customConstraints: 'NOT NULL',
  );
  @override
  List<i0.GeneratedColumn> get $columns => [
    pendingDownloads,
    pendingUploads,
    queuedDownloads,
    queuedUploads,
    failedDownloads,
    failedUploads,
    completedUploads,
    skippedUploads,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'upload_task_stats';
  @override
  i0.VerificationContext validateIntegrity(
    i0.Insertable<i1.UploadTaskStat> instance, {
    bool isInserting = false,
  }) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('pending_downloads')) {
      context.handle(
        _pendingDownloadsMeta,
        pendingDownloads.isAcceptableOrUnknown(
          data['pending_downloads']!,
          _pendingDownloadsMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_pendingDownloadsMeta);
    }
    if (data.containsKey('pending_uploads')) {
      context.handle(
        _pendingUploadsMeta,
        pendingUploads.isAcceptableOrUnknown(
          data['pending_uploads']!,
          _pendingUploadsMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_pendingUploadsMeta);
    }
    if (data.containsKey('queued_downloads')) {
      context.handle(
        _queuedDownloadsMeta,
        queuedDownloads.isAcceptableOrUnknown(
          data['queued_downloads']!,
          _queuedDownloadsMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_queuedDownloadsMeta);
    }
    if (data.containsKey('queued_uploads')) {
      context.handle(
        _queuedUploadsMeta,
        queuedUploads.isAcceptableOrUnknown(
          data['queued_uploads']!,
          _queuedUploadsMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_queuedUploadsMeta);
    }
    if (data.containsKey('failed_downloads')) {
      context.handle(
        _failedDownloadsMeta,
        failedDownloads.isAcceptableOrUnknown(
          data['failed_downloads']!,
          _failedDownloadsMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_failedDownloadsMeta);
    }
    if (data.containsKey('failed_uploads')) {
      context.handle(
        _failedUploadsMeta,
        failedUploads.isAcceptableOrUnknown(
          data['failed_uploads']!,
          _failedUploadsMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_failedUploadsMeta);
    }
    if (data.containsKey('completed_uploads')) {
      context.handle(
        _completedUploadsMeta,
        completedUploads.isAcceptableOrUnknown(
          data['completed_uploads']!,
          _completedUploadsMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_completedUploadsMeta);
    }
    if (data.containsKey('skipped_uploads')) {
      context.handle(
        _skippedUploadsMeta,
        skippedUploads.isAcceptableOrUnknown(
          data['skipped_uploads']!,
          _skippedUploadsMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_skippedUploadsMeta);
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => const {};
  @override
  i1.UploadTaskStat map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.UploadTaskStat(
      pendingDownloads: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}pending_downloads'],
      )!,
      pendingUploads: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}pending_uploads'],
      )!,
      queuedDownloads: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}queued_downloads'],
      )!,
      queuedUploads: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}queued_uploads'],
      )!,
      failedDownloads: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}failed_downloads'],
      )!,
      failedUploads: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}failed_uploads'],
      )!,
      completedUploads: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}completed_uploads'],
      )!,
      skippedUploads: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}skipped_uploads'],
      )!,
    );
  }

  @override
  UploadTaskStats createAlias(String alias) {
    return UploadTaskStats(attachedDatabase, alias);
  }

  @override
  bool get dontWriteConstraints => true;
}

class UploadTaskStat extends i0.DataClass
    implements i0.Insertable<i1.UploadTaskStat> {
  final int pendingDownloads;
  final int pendingUploads;
  final int queuedDownloads;
  final int queuedUploads;
  final int failedDownloads;
  final int failedUploads;
  final int completedUploads;
  final int skippedUploads;
  const UploadTaskStat({
    required this.pendingDownloads,
    required this.pendingUploads,
    required this.queuedDownloads,
    required this.queuedUploads,
    required this.failedDownloads,
    required this.failedUploads,
    required this.completedUploads,
    required this.skippedUploads,
  });
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['pending_downloads'] = i0.Variable<int>(pendingDownloads);
    map['pending_uploads'] = i0.Variable<int>(pendingUploads);
    map['queued_downloads'] = i0.Variable<int>(queuedDownloads);
    map['queued_uploads'] = i0.Variable<int>(queuedUploads);
    map['failed_downloads'] = i0.Variable<int>(failedDownloads);
    map['failed_uploads'] = i0.Variable<int>(failedUploads);
    map['completed_uploads'] = i0.Variable<int>(completedUploads);
    map['skipped_uploads'] = i0.Variable<int>(skippedUploads);
    return map;
  }

  factory UploadTaskStat.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return UploadTaskStat(
      pendingDownloads: serializer.fromJson<int>(json['pending_downloads']),
      pendingUploads: serializer.fromJson<int>(json['pending_uploads']),
      queuedDownloads: serializer.fromJson<int>(json['queued_downloads']),
      queuedUploads: serializer.fromJson<int>(json['queued_uploads']),
      failedDownloads: serializer.fromJson<int>(json['failed_downloads']),
      failedUploads: serializer.fromJson<int>(json['failed_uploads']),
      completedUploads: serializer.fromJson<int>(json['completed_uploads']),
      skippedUploads: serializer.fromJson<int>(json['skipped_uploads']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'pending_downloads': serializer.toJson<int>(pendingDownloads),
      'pending_uploads': serializer.toJson<int>(pendingUploads),
      'queued_downloads': serializer.toJson<int>(queuedDownloads),
      'queued_uploads': serializer.toJson<int>(queuedUploads),
      'failed_downloads': serializer.toJson<int>(failedDownloads),
      'failed_uploads': serializer.toJson<int>(failedUploads),
      'completed_uploads': serializer.toJson<int>(completedUploads),
      'skipped_uploads': serializer.toJson<int>(skippedUploads),
    };
  }

  i1.UploadTaskStat copyWith({
    int? pendingDownloads,
    int? pendingUploads,
    int? queuedDownloads,
    int? queuedUploads,
    int? failedDownloads,
    int? failedUploads,
    int? completedUploads,
    int? skippedUploads,
  }) => i1.UploadTaskStat(
    pendingDownloads: pendingDownloads ?? this.pendingDownloads,
    pendingUploads: pendingUploads ?? this.pendingUploads,
    queuedDownloads: queuedDownloads ?? this.queuedDownloads,
    queuedUploads: queuedUploads ?? this.queuedUploads,
    failedDownloads: failedDownloads ?? this.failedDownloads,
    failedUploads: failedUploads ?? this.failedUploads,
    completedUploads: completedUploads ?? this.completedUploads,
    skippedUploads: skippedUploads ?? this.skippedUploads,
  );
  UploadTaskStat copyWithCompanion(i1.UploadTaskStatsCompanion data) {
    return UploadTaskStat(
      pendingDownloads: data.pendingDownloads.present
          ? data.pendingDownloads.value
          : this.pendingDownloads,
      pendingUploads: data.pendingUploads.present
          ? data.pendingUploads.value
          : this.pendingUploads,
      queuedDownloads: data.queuedDownloads.present
          ? data.queuedDownloads.value
          : this.queuedDownloads,
      queuedUploads: data.queuedUploads.present
          ? data.queuedUploads.value
          : this.queuedUploads,
      failedDownloads: data.failedDownloads.present
          ? data.failedDownloads.value
          : this.failedDownloads,
      failedUploads: data.failedUploads.present
          ? data.failedUploads.value
          : this.failedUploads,
      completedUploads: data.completedUploads.present
          ? data.completedUploads.value
          : this.completedUploads,
      skippedUploads: data.skippedUploads.present
          ? data.skippedUploads.value
          : this.skippedUploads,
    );
  }

  @override
  String toString() {
    return (StringBuffer('UploadTaskStat(')
          ..write('pendingDownloads: $pendingDownloads, ')
          ..write('pendingUploads: $pendingUploads, ')
          ..write('queuedDownloads: $queuedDownloads, ')
          ..write('queuedUploads: $queuedUploads, ')
          ..write('failedDownloads: $failedDownloads, ')
          ..write('failedUploads: $failedUploads, ')
          ..write('completedUploads: $completedUploads, ')
          ..write('skippedUploads: $skippedUploads')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    pendingDownloads,
    pendingUploads,
    queuedDownloads,
    queuedUploads,
    failedDownloads,
    failedUploads,
    completedUploads,
    skippedUploads,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.UploadTaskStat &&
          other.pendingDownloads == this.pendingDownloads &&
          other.pendingUploads == this.pendingUploads &&
          other.queuedDownloads == this.queuedDownloads &&
          other.queuedUploads == this.queuedUploads &&
          other.failedDownloads == this.failedDownloads &&
          other.failedUploads == this.failedUploads &&
          other.completedUploads == this.completedUploads &&
          other.skippedUploads == this.skippedUploads);
}

class UploadTaskStatsCompanion extends i0.UpdateCompanion<i1.UploadTaskStat> {
  final i0.Value<int> pendingDownloads;
  final i0.Value<int> pendingUploads;
  final i0.Value<int> queuedDownloads;
  final i0.Value<int> queuedUploads;
  final i0.Value<int> failedDownloads;
  final i0.Value<int> failedUploads;
  final i0.Value<int> completedUploads;
  final i0.Value<int> skippedUploads;
  final i0.Value<int> rowid;
  const UploadTaskStatsCompanion({
    this.pendingDownloads = const i0.Value.absent(),
    this.pendingUploads = const i0.Value.absent(),
    this.queuedDownloads = const i0.Value.absent(),
    this.queuedUploads = const i0.Value.absent(),
    this.failedDownloads = const i0.Value.absent(),
    this.failedUploads = const i0.Value.absent(),
    this.completedUploads = const i0.Value.absent(),
    this.skippedUploads = const i0.Value.absent(),
    this.rowid = const i0.Value.absent(),
  });
  UploadTaskStatsCompanion.insert({
    required int pendingDownloads,
    required int pendingUploads,
    required int queuedDownloads,
    required int queuedUploads,
    required int failedDownloads,
    required int failedUploads,
    required int completedUploads,
    required int skippedUploads,
    this.rowid = const i0.Value.absent(),
  }) : pendingDownloads = i0.Value(pendingDownloads),
       pendingUploads = i0.Value(pendingUploads),
       queuedDownloads = i0.Value(queuedDownloads),
       queuedUploads = i0.Value(queuedUploads),
       failedDownloads = i0.Value(failedDownloads),
       failedUploads = i0.Value(failedUploads),
       completedUploads = i0.Value(completedUploads),
       skippedUploads = i0.Value(skippedUploads);
  static i0.Insertable<i1.UploadTaskStat> custom({
    i0.Expression<int>? pendingDownloads,
    i0.Expression<int>? pendingUploads,
    i0.Expression<int>? queuedDownloads,
    i0.Expression<int>? queuedUploads,
    i0.Expression<int>? failedDownloads,
    i0.Expression<int>? failedUploads,
    i0.Expression<int>? completedUploads,
    i0.Expression<int>? skippedUploads,
    i0.Expression<int>? rowid,
  }) {
    return i0.RawValuesInsertable({
      if (pendingDownloads != null) 'pending_downloads': pendingDownloads,
      if (pendingUploads != null) 'pending_uploads': pendingUploads,
      if (queuedDownloads != null) 'queued_downloads': queuedDownloads,
      if (queuedUploads != null) 'queued_uploads': queuedUploads,
      if (failedDownloads != null) 'failed_downloads': failedDownloads,
      if (failedUploads != null) 'failed_uploads': failedUploads,
      if (completedUploads != null) 'completed_uploads': completedUploads,
      if (skippedUploads != null) 'skipped_uploads': skippedUploads,
      if (rowid != null) 'rowid': rowid,
    });
  }

  i1.UploadTaskStatsCompanion copyWith({
    i0.Value<int>? pendingDownloads,
    i0.Value<int>? pendingUploads,
    i0.Value<int>? queuedDownloads,
    i0.Value<int>? queuedUploads,
    i0.Value<int>? failedDownloads,
    i0.Value<int>? failedUploads,
    i0.Value<int>? completedUploads,
    i0.Value<int>? skippedUploads,
    i0.Value<int>? rowid,
  }) {
    return i1.UploadTaskStatsCompanion(
      pendingDownloads: pendingDownloads ?? this.pendingDownloads,
      pendingUploads: pendingUploads ?? this.pendingUploads,
      queuedDownloads: queuedDownloads ?? this.queuedDownloads,
      queuedUploads: queuedUploads ?? this.queuedUploads,
      failedDownloads: failedDownloads ?? this.failedDownloads,
      failedUploads: failedUploads ?? this.failedUploads,
      completedUploads: completedUploads ?? this.completedUploads,
      skippedUploads: skippedUploads ?? this.skippedUploads,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (pendingDownloads.present) {
      map['pending_downloads'] = i0.Variable<int>(pendingDownloads.value);
    }
    if (pendingUploads.present) {
      map['pending_uploads'] = i0.Variable<int>(pendingUploads.value);
    }
    if (queuedDownloads.present) {
      map['queued_downloads'] = i0.Variable<int>(queuedDownloads.value);
    }
    if (queuedUploads.present) {
      map['queued_uploads'] = i0.Variable<int>(queuedUploads.value);
    }
    if (failedDownloads.present) {
      map['failed_downloads'] = i0.Variable<int>(failedDownloads.value);
    }
    if (failedUploads.present) {
      map['failed_uploads'] = i0.Variable<int>(failedUploads.value);
    }
    if (completedUploads.present) {
      map['completed_uploads'] = i0.Variable<int>(completedUploads.value);
    }
    if (skippedUploads.present) {
      map['skipped_uploads'] = i0.Variable<int>(skippedUploads.value);
    }
    if (rowid.present) {
      map['rowid'] = i0.Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('UploadTaskStatsCompanion(')
          ..write('pendingDownloads: $pendingDownloads, ')
          ..write('pendingUploads: $pendingUploads, ')
          ..write('queuedDownloads: $queuedDownloads, ')
          ..write('queuedUploads: $queuedUploads, ')
          ..write('failedDownloads: $failedDownloads, ')
          ..write('failedUploads: $failedUploads, ')
          ..write('completedUploads: $completedUploads, ')
          ..write('skippedUploads: $skippedUploads, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

i0.Trigger get updateStatsInsert => i0.Trigger(
  'CREATE TRIGGER update_stats_insert BEFORE INSERT ON upload_tasks BEGIN UPDATE upload_task_stats SET pending_downloads = pending_downloads +(NEW.status = 0), queued_downloads = queued_downloads +(NEW.status = 1), failed_downloads = failed_downloads +(NEW.status = 2), pending_uploads = pending_uploads +(NEW.status = 3), queued_uploads = queued_uploads +(NEW.status = 4), failed_uploads = failed_uploads +(NEW.status = 5), completed_uploads = completed_uploads +(NEW.status = 6), skipped_uploads = skipped_uploads +(NEW.status = 7);END',
  'update_stats_insert',
);
i0.Trigger get updateStatsUpdate => i0.Trigger(
  'CREATE TRIGGER update_stats_update BEFORE UPDATE OF status ON upload_tasks WHEN OLD.status != NEW.status BEGIN UPDATE upload_task_stats SET pending_downloads = pending_downloads -(OLD.status = 0)+(NEW.status = 0), queued_downloads = queued_downloads -(OLD.status = 1)+(NEW.status = 1), failed_downloads = failed_downloads -(OLD.status = 2)+(NEW.status = 2), pending_uploads = pending_uploads -(OLD.status = 3)+(NEW.status = 3), queued_uploads = queued_uploads -(OLD.status = 4)+(NEW.status = 4), failed_uploads = failed_uploads -(OLD.status = 5)+(NEW.status = 5), completed_uploads = completed_uploads -(OLD.status = 6)+(NEW.status = 6), skipped_uploads = skipped_uploads -(OLD.status = 7)+(NEW.status = 7);END',
  'update_stats_update',
);
i0.Trigger get updateStatsDelete => i0.Trigger(
  'CREATE TRIGGER update_stats_delete BEFORE DELETE ON upload_tasks BEGIN UPDATE upload_task_stats SET pending_downloads = pending_downloads -(OLD.status = 0), queued_downloads = queued_downloads -(OLD.status = 1), failed_downloads = failed_downloads -(OLD.status = 2), pending_uploads = pending_uploads -(OLD.status = 3), queued_uploads = queued_uploads -(OLD.status = 4), failed_uploads = failed_uploads -(OLD.status = 5), completed_uploads = completed_uploads -(OLD.status = 6), skipped_uploads = skipped_uploads -(OLD.status = 7);END',
  'update_stats_delete',
);
i0.Index get idxUploadTasksLocalId => i0.Index(
  'idx_upload_tasks_local_id',
  'CREATE UNIQUE INDEX idx_upload_tasks_local_id ON upload_tasks (local_id, live_photo_video_id)',
);
i0.Index get idxUploadTasksAssetData => i0.Index(
  'idx_upload_tasks_asset_data',
  'CREATE INDEX idx_upload_tasks_asset_data ON upload_tasks (status, priority DESC, created_at)',
);
i0.OnCreateQuery get $drift0 => i0.OnCreateQuery(
  'INSERT INTO upload_task_stats VALUES (0, 0, 0, 0, 0, 0, 0, 0)',
);

class UploadTasksDrift extends i2.ModularAccessor {
  UploadTasksDrift(i0.GeneratedDatabase db) : super(db);
  i1.UploadTaskStats get uploadTaskStats => i2.ReadDatabaseContainer(
    attachedDatabase,
  ).resultSet<i1.UploadTaskStats>('upload_task_stats');
}
