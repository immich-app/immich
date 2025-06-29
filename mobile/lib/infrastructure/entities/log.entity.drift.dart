// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/log.entity.drift.dart'
    as i1;
import 'package:immich_mobile/domain/models/log.model.dart' as i2;
import 'package:immich_mobile/infrastructure/entities/log.entity.dart' as i3;

typedef $$LoggerMessageEntityTableCreateCompanionBuilder
    = i1.LoggerMessageEntityCompanion Function({
  required int id,
  required String message,
  i0.Value<String?> details,
  required i2.LogLevel level,
  required DateTime createdAt,
  i0.Value<String?> context1,
  i0.Value<String?> context2,
});
typedef $$LoggerMessageEntityTableUpdateCompanionBuilder
    = i1.LoggerMessageEntityCompanion Function({
  i0.Value<int> id,
  i0.Value<String> message,
  i0.Value<String?> details,
  i0.Value<i2.LogLevel> level,
  i0.Value<DateTime> createdAt,
  i0.Value<String?> context1,
  i0.Value<String?> context2,
});

class $$LoggerMessageEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$LoggerMessageEntityTable> {
  $$LoggerMessageEntityTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get message => $composableBuilder(
      column: $table.message, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get details => $composableBuilder(
      column: $table.details, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnWithTypeConverterFilters<i2.LogLevel, i2.LogLevel, int> get level =>
      $composableBuilder(
          column: $table.level,
          builder: (column) => i0.ColumnWithTypeConverterFilters(column));

  i0.ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get context1 => $composableBuilder(
      column: $table.context1, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get context2 => $composableBuilder(
      column: $table.context2, builder: (column) => i0.ColumnFilters(column));
}

class $$LoggerMessageEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$LoggerMessageEntityTable> {
  $$LoggerMessageEntityTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get message => $composableBuilder(
      column: $table.message, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get details => $composableBuilder(
      column: $table.details, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<int> get level => $composableBuilder(
      column: $table.level, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get context1 => $composableBuilder(
      column: $table.context1, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get context2 => $composableBuilder(
      column: $table.context2, builder: (column) => i0.ColumnOrderings(column));
}

class $$LoggerMessageEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$LoggerMessageEntityTable> {
  $$LoggerMessageEntityTableAnnotationComposer({
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

  i0.GeneratedColumn<String> get context1 =>
      $composableBuilder(column: $table.context1, builder: (column) => column);

  i0.GeneratedColumn<String> get context2 =>
      $composableBuilder(column: $table.context2, builder: (column) => column);
}

class $$LoggerMessageEntityTableTableManager extends i0.RootTableManager<
    i0.GeneratedDatabase,
    i1.$LoggerMessageEntityTable,
    i1.LoggerMessageEntityData,
    i1.$$LoggerMessageEntityTableFilterComposer,
    i1.$$LoggerMessageEntityTableOrderingComposer,
    i1.$$LoggerMessageEntityTableAnnotationComposer,
    $$LoggerMessageEntityTableCreateCompanionBuilder,
    $$LoggerMessageEntityTableUpdateCompanionBuilder,
    (
      i1.LoggerMessageEntityData,
      i0.BaseReferences<i0.GeneratedDatabase, i1.$LoggerMessageEntityTable,
          i1.LoggerMessageEntityData>
    ),
    i1.LoggerMessageEntityData,
    i0.PrefetchHooks Function()> {
  $$LoggerMessageEntityTableTableManager(
      i0.GeneratedDatabase db, i1.$LoggerMessageEntityTable table)
      : super(i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () => i1
              .$$LoggerMessageEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              i1.$$LoggerMessageEntityTableOrderingComposer(
                  $db: db, $table: table),
          createComputedFieldComposer: () =>
              i1.$$LoggerMessageEntityTableAnnotationComposer(
                  $db: db, $table: table),
          updateCompanionCallback: ({
            i0.Value<int> id = const i0.Value.absent(),
            i0.Value<String> message = const i0.Value.absent(),
            i0.Value<String?> details = const i0.Value.absent(),
            i0.Value<i2.LogLevel> level = const i0.Value.absent(),
            i0.Value<DateTime> createdAt = const i0.Value.absent(),
            i0.Value<String?> context1 = const i0.Value.absent(),
            i0.Value<String?> context2 = const i0.Value.absent(),
          }) =>
              i1.LoggerMessageEntityCompanion(
            id: id,
            message: message,
            details: details,
            level: level,
            createdAt: createdAt,
            context1: context1,
            context2: context2,
          ),
          createCompanionCallback: ({
            required int id,
            required String message,
            i0.Value<String?> details = const i0.Value.absent(),
            required i2.LogLevel level,
            required DateTime createdAt,
            i0.Value<String?> context1 = const i0.Value.absent(),
            i0.Value<String?> context2 = const i0.Value.absent(),
          }) =>
              i1.LoggerMessageEntityCompanion.insert(
            id: id,
            message: message,
            details: details,
            level: level,
            createdAt: createdAt,
            context1: context1,
            context2: context2,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), i0.BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$LoggerMessageEntityTableProcessedTableManager
    = i0.ProcessedTableManager<
        i0.GeneratedDatabase,
        i1.$LoggerMessageEntityTable,
        i1.LoggerMessageEntityData,
        i1.$$LoggerMessageEntityTableFilterComposer,
        i1.$$LoggerMessageEntityTableOrderingComposer,
        i1.$$LoggerMessageEntityTableAnnotationComposer,
        $$LoggerMessageEntityTableCreateCompanionBuilder,
        $$LoggerMessageEntityTableUpdateCompanionBuilder,
        (
          i1.LoggerMessageEntityData,
          i0.BaseReferences<i0.GeneratedDatabase, i1.$LoggerMessageEntityTable,
              i1.LoggerMessageEntityData>
        ),
        i1.LoggerMessageEntityData,
        i0.PrefetchHooks Function()>;

class $LoggerMessageEntityTable extends i3.LoggerMessageEntity
    with i0.TableInfo<$LoggerMessageEntityTable, i1.LoggerMessageEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LoggerMessageEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _idMeta = const i0.VerificationMeta('id');
  @override
  late final i0.GeneratedColumn<int> id = i0.GeneratedColumn<int>(
      'id', aliasedName, false,
      hasAutoIncrement: true,
      type: i0.DriftSqlType.int,
      requiredDuringInsert: true,
      defaultConstraints:
          i0.GeneratedColumn.constraintIsAlways('PRIMARY KEY AUTOINCREMENT'));
  static const i0.VerificationMeta _messageMeta =
      const i0.VerificationMeta('message');
  @override
  late final i0.GeneratedColumn<String> message = i0.GeneratedColumn<String>(
      'message', aliasedName, false,
      type: i0.DriftSqlType.string, requiredDuringInsert: true);
  static const i0.VerificationMeta _detailsMeta =
      const i0.VerificationMeta('details');
  @override
  late final i0.GeneratedColumn<String> details = i0.GeneratedColumn<String>(
      'details', aliasedName, true,
      type: i0.DriftSqlType.string, requiredDuringInsert: false);
  @override
  late final i0.GeneratedColumnWithTypeConverter<i2.LogLevel, int> level =
      i0.GeneratedColumn<int>('level', aliasedName, false,
              type: i0.DriftSqlType.int, requiredDuringInsert: true)
          .withConverter<i2.LogLevel>(
              i1.$LoggerMessageEntityTable.$converterlevel);
  static const i0.VerificationMeta _createdAtMeta =
      const i0.VerificationMeta('createdAt');
  @override
  late final i0.GeneratedColumn<DateTime> createdAt =
      i0.GeneratedColumn<DateTime>('created_at', aliasedName, false,
          type: i0.DriftSqlType.dateTime, requiredDuringInsert: true);
  static const i0.VerificationMeta _context1Meta =
      const i0.VerificationMeta('context1');
  @override
  late final i0.GeneratedColumn<String> context1 = i0.GeneratedColumn<String>(
      'context1', aliasedName, true,
      type: i0.DriftSqlType.string, requiredDuringInsert: false);
  static const i0.VerificationMeta _context2Meta =
      const i0.VerificationMeta('context2');
  @override
  late final i0.GeneratedColumn<String> context2 = i0.GeneratedColumn<String>(
      'context2', aliasedName, true,
      type: i0.DriftSqlType.string, requiredDuringInsert: false);
  @override
  List<i0.GeneratedColumn> get $columns =>
      [id, message, details, level, createdAt, context1, context2];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'logger_message_entity';
  @override
  i0.VerificationContext validateIntegrity(
      i0.Insertable<i1.LoggerMessageEntityData> instance,
      {bool isInserting = false}) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('message')) {
      context.handle(_messageMeta,
          message.isAcceptableOrUnknown(data['message']!, _messageMeta));
    } else if (isInserting) {
      context.missing(_messageMeta);
    }
    if (data.containsKey('details')) {
      context.handle(_detailsMeta,
          details.isAcceptableOrUnknown(data['details']!, _detailsMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('context1')) {
      context.handle(_context1Meta,
          context1.isAcceptableOrUnknown(data['context1']!, _context1Meta));
    }
    if (data.containsKey('context2')) {
      context.handle(_context2Meta,
          context2.isAcceptableOrUnknown(data['context2']!, _context2Meta));
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {id};
  @override
  i1.LoggerMessageEntityData map(Map<String, dynamic> data,
      {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.LoggerMessageEntityData(
      id: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.int, data['${effectivePrefix}id'])!,
      message: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}message'])!,
      details: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}details']),
      level: i1.$LoggerMessageEntityTable.$converterlevel.fromSql(
          attachedDatabase.typeMapping
              .read(i0.DriftSqlType.int, data['${effectivePrefix}level'])!),
      createdAt: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      context1: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}context1']),
      context2: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}context2']),
    );
  }

  @override
  $LoggerMessageEntityTable createAlias(String alias) {
    return $LoggerMessageEntityTable(attachedDatabase, alias);
  }

  static i0.JsonTypeConverter2<i2.LogLevel, int, int> $converterlevel =
      const i0.EnumIndexConverter<i2.LogLevel>(i2.LogLevel.values);
  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class LoggerMessageEntityData extends i0.DataClass
    implements i0.Insertable<i1.LoggerMessageEntityData> {
  final int id;
  final String message;
  final String? details;
  final i2.LogLevel level;
  final DateTime createdAt;
  final String? context1;
  final String? context2;
  const LoggerMessageEntityData(
      {required this.id,
      required this.message,
      this.details,
      required this.level,
      required this.createdAt,
      this.context1,
      this.context2});
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
          i1.$LoggerMessageEntityTable.$converterlevel.toSql(level));
    }
    map['created_at'] = i0.Variable<DateTime>(createdAt);
    if (!nullToAbsent || context1 != null) {
      map['context1'] = i0.Variable<String>(context1);
    }
    if (!nullToAbsent || context2 != null) {
      map['context2'] = i0.Variable<String>(context2);
    }
    return map;
  }

  factory LoggerMessageEntityData.fromJson(Map<String, dynamic> json,
      {i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return LoggerMessageEntityData(
      id: serializer.fromJson<int>(json['id']),
      message: serializer.fromJson<String>(json['message']),
      details: serializer.fromJson<String?>(json['details']),
      level: i1.$LoggerMessageEntityTable.$converterlevel
          .fromJson(serializer.fromJson<int>(json['level'])),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      context1: serializer.fromJson<String?>(json['context1']),
      context2: serializer.fromJson<String?>(json['context2']),
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
          i1.$LoggerMessageEntityTable.$converterlevel.toJson(level)),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'context1': serializer.toJson<String?>(context1),
      'context2': serializer.toJson<String?>(context2),
    };
  }

  i1.LoggerMessageEntityData copyWith(
          {int? id,
          String? message,
          i0.Value<String?> details = const i0.Value.absent(),
          i2.LogLevel? level,
          DateTime? createdAt,
          i0.Value<String?> context1 = const i0.Value.absent(),
          i0.Value<String?> context2 = const i0.Value.absent()}) =>
      i1.LoggerMessageEntityData(
        id: id ?? this.id,
        message: message ?? this.message,
        details: details.present ? details.value : this.details,
        level: level ?? this.level,
        createdAt: createdAt ?? this.createdAt,
        context1: context1.present ? context1.value : this.context1,
        context2: context2.present ? context2.value : this.context2,
      );
  LoggerMessageEntityData copyWithCompanion(
      i1.LoggerMessageEntityCompanion data) {
    return LoggerMessageEntityData(
      id: data.id.present ? data.id.value : this.id,
      message: data.message.present ? data.message.value : this.message,
      details: data.details.present ? data.details.value : this.details,
      level: data.level.present ? data.level.value : this.level,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      context1: data.context1.present ? data.context1.value : this.context1,
      context2: data.context2.present ? data.context2.value : this.context2,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LoggerMessageEntityData(')
          ..write('id: $id, ')
          ..write('message: $message, ')
          ..write('details: $details, ')
          ..write('level: $level, ')
          ..write('createdAt: $createdAt, ')
          ..write('context1: $context1, ')
          ..write('context2: $context2')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, message, details, level, createdAt, context1, context2);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.LoggerMessageEntityData &&
          other.id == this.id &&
          other.message == this.message &&
          other.details == this.details &&
          other.level == this.level &&
          other.createdAt == this.createdAt &&
          other.context1 == this.context1 &&
          other.context2 == this.context2);
}

class LoggerMessageEntityCompanion
    extends i0.UpdateCompanion<i1.LoggerMessageEntityData> {
  final i0.Value<int> id;
  final i0.Value<String> message;
  final i0.Value<String?> details;
  final i0.Value<i2.LogLevel> level;
  final i0.Value<DateTime> createdAt;
  final i0.Value<String?> context1;
  final i0.Value<String?> context2;
  const LoggerMessageEntityCompanion({
    this.id = const i0.Value.absent(),
    this.message = const i0.Value.absent(),
    this.details = const i0.Value.absent(),
    this.level = const i0.Value.absent(),
    this.createdAt = const i0.Value.absent(),
    this.context1 = const i0.Value.absent(),
    this.context2 = const i0.Value.absent(),
  });
  LoggerMessageEntityCompanion.insert({
    required int id,
    required String message,
    this.details = const i0.Value.absent(),
    required i2.LogLevel level,
    required DateTime createdAt,
    this.context1 = const i0.Value.absent(),
    this.context2 = const i0.Value.absent(),
  })  : id = i0.Value(id),
        message = i0.Value(message),
        level = i0.Value(level),
        createdAt = i0.Value(createdAt);
  static i0.Insertable<i1.LoggerMessageEntityData> custom({
    i0.Expression<int>? id,
    i0.Expression<String>? message,
    i0.Expression<String>? details,
    i0.Expression<int>? level,
    i0.Expression<DateTime>? createdAt,
    i0.Expression<String>? context1,
    i0.Expression<String>? context2,
  }) {
    return i0.RawValuesInsertable({
      if (id != null) 'id': id,
      if (message != null) 'message': message,
      if (details != null) 'details': details,
      if (level != null) 'level': level,
      if (createdAt != null) 'created_at': createdAt,
      if (context1 != null) 'context1': context1,
      if (context2 != null) 'context2': context2,
    });
  }

  i1.LoggerMessageEntityCompanion copyWith(
      {i0.Value<int>? id,
      i0.Value<String>? message,
      i0.Value<String?>? details,
      i0.Value<i2.LogLevel>? level,
      i0.Value<DateTime>? createdAt,
      i0.Value<String?>? context1,
      i0.Value<String?>? context2}) {
    return i1.LoggerMessageEntityCompanion(
      id: id ?? this.id,
      message: message ?? this.message,
      details: details ?? this.details,
      level: level ?? this.level,
      createdAt: createdAt ?? this.createdAt,
      context1: context1 ?? this.context1,
      context2: context2 ?? this.context2,
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
          i1.$LoggerMessageEntityTable.$converterlevel.toSql(level.value));
    }
    if (createdAt.present) {
      map['created_at'] = i0.Variable<DateTime>(createdAt.value);
    }
    if (context1.present) {
      map['context1'] = i0.Variable<String>(context1.value);
    }
    if (context2.present) {
      map['context2'] = i0.Variable<String>(context2.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LoggerMessageEntityCompanion(')
          ..write('id: $id, ')
          ..write('message: $message, ')
          ..write('details: $details, ')
          ..write('level: $level, ')
          ..write('createdAt: $createdAt, ')
          ..write('context1: $context1, ')
          ..write('context2: $context2')
          ..write(')'))
        .toString();
  }
}
