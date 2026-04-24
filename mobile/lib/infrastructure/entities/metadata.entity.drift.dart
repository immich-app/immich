// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/metadata.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/metadata.entity.dart'
    as i2;
import 'package:drift/src/runtime/query_builder/query_builder.dart' as i3;

typedef $$MetadataEntityTableCreateCompanionBuilder =
    i1.MetadataEntityCompanion Function({
      required String key,
      required String value,
      i0.Value<DateTime> updatedAt,
    });
typedef $$MetadataEntityTableUpdateCompanionBuilder =
    i1.MetadataEntityCompanion Function({
      i0.Value<String> key,
      i0.Value<String> value,
      i0.Value<DateTime> updatedAt,
    });

class $$MetadataEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$MetadataEntityTable> {
  $$MetadataEntityTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnFilters<String> get key => $composableBuilder(
    column: $table.key,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<String> get value => $composableBuilder(
    column: $table.value,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => i0.ColumnFilters(column),
  );
}

class $$MetadataEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$MetadataEntityTable> {
  $$MetadataEntityTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnOrderings<String> get key => $composableBuilder(
    column: $table.key,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get value => $composableBuilder(
    column: $table.value,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => i0.ColumnOrderings(column),
  );
}

class $$MetadataEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$MetadataEntityTable> {
  $$MetadataEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<String> get key =>
      $composableBuilder(column: $table.key, builder: (column) => column);

