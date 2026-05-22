// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/store.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/store.entity.dart' as i2;

typedef $$StoreEntityTableCreateCompanionBuilder =
    i1.StoreEntityCompanion Function({
      required int id,
      i0.Value<String?> stringValue,
      i0.Value<int?> intValue,
    });
typedef $$StoreEntityTableUpdateCompanionBuilder =
    i1.StoreEntityCompanion Function({
      i0.Value<int> id,
      i0.Value<String?> stringValue,
      i0.Value<int?> intValue,
    });

class $$StoreEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$StoreEntityTable> {
  $$StoreEntityTableFilterComposer({
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

  i0.ColumnFilters<String> get stringValue => $composableBuilder(
    column: $table.stringValue,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get intValue => $composableBuilder(
    column: $table.intValue,
    builder: (column) => i0.ColumnFilters(column),
  );
}

class $$StoreEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$StoreEntityTable> {
  $$StoreEntityTableOrderingComposer({
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

  i0.ColumnOrderings<String> get stringValue => $composableBuilder(
    column: $table.stringValue,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get intValue => $composableBuilder(
    column: $table.intValue,
    builder: (column) => i0.ColumnOrderings(column),
  );
}

class $$StoreEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$StoreEntityTable> {
  $$StoreEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  i0.GeneratedColumn<String> get stringValue => $composableBuilder(
    column: $table.stringValue,
    builder: (column) => column,
  );

  i0.GeneratedColumn<int> get intValue =>
      $composableBuilder(column: $table.intValue, builder: (column) => column);
}

class $$StoreEntityTableTableManager
    extends
        i0.RootTableManager<
          i0.GeneratedDatabase,
          i1.$StoreEntityTable,
          i1.StoreEntityData,
          i1.$$StoreEntityTableFilterComposer,
          i1.$$StoreEntityTableOrderingComposer,
          i1.$$StoreEntityTableAnnotationComposer,
          $$StoreEntityTableCreateCompanionBuilder,
          $$StoreEntityTableUpdateCompanionBuilder,
          (
            i1.StoreEntityData,
            i0.BaseReferences<
              i0.GeneratedDatabase,
              i1.$StoreEntityTable,
              i1.StoreEntityData
            >,
          ),
          i1.StoreEntityData,
          i0.PrefetchHooks Function()
        > {
  $$StoreEntityTableTableManager(
    i0.GeneratedDatabase db,
    i1.$StoreEntityTable table,
  ) : super(
        i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$StoreEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              i1.$$StoreEntityTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              i1.$$StoreEntityTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                i0.Value<int> id = const i0.Value.absent(),
                i0.Value<String?> stringValue = const i0.Value.absent(),
                i0.Value<int?> intValue = const i0.Value.absent(),
              }) => i1.StoreEntityCompanion(
                id: id,
                stringValue: stringValue,
                intValue: intValue,
              ),
          createCompanionCallback:
              ({
                required int id,
                i0.Value<String?> stringValue = const i0.Value.absent(),
                i0.Value<int?> intValue = const i0.Value.absent(),
              }) => i1.StoreEntityCompanion.insert(
                id: id,
                stringValue: stringValue,
                intValue: intValue,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), i0.BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$StoreEntityTableProcessedTableManager =
    i0.ProcessedTableManager<
      i0.GeneratedDatabase,
      i1.$StoreEntityTable,
      i1.StoreEntityData,
      i1.$$StoreEntityTableFilterComposer,
      i1.$$StoreEntityTableOrderingComposer,
      i1.$$StoreEntityTableAnnotationComposer,
      $$StoreEntityTableCreateCompanionBuilder,
      $$StoreEntityTableUpdateCompanionBuilder,
      (
        i1.StoreEntityData,
        i0.BaseReferences<
          i0.GeneratedDatabase,
          i1.$StoreEntityTable,
          i1.StoreEntityData
        >,
      ),
      i1.StoreEntityData,
      i0.PrefetchHooks Function()
    >;

class $StoreEntityTable extends i2.StoreEntity
    with i0.TableInfo<$StoreEntityTable, i1.StoreEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $StoreEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _idMeta = const i0.VerificationMeta('id');
  @override
  late final i0.GeneratedColumn<int> id = i0.GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _stringValueMeta = const i0.VerificationMeta(
    'stringValue',
  );
  @override
  late final i0.GeneratedColumn<String> stringValue =
      i0.GeneratedColumn<String>(
        'string_value',
        aliasedName,
        true,
        type: i0.DriftSqlType.string,
        requiredDuringInsert: false,
      );
  static const i0.VerificationMeta _intValueMeta = const i0.VerificationMeta(
    'intValue',
  );
  @override
  late final i0.GeneratedColumn<int> intValue = i0.GeneratedColumn<int>(
    'int_value',
    aliasedName,
    true,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: false,
  );
  @override
  List<i0.GeneratedColumn> get $columns => [id, stringValue, intValue];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'store_entity';
  @override
  i0.VerificationContext validateIntegrity(
    i0.Insertable<i1.StoreEntityData> instance, {
    bool isInserting = false,
  }) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('string_value')) {
      context.handle(
        _stringValueMeta,
        stringValue.isAcceptableOrUnknown(
          data['string_value']!,
          _stringValueMeta,
        ),
      );
    }
    if (data.containsKey('int_value')) {
      context.handle(
        _intValueMeta,
        intValue.isAcceptableOrUnknown(data['int_value']!, _intValueMeta),
      );
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {id};
  @override
  i1.StoreEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.StoreEntityData(
      id: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      stringValue: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}string_value'],
      ),
      intValue: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}int_value'],
      ),
    );
  }

