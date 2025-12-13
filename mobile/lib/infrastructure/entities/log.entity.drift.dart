// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/log.entity.drift.dart'
    as i1;
import 'package:immich_mobile/domain/models/log.model.dart' as i2;
import 'package:immich_mobile/infrastructure/entities/log.entity.dart' as i3;

typedef $$LogMessageEntityTableCreateCompanionBuilder =
    i1.LogMessageEntityCompanion Function({
      i0.Value<int> id,
      required String message,
      i0.Value<String?> details,
      required i2.LogLevel level,
      required DateTime createdAt,
      i0.Value<String?> logger,
      i0.Value<String?> stack,
    });
typedef $$LogMessageEntityTableUpdateCompanionBuilder =
    i1.LogMessageEntityCompanion Function({
      i0.Value<int> id,
      i0.Value<String> message,
      i0.Value<String?> details,
      i0.Value<i2.LogLevel> level,
      i0.Value<DateTime> createdAt,
      i0.Value<String?> logger,
      i0.Value<String?> stack,
    });

class $$LogMessageEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$LogMessageEntityTable> {
  $$LogMessageEntityTableFilterComposer({
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

  i0.ColumnFilters<String> get message => $composableBuilder(
    column: $table.message,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<String> get details => $composableBuilder(
    column: $table.details,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnWithTypeConverterFilters<i2.LogLevel, i2.LogLevel, int> get level =>
      $composableBuilder(
        column: $table.level,
        builder: (column) => i0.ColumnWithTypeConverterFilters(column),
      );

  i0.ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<String> get logger => $composableBuilder(
    column: $table.logger,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<String> get stack => $composableBuilder(
    column: $table.stack,
    builder: (column) => i0.ColumnFilters(column),
  );
}

class $$LogMessageEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$LogMessageEntityTable> {
  $$LogMessageEntityTableOrderingComposer({
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

  i0.ColumnOrderings<String> get message => $composableBuilder(
    column: $table.message,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get details => $composableBuilder(
    column: $table.details,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get level => $composableBuilder(
    column: $table.level,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get logger => $composableBuilder(
    column: $table.logger,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get stack => $composableBuilder(
    column: $table.stack,
    builder: (column) => i0.ColumnOrderings(column),
  );
}

class $$LogMessageEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$LogMessageEntityTable> {
  $$LogMessageEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  i0.GeneratedColumn<String> get message =>
      $composableBuilder(column: $table.message, builder: (column) => column);

  i0.GeneratedColumn<String> get details =>
      $composableBuilder(column: $table.details, builder: (column) => column);

  i0.GeneratedColumnWithTypeConverter<i2.LogLevel, int> get level =>
      $composableBuilder(column: $table.level, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  i0.GeneratedColumn<String> get logger =>
      $composableBuilder(column: $table.logger, builder: (column) => column);

  i0.GeneratedColumn<String> get stack =>
      $composableBuilder(column: $table.stack, builder: (column) => column);
}

class $$LogMessageEntityTableTableManager
    extends
        i0.RootTableManager<
          i0.GeneratedDatabase,
          i1.$LogMessageEntityTable,
          i1.LogMessageEntityData,
          i1.$$LogMessageEntityTableFilterComposer,
          i1.$$LogMessageEntityTableOrderingComposer,
          i1.$$LogMessageEntityTableAnnotationComposer,
          $$LogMessageEntityTableCreateCompanionBuilder,
          $$LogMessageEntityTableUpdateCompanionBuilder,
          (
            i1.LogMessageEntityData,
            i0.BaseReferences<
              i0.GeneratedDatabase,
              i1.$LogMessageEntityTable,
              i1.LogMessageEntityData
            >,
          ),
          i1.LogMessageEntityData,
          i0.PrefetchHooks Function()
        > {
  $$LogMessageEntityTableTableManager(
    i0.GeneratedDatabase db,
    i1.$LogMessageEntityTable table,
  ) : super(
        i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$LogMessageEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () => i1
              .$$LogMessageEntityTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              i1.$$LogMessageEntityTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                i0.Value<int> id = const i0.Value.absent(),
                i0.Value<String> message = const i0.Value.absent(),
                i0.Value<String?> details = const i0.Value.absent(),
                i0.Value<i2.LogLevel> level = const i0.Value.absent(),
                i0.Value<DateTime> createdAt = const i0.Value.absent(),
                i0.Value<String?> logger = const i0.Value.absent(),
                i0.Value<String?> stack = const i0.Value.absent(),
              }) => i1.LogMessageEntityCompanion(
                id: id,
                message: message,
                details: details,
                level: level,
                createdAt: createdAt,
                logger: logger,
                stack: stack,
              ),
          createCompanionCallback:
              ({
                i0.Value<int> id = const i0.Value.absent(),
                required String message,
                i0.Value<String?> details = const i0.Value.absent(),
                required i2.LogLevel level,
                required DateTime createdAt,
                i0.Value<String?> logger = const i0.Value.absent(),
                i0.Value<String?> stack = const i0.Value.absent(),
              }) => i1.LogMessageEntityCompanion.insert(
                id: id,
                message: message,
                details: details,
                level: level,
                createdAt: createdAt,
                logger: logger,
                stack: stack,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), i0.BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LogMessageEntityTableProcessedTableManager =
    i0.ProcessedTableManager<
      i0.GeneratedDatabase,
      i1.$LogMessageEntityTable,
      i1.LogMessageEntityData,
      i1.$$LogMessageEntityTableFilterComposer,
      i1.$$LogMessageEntityTableOrderingComposer,
      i1.$$LogMessageEntityTableAnnotationComposer,
      $$LogMessageEntityTableCreateCompanionBuilder,
      $$LogMessageEntityTableUpdateCompanionBuilder,
      (
        i1.LogMessageEntityData,
        i0.BaseReferences<
          i0.GeneratedDatabase,
          i1.$LogMessageEntityTable,
          i1.LogMessageEntityData
        >,
      ),
      i1.LogMessageEntityData,
      i0.PrefetchHooks Function()
    >;

class $LogMessageEntityTable extends i3.LogMessageEntity
    with i0.TableInfo<$LogMessageEntityTable, i1.LogMessageEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LogMessageEntityTable(this.attachedDatabase, [this._alias]);
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
  static const i0.VerificationMeta _messageMeta = const i0.VerificationMeta(
    'message',
  );
  @override
  late final i0.GeneratedColumn<String> message = i0.GeneratedColumn<String>(
    'message',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _detailsMeta = const i0.VerificationMeta(
    'details',
  );
  @override
  late final i0.GeneratedColumn<String> details = i0.GeneratedColumn<String>(
    'details',
    aliasedName,
    true,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: false,
  );
  @override
  late final i0.GeneratedColumnWithTypeConverter<i2.LogLevel, int> level =
      i0.GeneratedColumn<int>(
        'level',
        aliasedName,
        false,
        type: i0.DriftSqlType.int,
        requiredDuringInsert: true,
      ).withConverter<i2.LogLevel>(i1.$LogMessageEntityTable.$converterlevel);
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
  static const i0.VerificationMeta _loggerMeta = const i0.VerificationMeta(
    'logger',
  );
  @override
  late final i0.GeneratedColumn<String> logger = i0.GeneratedColumn<String>(
    'logger',
    aliasedName,
    true,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const i0.VerificationMeta _stackMeta = const i0.VerificationMeta(
    'stack',
  );
  @override
  late final i0.GeneratedColumn<String> stack = i0.GeneratedColumn<String>(
    'stack',
    aliasedName,
    true,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: false,
  );
  @override
  List<i0.GeneratedColumn> get $columns => [
    id,
    message,
    details,
    level,
    createdAt,
    logger,
    stack,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'logger_messages';
  @override
  i0.VerificationContext validateIntegrity(
    i0.Insertable<i1.LogMessageEntityData> instance, {
    bool isInserting = false,
  }) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('message')) {
      context.handle(
        _messageMeta,
        message.isAcceptableOrUnknown(data['message']!, _messageMeta),
      );
    } else if (isInserting) {
      context.missing(_messageMeta);
    }
    if (data.containsKey('details')) {
      context.handle(
        _detailsMeta,
        details.isAcceptableOrUnknown(data['details']!, _detailsMeta),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('logger')) {
      context.handle(
        _loggerMeta,
        logger.isAcceptableOrUnknown(data['logger']!, _loggerMeta),
      );
    }
    if (data.containsKey('stack')) {
      context.handle(
        _stackMeta,
        stack.isAcceptableOrUnknown(data['stack']!, _stackMeta),
      );
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {id};
  @override
  i1.LogMessageEntityData map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.LogMessageEntityData(
      id: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      message: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}message'],
      )!,
      details: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}details'],
      ),
      level: i1.$LogMessageEntityTable.$converterlevel.fromSql(
        attachedDatabase.typeMapping.read(
          i0.DriftSqlType.int,
          data['${effectivePrefix}level'],
        )!,
      ),
      createdAt: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      logger: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}logger'],
      ),
      stack: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}stack'],
      ),
    );
  }

  @override
  $LogMessageEntityTable createAlias(String alias) {
    return $LogMessageEntityTable(attachedDatabase, alias);
  }

  static i0.JsonTypeConverter2<i2.LogLevel, int, int> $converterlevel =
      const i0.EnumIndexConverter<i2.LogLevel>(i2.LogLevel.values);
}

class LogMessageEntityData extends i0.DataClass
    implements i0.Insertable<i1.LogMessageEntityData> {
  final int id;
  final String message;
  final String? details;
  final i2.LogLevel level;
  final DateTime createdAt;
  final String? logger;
  final String? stack;
  const LogMessageEntityData({
    required this.id,
    required this.message,
    this.details,
    required this.level,
    required this.createdAt,
    this.logger,
    this.stack,
  });
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['id'] = i0.Variable<int>(id);
    map['message'] = i0.Variable<String>(message);
    if (!nullToAbsent || details != null) {
      map['details'] = i0.Variable<String>(details);
    }
    {
      map['level'] = i0.Variable<int>(
        i1.$LogMessageEntityTable.$converterlevel.toSql(level),
      );
    }
    map['created_at'] = i0.Variable<DateTime>(createdAt);
    if (!nullToAbsent || logger != null) {
      map['logger'] = i0.Variable<String>(logger);
    }
    if (!nullToAbsent || stack != null) {
      map['stack'] = i0.Variable<String>(stack);
    }
    return map;
  }

  factory LogMessageEntityData.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return LogMessageEntityData(
      id: serializer.fromJson<int>(json['id']),
      message: serializer.fromJson<String>(json['message']),
      details: serializer.fromJson<String?>(json['details']),
      level: i1.$LogMessageEntityTable.$converterlevel.fromJson(
        serializer.fromJson<int>(json['level']),
      ),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      logger: serializer.fromJson<String?>(json['logger']),
      stack: serializer.fromJson<String?>(json['stack']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'message': serializer.toJson<String>(message),
      'details': serializer.toJson<String?>(details),
      'level': serializer.toJson<int>(
        i1.$LogMessageEntityTable.$converterlevel.toJson(level),
      ),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'logger': serializer.toJson<String?>(logger),
      'stack': serializer.toJson<String?>(stack),
    };
  }

  i1.LogMessageEntityData copyWith({
    int? id,
    String? message,
    i0.Value<String?> details = const i0.Value.absent(),
    i2.LogLevel? level,
    DateTime? createdAt,
    i0.Value<String?> logger = const i0.Value.absent(),
    i0.Value<String?> stack = const i0.Value.absent(),
  }) => i1.LogMessageEntityData(
    id: id ?? this.id,
    message: message ?? this.message,
    details: details.present ? details.value : this.details,
    level: level ?? this.level,
    createdAt: createdAt ?? this.createdAt,
    logger: logger.present ? logger.value : this.logger,
    stack: stack.present ? stack.value : this.stack,
  );
  LogMessageEntityData copyWithCompanion(i1.LogMessageEntityCompanion data) {
    return LogMessageEntityData(
      id: data.id.present ? data.id.value : this.id,
      message: data.message.present ? data.message.value : this.message,
      details: data.details.present ? data.details.value : this.details,
      level: data.level.present ? data.level.value : this.level,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      logger: data.logger.present ? data.logger.value : this.logger,
      stack: data.stack.present ? data.stack.value : this.stack,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LogMessageEntityData(')
          ..write('id: $id, ')
          ..write('message: $message, ')
          ..write('details: $details, ')
          ..write('level: $level, ')
          ..write('createdAt: $createdAt, ')
          ..write('logger: $logger, ')
          ..write('stack: $stack')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, message, details, level, createdAt, logger, stack);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.LogMessageEntityData &&
          other.id == this.id &&
          other.message == this.message &&
          other.details == this.details &&
          other.level == this.level &&
          other.createdAt == this.createdAt &&
          other.logger == this.logger &&
          other.stack == this.stack);
}

class LogMessageEntityCompanion
    extends i0.UpdateCompanion<i1.LogMessageEntityData> {
  final i0.Value<int> id;
  final i0.Value<String> message;
  final i0.Value<String?> details;
  final i0.Value<i2.LogLevel> level;
  final i0.Value<DateTime> createdAt;
  final i0.Value<String?> logger;
  final i0.Value<String?> stack;
  const LogMessageEntityCompanion({
    this.id = const i0.Value.absent(),
    this.message = const i0.Value.absent(),
    this.details = const i0.Value.absent(),
    this.level = const i0.Value.absent(),
    this.createdAt = const i0.Value.absent(),
    this.logger = const i0.Value.absent(),
    this.stack = const i0.Value.absent(),
  });
  LogMessageEntityCompanion.insert({
    this.id = const i0.Value.absent(),
    required String message,
    this.details = const i0.Value.absent(),
    required i2.LogLevel level,
    required DateTime createdAt,
    this.logger = const i0.Value.absent(),
    this.stack = const i0.Value.absent(),
  }) : message = i0.Value(message),
       level = i0.Value(level),
       createdAt = i0.Value(createdAt);
  static i0.Insertable<i1.LogMessageEntityData> custom({
    i0.Expression<int>? id,
    i0.Expression<String>? message,
    i0.Expression<String>? details,
    i0.Expression<int>? level,
    i0.Expression<DateTime>? createdAt,
    i0.Expression<String>? logger,
    i0.Expression<String>? stack,
  }) {
    return i0.RawValuesInsertable({
      if (id != null) 'id': id,
      if (message != null) 'message': message,
      if (details != null) 'details': details,
      if (level != null) 'level': level,
      if (createdAt != null) 'created_at': createdAt,
      if (logger != null) 'logger': logger,
      if (stack != null) 'stack': stack,
    });
  }

  i1.LogMessageEntityCompanion copyWith({
    i0.Value<int>? id,
    i0.Value<String>? message,
    i0.Value<String?>? details,
    i0.Value<i2.LogLevel>? level,
    i0.Value<DateTime>? createdAt,
    i0.Value<String?>? logger,
    i0.Value<String?>? stack,
  }) {
    return i1.LogMessageEntityCompanion(
      id: id ?? this.id,
      message: message ?? this.message,
      details: details ?? this.details,
      level: level ?? this.level,
      createdAt: createdAt ?? this.createdAt,
      logger: logger ?? this.logger,
      stack: stack ?? this.stack,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (id.present) {
      map['id'] = i0.Variable<int>(id.value);
    }
    if (message.present) {
      map['message'] = i0.Variable<String>(message.value);
    }
    if (details.present) {
      map['details'] = i0.Variable<String>(details.value);
    }
    if (level.present) {
      map['level'] = i0.Variable<int>(
        i1.$LogMessageEntityTable.$converterlevel.toSql(level.value),
      );
    }
    if (createdAt.present) {
      map['created_at'] = i0.Variable<DateTime>(createdAt.value);
    }
    if (logger.present) {
      map['logger'] = i0.Variable<String>(logger.value);
    }
    if (stack.present) {
      map['stack'] = i0.Variable<String>(stack.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LogMessageEntityCompanion(')
          ..write('id: $id, ')
          ..write('message: $message, ')
          ..write('details: $details, ')
          ..write('level: $level, ')
          ..write('createdAt: $createdAt, ')
          ..write('logger: $logger, ')
          ..write('stack: $stack')
          ..write(')'))
        .toString();
  }
}