  i0.GeneratedColumn<String> get value =>
      $composableBuilder(column: $table.value, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$MetadataEntityTableTableManager
    extends
        i0.RootTableManager<
          i0.GeneratedDatabase,
          i1.$MetadataEntityTable,
          i1.MetadataEntityData,
          i1.$$MetadataEntityTableFilterComposer,
          i1.$$MetadataEntityTableOrderingComposer,
          i1.$$MetadataEntityTableAnnotationComposer,
          $$MetadataEntityTableCreateCompanionBuilder,
          $$MetadataEntityTableUpdateCompanionBuilder,
          (
            i1.MetadataEntityData,
            i0.BaseReferences<
              i0.GeneratedDatabase,
              i1.$MetadataEntityTable,
              i1.MetadataEntityData
            >,
          ),
          i1.MetadataEntityData,
          i0.PrefetchHooks Function()
        > {
  $$MetadataEntityTableTableManager(
    i0.GeneratedDatabase db,
    i1.$MetadataEntityTable table,
  ) : super(
        i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$MetadataEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              i1.$$MetadataEntityTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () => i1
              .$$MetadataEntityTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                i0.Value<String> key = const i0.Value.absent(),
                i0.Value<String> value = const i0.Value.absent(),
                i0.Value<DateTime> updatedAt = const i0.Value.absent(),
              }) => i1.MetadataEntityCompanion(
                key: key,
                value: value,
                updatedAt: updatedAt,
              ),
          createCompanionCallback:
              ({
                required String key,
                required String value,
                i0.Value<DateTime> updatedAt = const i0.Value.absent(),
              }) => i1.MetadataEntityCompanion.insert(
                key: key,
                value: value,
                updatedAt: updatedAt,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), i0.BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$MetadataEntityTableProcessedTableManager =
    i0.ProcessedTableManager<
      i0.GeneratedDatabase,
      i1.$MetadataEntityTable,
      i1.MetadataEntityData,
      i1.$$MetadataEntityTableFilterComposer,
      i1.$$MetadataEntityTableOrderingComposer,
      i1.$$MetadataEntityTableAnnotationComposer,
      $$MetadataEntityTableCreateCompanionBuilder,
      $$MetadataEntityTableUpdateCompanionBuilder,
      (
        i1.MetadataEntityData,
        i0.BaseReferences<
          i0.GeneratedDatabase,
          i1.$MetadataEntityTable,
          i1.MetadataEntityData
        >,
      ),
      i1.MetadataEntityData,
      i0.PrefetchHooks Function()
    >;

class $MetadataEntityTable extends i2.MetadataEntity
    with i0.TableInfo<$MetadataEntityTable, i1.MetadataEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $MetadataEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _keyMeta = const i0.VerificationMeta('key');
  @override
  late final i0.GeneratedColumn<String> key = i0.GeneratedColumn<String>(
    'key',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _valueMeta = const i0.VerificationMeta(
    'value',
  );
  @override
  late final i0.GeneratedColumn<String> value = i0.GeneratedColumn<String>(
    'value',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _updatedAtMeta = const i0.VerificationMeta(
    'updatedAt',
  );
  @override
  late final i0.GeneratedColumn<DateTime> updatedAt =
      i0.GeneratedColumn<DateTime>(
        'updated_at',
        aliasedName,
        false,
        type: i0.DriftSqlType.dateTime,
        requiredDuringInsert: false,
        defaultValue: i3.currentDateAndTime,
      );
  @override
  List<i0.GeneratedColumn> get $columns => [key, value, updatedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'metadata';
  @override
  i0.VerificationContext validateIntegrity(
    i0.Insertable<i1.MetadataEntityData> instance, {
    bool isInserting = false,
  }) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('key')) {
      context.handle(
        _keyMeta,
        key.isAcceptableOrUnknown(data['key']!, _keyMeta),
      );
    } else if (isInserting) {
      context.missing(_keyMeta);
    }
    if (data.containsKey('value')) {
      context.handle(
        _valueMeta,
        value.isAcceptableOrUnknown(data['value']!, _valueMeta),
      );
    } else if (isInserting) {
      context.missing(_valueMeta);
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {key};
  @override
  i1.MetadataEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.MetadataEntityData(
      key: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}key'],
      )!,
      value: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}value'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $MetadataEntityTable createAlias(String alias) {
    return $MetadataEntityTable(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class MetadataEntityData extends i0.DataClass
    implements i0.Insertable<i1.MetadataEntityData> {
  final String key;
  final String value;
  final DateTime updatedAt;
  const MetadataEntityData({
    required this.key,
    required this.value,
    required this.updatedAt,
  });
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['key'] = i0.Variable<String>(key);
    map['value'] = i0.Variable<String>(value);
    map['updated_at'] = i0.Variable<DateTime>(updatedAt);
    return map;
  }

  factory MetadataEntityData.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return MetadataEntityData(
      key: serializer.fromJson<String>(json['key']),
      value: serializer.fromJson<String>(json['value']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'key': serializer.toJson<String>(key),
      'value': serializer.toJson<String>(value),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  i1.MetadataEntityData copyWith({
    String? key,
    String? value,
    DateTime? updatedAt,
  }) => i1.MetadataEntityData(
    key: key ?? this.key,
    value: value ?? this.value,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  MetadataEntityData copyWithCompanion(i1.MetadataEntityCompanion data) {
    return MetadataEntityData(
      key: data.key.present ? data.key.value : this.key,
      value: data.value.present ? data.value.value : this.value,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('MetadataEntityData(')
          ..write('key: $key, ')
          ..write('value: $value, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(key, value, updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.MetadataEntityData &&
          other.key == this.key &&
          other.value == this.value &&
          other.updatedAt == this.updatedAt);
}

class MetadataEntityCompanion
    extends i0.UpdateCompanion<i1.MetadataEntityData> {
  final i0.Value<String> key;
  final i0.Value<String> value;
  final i0.Value<DateTime> updatedAt;
  const MetadataEntityCompanion({
    this.key = const i0.Value.absent(),
    this.value = const i0.Value.absent(),
    this.updatedAt = const i0.Value.absent(),
  });
  MetadataEntityCompanion.insert({
    required String key,
    required String value,
    this.updatedAt = const i0.Value.absent(),
  }) : key = i0.Value(key),
       value = i0.Value(value);
  static i0.Insertable<i1.MetadataEntityData> custom({
    i0.Expression<String>? key,
    i0.Expression<String>? value,
    i0.Expression<DateTime>? updatedAt,
  }) {
    return i0.RawValuesInsertable({
      if (key != null) 'key': key,
      if (value != null) 'value': value,
      if (updatedAt != null) 'updated_at': updatedAt,
    });
  }

  i1.MetadataEntityCompanion copyWith({
    i0.Value<String>? key,
    i0.Value<String>? value,
    i0.Value<DateTime>? updatedAt,
  }) {
    return i1.MetadataEntityCompanion(
      key: key ?? this.key,
      value: value ?? this.value,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (key.present) {
      map['key'] = i0.Variable<String>(key.value);
    }
    if (value.present) {
      map['value'] = i0.Variable<String>(value.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = i0.Variable<DateTime>(updatedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('MetadataEntityCompanion(')
          ..write('key: $key, ')
          ..write('value: $value, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }
}