  @override
  $StoreEntityTable createAlias(String alias) {
    return $StoreEntityTable(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class StoreEntityData extends i0.DataClass
    implements i0.Insertable<i1.StoreEntityData> {
  final int id;
  final String? stringValue;
  final int? intValue;
  const StoreEntityData({required this.id, this.stringValue, this.intValue});
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['id'] = i0.Variable<int>(id);
    if (!nullToAbsent || stringValue != null) {
      map['string_value'] = i0.Variable<String>(stringValue);
    }
    if (!nullToAbsent || intValue != null) {
      map['int_value'] = i0.Variable<int>(intValue);
    }
    return map;
  }

  factory StoreEntityData.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return StoreEntityData(
      id: serializer.fromJson<int>(json['id']),
      stringValue: serializer.fromJson<String?>(json['stringValue']),
      intValue: serializer.fromJson<int?>(json['intValue']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'stringValue': serializer.toJson<String?>(stringValue),
      'intValue': serializer.toJson<int?>(intValue),
    };
  }

  i1.StoreEntityData copyWith({
    int? id,
    i0.Value<String?> stringValue = const i0.Value.absent(),
    i0.Value<int?> intValue = const i0.Value.absent(),
  }) => i1.StoreEntityData(
    id: id ?? this.id,
    stringValue: stringValue.present ? stringValue.value : this.stringValue,
    intValue: intValue.present ? intValue.value : this.intValue,
  );
  StoreEntityData copyWithCompanion(i1.StoreEntityCompanion data) {
    return StoreEntityData(
      id: data.id.present ? data.id.value : this.id,
      stringValue: data.stringValue.present
          ? data.stringValue.value
          : this.stringValue,
      intValue: data.intValue.present ? data.intValue.value : this.intValue,
    );
  }

  @override
  String toString() {
    return (StringBuffer('StoreEntityData(')
          ..write('id: $id, ')
          ..write('stringValue: $stringValue, ')
          ..write('intValue: $intValue')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, stringValue, intValue);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.StoreEntityData &&
          other.id == this.id &&
          other.stringValue == this.stringValue &&
          other.intValue == this.intValue);
}

class StoreEntityCompanion extends i0.UpdateCompanion<i1.StoreEntityData> {
  final i0.Value<int> id;
  final i0.Value<String?> stringValue;
  final i0.Value<int?> intValue;
  const StoreEntityCompanion({
    this.id = const i0.Value.absent(),
    this.stringValue = const i0.Value.absent(),
    this.intValue = const i0.Value.absent(),
  });
  StoreEntityCompanion.insert({
    required int id,
    this.stringValue = const i0.Value.absent(),
    this.intValue = const i0.Value.absent(),
  }) : id = i0.Value(id);
  static i0.Insertable<i1.StoreEntityData> custom({
    i0.Expression<int>? id,
    i0.Expression<String>? stringValue,
    i0.Expression<int>? intValue,
  }) {
    return i0.RawValuesInsertable({
      if (id != null) 'id': id,
      if (stringValue != null) 'string_value': stringValue,
      if (intValue != null) 'int_value': intValue,
    });
  }

  i1.StoreEntityCompanion copyWith({
    i0.Value<int>? id,
    i0.Value<String?>? stringValue,
    i0.Value<int?>? intValue,
  }) {
    return i1.StoreEntityCompanion(
      id: id ?? this.id,
      stringValue: stringValue ?? this.stringValue,
      intValue: intValue ?? this.intValue,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (id.present) {
      map['id'] = i0.Variable<int>(id.value);
    }
    if (stringValue.present) {
      map['string_value'] = i0.Variable<String>(stringValue.value);
    }
    if (intValue.present) {
      map['int_value'] = i0.Variable<int>(intValue.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('StoreEntityCompanion(')
          ..write('id: $id, ')
          ..write('stringValue: $stringValue, ')
          ..write('intValue: $intValue')
          ..write(')'))
        .toString();
  }
}
