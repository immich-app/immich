// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/upload_task.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/upload_task.entity.dart'
    as i2;

typedef $$UploadTaskEntityTableCreateCompanionBuilder =
    i1.UploadTaskEntityCompanion Function({
      i0.Value<int> id,
      required int attempts,
      required DateTime createdAt,
      required String filePath,
      i0.Value<bool?> isLivePhoto,
      i0.Value<int?> lastError,
      i0.Value<String?> livePhotoVideoId,
      required String localId,
      required int method,
      required double priority,
      i0.Value<DateTime?> retryAfter,
      required int status,
    });
typedef $$UploadTaskEntityTableUpdateCompanionBuilder =
    i1.UploadTaskEntityCompanion Function({
      i0.Value<int> id,
      i0.Value<int> attempts,
      i0.Value<DateTime> createdAt,
      i0.Value<String> filePath,
      i0.Value<bool?> isLivePhoto,
      i0.Value<int?> lastError,
      i0.Value<String?> livePhotoVideoId,
      i0.Value<String> localId,
      i0.Value<int> method,
      i0.Value<double> priority,
      i0.Value<DateTime?> retryAfter,
      i0.Value<int> status,
    });

class $$UploadTaskEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$UploadTaskEntityTable> {
  $$UploadTaskEntityTableFilterComposer({
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

  i0.ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<String> get filePath => $composableBuilder(
    column: $table.filePath,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<bool> get isLivePhoto => $composableBuilder(
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

  i0.ColumnFilters<DateTime> get retryAfter => $composableBuilder(
    column: $table.retryAfter,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => i0.ColumnFilters(column),
  );
}

class $$UploadTaskEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$UploadTaskEntityTable> {
  $$UploadTaskEntityTableOrderingComposer({
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

  i0.ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get filePath => $composableBuilder(
    column: $table.filePath,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<bool> get isLivePhoto => $composableBuilder(
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

  i0.ColumnOrderings<DateTime> get retryAfter => $composableBuilder(
    column: $table.retryAfter,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => i0.ColumnOrderings(column),
  );
}

class $$UploadTaskEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$UploadTaskEntityTable> {
  $$UploadTaskEntityTableAnnotationComposer({
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

  i0.GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  i0.GeneratedColumn<String> get filePath =>
      $composableBuilder(column: $table.filePath, builder: (column) => column);

  i0.GeneratedColumn<bool> get isLivePhoto => $composableBuilder(
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

  i0.GeneratedColumn<DateTime> get retryAfter => $composableBuilder(
    column: $table.retryAfter,
    builder: (column) => column,
  );

  i0.GeneratedColumn<int> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);
}

class $$UploadTaskEntityTableTableManager
    extends
        i0.RootTableManager<
          i0.GeneratedDatabase,
          i1.$UploadTaskEntityTable,
          i1.UploadTaskEntityData,
          i1.$$UploadTaskEntityTableFilterComposer,
          i1.$$UploadTaskEntityTableOrderingComposer,
          i1.$$UploadTaskEntityTableAnnotationComposer,
          $$UploadTaskEntityTableCreateCompanionBuilder,
          $$UploadTaskEntityTableUpdateCompanionBuilder,
          (
            i1.UploadTaskEntityData,
            i0.BaseReferences<
              i0.GeneratedDatabase,
              i1.$UploadTaskEntityTable,
              i1.UploadTaskEntityData
            >,
          ),
          i1.UploadTaskEntityData,
          i0.PrefetchHooks Function()
        > {
  $$UploadTaskEntityTableTableManager(
    i0.GeneratedDatabase db,
    i1.$UploadTaskEntityTable table,
  ) : super(
        i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$UploadTaskEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () => i1
              .$$UploadTaskEntityTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              i1.$$UploadTaskEntityTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                i0.Value<int> id = const i0.Value.absent(),
                i0.Value<int> attempts = const i0.Value.absent(),
                i0.Value<DateTime> createdAt = const i0.Value.absent(),
                i0.Value<String> filePath = const i0.Value.absent(),
                i0.Value<bool?> isLivePhoto = const i0.Value.absent(),
                i0.Value<int?> lastError = const i0.Value.absent(),
                i0.Value<String?> livePhotoVideoId = const i0.Value.absent(),
                i0.Value<String> localId = const i0.Value.absent(),
                i0.Value<int> method = const i0.Value.absent(),
                i0.Value<double> priority = const i0.Value.absent(),
                i0.Value<DateTime?> retryAfter = const i0.Value.absent(),
                i0.Value<int> status = const i0.Value.absent(),
              }) => i1.UploadTaskEntityCompanion(
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
                i0.Value<int> id = const i0.Value.absent(),
                required int attempts,
                required DateTime createdAt,
                required String filePath,
                i0.Value<bool?> isLivePhoto = const i0.Value.absent(),
                i0.Value<int?> lastError = const i0.Value.absent(),
                i0.Value<String?> livePhotoVideoId = const i0.Value.absent(),
                required String localId,
                required int method,
                required double priority,
                i0.Value<DateTime?> retryAfter = const i0.Value.absent(),
                required int status,
              }) => i1.UploadTaskEntityCompanion.insert(
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

typedef $$UploadTaskEntityTableProcessedTableManager =
    i0.ProcessedTableManager<
      i0.GeneratedDatabase,
      i1.$UploadTaskEntityTable,
      i1.UploadTaskEntityData,
      i1.$$UploadTaskEntityTableFilterComposer,
      i1.$$UploadTaskEntityTableOrderingComposer,
      i1.$$UploadTaskEntityTableAnnotationComposer,
      $$UploadTaskEntityTableCreateCompanionBuilder,
      $$UploadTaskEntityTableUpdateCompanionBuilder,
      (
        i1.UploadTaskEntityData,
        i0.BaseReferences<
          i0.GeneratedDatabase,
          i1.$UploadTaskEntityTable,
          i1.UploadTaskEntityData
        >,
      ),
      i1.UploadTaskEntityData,
      i0.PrefetchHooks Function()
    >;
i0.Index get idxUploadTasksLocalId => i0.Index(
  'idx_upload_tasks_local_id',
  'CREATE INDEX IF NOT EXISTS idx_upload_tasks_local_id ON upload_task_entity (local_id)',
);

class $UploadTaskEntityTable extends i2.UploadTaskEntity
    with i0.TableInfo<$UploadTaskEntityTable, i1.UploadTaskEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $UploadTaskEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _idMeta = const i0.VerificationMeta('id');
  @override
  late final i0.GeneratedColumn<int> id = i0.GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const i0.VerificationMeta _attemptsMeta = const i0.VerificationMeta(
    'attempts',
  );
  @override
  late final i0.GeneratedColumn<int> attempts = i0.GeneratedColumn<int>(
    'attempts',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _createdAtMeta = const i0.VerificationMeta(
    'createdAt',
  );
  @override
  late final i0.GeneratedColumn<DateTime> createdAt =
      i0.GeneratedColumn<DateTime>(
        'created_at',
        aliasedName,
        false,
        type: i0.DriftSqlType.dateTime,
        requiredDuringInsert: true,
      );
  static const i0.VerificationMeta _filePathMeta = const i0.VerificationMeta(
    'filePath',
  );
  @override
  late final i0.GeneratedColumn<String> filePath = i0.GeneratedColumn<String>(
    'file_path',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _isLivePhotoMeta = const i0.VerificationMeta(
    'isLivePhoto',
  );
  @override
  late final i0.GeneratedColumn<bool> isLivePhoto = i0.GeneratedColumn<bool>(
    'is_live_photo',
    aliasedName,
    true,
    type: i0.DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
      'CHECK ("is_live_photo" IN (0, 1))',
    ),
  );
  static const i0.VerificationMeta _lastErrorMeta = const i0.VerificationMeta(
    'lastError',
  );
  @override
  late final i0.GeneratedColumn<int> lastError = i0.GeneratedColumn<int>(
    'last_error',
    aliasedName,
    true,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: false,
  );
  static const i0.VerificationMeta _livePhotoVideoIdMeta =
      const i0.VerificationMeta('livePhotoVideoId');
  @override
  late final i0.GeneratedColumn<String> livePhotoVideoId =
      i0.GeneratedColumn<String>(
        'live_photo_video_id',
        aliasedName,
        true,
        type: i0.DriftSqlType.string,
        requiredDuringInsert: false,
      );
  static const i0.VerificationMeta _localIdMeta = const i0.VerificationMeta(
    'localId',
  );
  @override
  late final i0.GeneratedColumn<String> localId = i0.GeneratedColumn<String>(
    'local_id',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _methodMeta = const i0.VerificationMeta(
    'method',
  );
  @override
  late final i0.GeneratedColumn<int> method = i0.GeneratedColumn<int>(
    'method',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _priorityMeta = const i0.VerificationMeta(
    'priority',
  );
  @override
  late final i0.GeneratedColumn<double> priority = i0.GeneratedColumn<double>(
    'priority',
    aliasedName,
    false,
    type: i0.DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _retryAfterMeta = const i0.VerificationMeta(
    'retryAfter',
  );
  @override
  late final i0.GeneratedColumn<DateTime> retryAfter =
      i0.GeneratedColumn<DateTime>(
        'retry_after',
        aliasedName,
        true,
        type: i0.DriftSqlType.dateTime,
        requiredDuringInsert: false,
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
  static const String $name = 'upload_task_entity';
  @override
  i0.VerificationContext validateIntegrity(
    i0.Insertable<i1.UploadTaskEntityData> instance, {
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
    } else if (isInserting) {
      context.missing(_filePathMeta);
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
  i1.UploadTaskEntityData map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.UploadTaskEntityData(
      id: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      attempts: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}attempts'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      filePath: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}file_path'],
      )!,
      isLivePhoto: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.bool,
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
        i0.DriftSqlType.dateTime,
        data['${effectivePrefix}retry_after'],
      ),
      status: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}status'],
      )!,
    );
  }

  @override
  $UploadTaskEntityTable createAlias(String alias) {
    return $UploadTaskEntityTable(attachedDatabase, alias);
  }

  @override
  bool get isStrict => true;
}

class UploadTaskEntityData extends i0.DataClass
    implements i0.Insertable<i1.UploadTaskEntityData> {
  final int id;
  final int attempts;
  final DateTime createdAt;
  final String filePath;
  final bool? isLivePhoto;
  final int? lastError;
  final String? livePhotoVideoId;
  final String localId;
  final int method;
  final double priority;
  final DateTime? retryAfter;
  final int status;
  const UploadTaskEntityData({
    required this.id,
    required this.attempts,
    required this.createdAt,
    required this.filePath,
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
    map['id'] = i0.Variable<int>(id);
    map['attempts'] = i0.Variable<int>(attempts);
    map['created_at'] = i0.Variable<DateTime>(createdAt);
    map['file_path'] = i0.Variable<String>(filePath);
    if (!nullToAbsent || isLivePhoto != null) {
      map['is_live_photo'] = i0.Variable<bool>(isLivePhoto);
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
      map['retry_after'] = i0.Variable<DateTime>(retryAfter);
    }
    map['status'] = i0.Variable<int>(status);
    return map;
  }

  factory UploadTaskEntityData.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return UploadTaskEntityData(
      id: serializer.fromJson<int>(json['id']),
      attempts: serializer.fromJson<int>(json['attempts']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      filePath: serializer.fromJson<String>(json['filePath']),
      isLivePhoto: serializer.fromJson<bool?>(json['isLivePhoto']),
      lastError: serializer.fromJson<int?>(json['lastError']),
      livePhotoVideoId: serializer.fromJson<String?>(json['livePhotoVideoId']),
      localId: serializer.fromJson<String>(json['localId']),
      method: serializer.fromJson<int>(json['method']),
      priority: serializer.fromJson<double>(json['priority']),
      retryAfter: serializer.fromJson<DateTime?>(json['retryAfter']),
      status: serializer.fromJson<int>(json['status']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'attempts': serializer.toJson<int>(attempts),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'filePath': serializer.toJson<String>(filePath),
      'isLivePhoto': serializer.toJson<bool?>(isLivePhoto),
      'lastError': serializer.toJson<int?>(lastError),
      'livePhotoVideoId': serializer.toJson<String?>(livePhotoVideoId),
      'localId': serializer.toJson<String>(localId),
      'method': serializer.toJson<int>(method),
      'priority': serializer.toJson<double>(priority),
      'retryAfter': serializer.toJson<DateTime?>(retryAfter),
      'status': serializer.toJson<int>(status),
    };
  }

  i1.UploadTaskEntityData copyWith({
    int? id,
    int? attempts,
    DateTime? createdAt,
    String? filePath,
    i0.Value<bool?> isLivePhoto = const i0.Value.absent(),
    i0.Value<int?> lastError = const i0.Value.absent(),
    i0.Value<String?> livePhotoVideoId = const i0.Value.absent(),
    String? localId,
    int? method,
    double? priority,
    i0.Value<DateTime?> retryAfter = const i0.Value.absent(),
    int? status,
  }) => i1.UploadTaskEntityData(
    id: id ?? this.id,
    attempts: attempts ?? this.attempts,
    createdAt: createdAt ?? this.createdAt,
    filePath: filePath ?? this.filePath,
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
  UploadTaskEntityData copyWithCompanion(i1.UploadTaskEntityCompanion data) {
    return UploadTaskEntityData(
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
    return (StringBuffer('UploadTaskEntityData(')
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
      (other is i1.UploadTaskEntityData &&
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

class UploadTaskEntityCompanion
    extends i0.UpdateCompanion<i1.UploadTaskEntityData> {
  final i0.Value<int> id;
  final i0.Value<int> attempts;
  final i0.Value<DateTime> createdAt;
  final i0.Value<String> filePath;
  final i0.Value<bool?> isLivePhoto;
  final i0.Value<int?> lastError;
  final i0.Value<String?> livePhotoVideoId;
  final i0.Value<String> localId;
  final i0.Value<int> method;
  final i0.Value<double> priority;
  final i0.Value<DateTime?> retryAfter;
  final i0.Value<int> status;
  const UploadTaskEntityCompanion({
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
  UploadTaskEntityCompanion.insert({
    this.id = const i0.Value.absent(),
    required int attempts,
    required DateTime createdAt,
    required String filePath,
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
       filePath = i0.Value(filePath),
       localId = i0.Value(localId),
       method = i0.Value(method),
       priority = i0.Value(priority),
       status = i0.Value(status);
  static i0.Insertable<i1.UploadTaskEntityData> custom({
    i0.Expression<int>? id,
    i0.Expression<int>? attempts,
    i0.Expression<DateTime>? createdAt,
    i0.Expression<String>? filePath,
    i0.Expression<bool>? isLivePhoto,
    i0.Expression<int>? lastError,
    i0.Expression<String>? livePhotoVideoId,
    i0.Expression<String>? localId,
    i0.Expression<int>? method,
    i0.Expression<double>? priority,
    i0.Expression<DateTime>? retryAfter,
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

  i1.UploadTaskEntityCompanion copyWith({
    i0.Value<int>? id,
    i0.Value<int>? attempts,
    i0.Value<DateTime>? createdAt,
    i0.Value<String>? filePath,
    i0.Value<bool?>? isLivePhoto,
    i0.Value<int?>? lastError,
    i0.Value<String?>? livePhotoVideoId,
    i0.Value<String>? localId,
    i0.Value<int>? method,
    i0.Value<double>? priority,
    i0.Value<DateTime?>? retryAfter,
    i0.Value<int>? status,
  }) {
    return i1.UploadTaskEntityCompanion(
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
      map['created_at'] = i0.Variable<DateTime>(createdAt.value);
    }
    if (filePath.present) {
      map['file_path'] = i0.Variable<String>(filePath.value);
    }
    if (isLivePhoto.present) {
      map['is_live_photo'] = i0.Variable<bool>(isLivePhoto.value);
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
      map['retry_after'] = i0.Variable<DateTime>(retryAfter.value);
    }
    if (status.present) {
      map['status'] = i0.Variable<int>(status.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('UploadTaskEntityCompanion(')
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

i0.Index get idxUploadTasksAssetData => i0.Index(
  'idx_upload_tasks_asset_data',
  'CREATE INDEX idx_upload_tasks_asset_data ON upload_task_entity (status, priority DESC, created_at)',
);
