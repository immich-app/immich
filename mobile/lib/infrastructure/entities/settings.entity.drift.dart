// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/settings.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/settings.entity.dart'
    as i2;
import 'package:drift/src/runtime/query_builder/query_builder.dart' as i3;

typedef $$SettingsEntityTableCreateCompanionBuilder =
    i1.SettingsEntityCompanion Function({
      required String key,
      required String value,
      i0.Value<DateTime> updatedAt,
    });
typedef $$SettingsEntityTableUpdateCompanionBuilder =
    i1.SettingsEntityCompanion Function({
      i0.Value<String> key,
      i0.Value<String> value,
      i0.Value<DateTime> updatedAt,
    });

class $$SettingsEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$SettingsEntityTable> {
  $$SettingsEntityTableFilterComposer({
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

class $$SettingsEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$SettingsEntityTable> {
  $$SettingsEntityTableOrderingComposer({
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

class $$SettingsEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$SettingsEntityTable> {
  $$SettingsEntityTableAnnotationComposer({
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

class $$SettingsEntityTableTableManager
    extends
        i0.RootTableManager<
          i0.GeneratedDatabase,
          i1.$SettingsEntityTable,
          i1.SettingsEntityData,
          i1.$$SettingsEntityTableFilterComposer,
          i1.$$SettingsEntityTableOrderingComposer,
          i1.$$SettingsEntityTableAnnotationComposer,
          $$SettingsEntityTableCreateCompanionBuilder,
          $$SettingsEntityTableUpdateCompanionBuilder,
          (
            i1.SettingsEntityData,
            i0.BaseReferences<
              i0.GeneratedDatabase,
              i1.$SettingsEntityTable,
              i1.SettingsEntityData
            >,
          ),
          i1.SettingsEntityData,
          i0.PrefetchHooks Function()
        > {
  $$SettingsEntityTableTableManager(
    i0.GeneratedDatabase db,
    i1.$SettingsEntityTable table,
  ) : super(
        i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$SettingsEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              i1.$$SettingsEntityTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () => i1
              .$$SettingsEntityTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                i0.Value<String> key = const i0.Value.absent(),
                i0.Value<String> value = const i0.Value.absent(),
                i0.Value<DateTime> updatedAt = const i0.Value.absent(),
              }) => i1.SettingsEntityCompanion(
                key: key,
                value: value,
                updatedAt: updatedAt,
              ),
          createCompanionCallback:
              ({
                required String key,
                required String value,
                i0.Value<DateTime> updatedAt = const i0.Value.absent(),
              }) => i1.SettingsEntityCompanion.insert(
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

typedef $$SettingsEntityTableProcessedTableManager =
    i0.ProcessedTableManager<
      i0.GeneratedDatabase,
      i1.$SettingsEntityTable,
      i1.SettingsEntityData,
      i1.$$SettingsEntityTableFilterComposer,
      i1.$$SettingsEntityTableOrderingComposer,
      i1.$$SettingsEntityTableAnnotationComposer,
      $$SettingsEntityTableCreateCompanionBuilder,
      $$SettingsEntityTableUpdateCompanionBuilder,
      (
        i1.SettingsEntityData,
        i0.BaseReferences<
          i0.GeneratedDatabase,
          i1.$SettingsEntityTable,
          i1.SettingsEntityData
        >,
      ),
      i1.SettingsEntityData,
      i0.PrefetchHooks Function()
    >;

class $SettingsEntityTable extends i2.SettingsEntity
    with i0.TableInfo<$SettingsEntityTable, i1.SettingsEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SettingsEntityTable(this.attachedDatabase, [this._alias]);
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
  static const String $name = 'settings';
  @override
  i0.VerificationContext validateIntegrity(
    i0.Insertable<i1.SettingsEntityData> instance, {
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
  i1.SettingsEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.SettingsEntityData(
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
  $SettingsEntityTable createAlias(String alias) {
    return $SettingsEntityTable(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class SettingsEntityData extends i0.DataClass
    implements i0.Insertable<i1.SettingsEntityData> {
  final String key;
  final String value;
  final DateTime updatedAt;
  const SettingsEntityData({
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

  factory SettingsEntityData.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return SettingsEntityData(
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

  i1.SettingsEntityData copyWith({
    String? key,
    String? value,
    DateTime? updatedAt,
  }) => i1.SettingsEntityData(
    key: key ?? this.key,
    value: value ?? this.value,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  SettingsEntityData copyWithCompanion(i1.SettingsEntityCompanion data) {
    return SettingsEntityData(
      key: data.key.present ? data.key.value : this.key,
      value: data.value.present ? data.value.value : this.value,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SettingsEntityData(')
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
      (other is i1.SettingsEntityData &&
          other.key == this.key &&
          other.value == this.value &&
          other.updatedAt == this.updatedAt);
}

class SettingsEntityCompanion
    extends i0.UpdateCompanion<i1.SettingsEntityData> {
  final i0.Value<String> key;
  final i0.Value<String> value;
  final i0.Value<DateTime> updatedAt;
  const SettingsEntityCompanion({
    this.key = const i0.Value.absent(),
    this.value = const i0.Value.absent(),
    this.updatedAt = const i0.Value.absent(),
  });
  SettingsEntityCompanion.insert({
    required String key,
    required String value,
    this.updatedAt = const i0.Value.absent(),
  }) : key = i0.Value(key),
       value = i0.Value(value);
  static i0.Insertable<i1.SettingsEntityData> custom({
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

  i1.SettingsEntityCompanion copyWith({
    i0.Value<String>? key,
    i0.Value<String>? value,
    i0.Value<DateTime>? updatedAt,
  }) {
    return i1.SettingsEntityCompanion(
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
    return (StringBuffer('SettingsEntityCompanion(')
          ..write('key: $key, ')
          ..write('value: $value, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }
}
