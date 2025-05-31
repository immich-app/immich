// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/local_asset_hash.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/local_asset_hash.entity.dart'
    as i2;
import 'package:drift/src/runtime/query_builder/query_builder.dart' as i3;

typedef $$LocalAssetHashEntityTableCreateCompanionBuilder
    = i1.LocalAssetHashEntityCompanion Function({
  required String id,
  i0.Value<DateTime> updatedAt,
  required String checksum,
});
typedef $$LocalAssetHashEntityTableUpdateCompanionBuilder
    = i1.LocalAssetHashEntityCompanion Function({
  i0.Value<String> id,
  i0.Value<DateTime> updatedAt,
  i0.Value<String> checksum,
});

class $$LocalAssetHashEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$LocalAssetHashEntityTable> {
  $$LocalAssetHashEntityTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get checksum => $composableBuilder(
      column: $table.checksum, builder: (column) => i0.ColumnFilters(column));
}

class $$LocalAssetHashEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$LocalAssetHashEntityTable> {
  $$LocalAssetHashEntityTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get checksum => $composableBuilder(
      column: $table.checksum, builder: (column) => i0.ColumnOrderings(column));
}

class $$LocalAssetHashEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$LocalAssetHashEntityTable> {
  $$LocalAssetHashEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  i0.GeneratedColumn<String> get checksum =>
      $composableBuilder(column: $table.checksum, builder: (column) => column);
}

class $$LocalAssetHashEntityTableTableManager extends i0.RootTableManager<
    i0.GeneratedDatabase,
    i1.$LocalAssetHashEntityTable,
    i1.LocalAssetHashEntityData,
    i1.$$LocalAssetHashEntityTableFilterComposer,
    i1.$$LocalAssetHashEntityTableOrderingComposer,
    i1.$$LocalAssetHashEntityTableAnnotationComposer,
    $$LocalAssetHashEntityTableCreateCompanionBuilder,
    $$LocalAssetHashEntityTableUpdateCompanionBuilder,
    (
      i1.LocalAssetHashEntityData,
      i0.BaseReferences<i0.GeneratedDatabase, i1.$LocalAssetHashEntityTable,
          i1.LocalAssetHashEntityData>
    ),
    i1.LocalAssetHashEntityData,
    i0.PrefetchHooks Function()> {
  $$LocalAssetHashEntityTableTableManager(
      i0.GeneratedDatabase db, i1.$LocalAssetHashEntityTable table)
      : super(i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$LocalAssetHashEntityTableFilterComposer(
                  $db: db, $table: table),
          createOrderingComposer: () =>
              i1.$$LocalAssetHashEntityTableOrderingComposer(
                  $db: db, $table: table),
          createComputedFieldComposer: () =>
              i1.$$LocalAssetHashEntityTableAnnotationComposer(
                  $db: db, $table: table),
          updateCompanionCallback: ({
            i0.Value<String> id = const i0.Value.absent(),
            i0.Value<DateTime> updatedAt = const i0.Value.absent(),
            i0.Value<String> checksum = const i0.Value.absent(),
          }) =>
              i1.LocalAssetHashEntityCompanion(
            id: id,
            updatedAt: updatedAt,
            checksum: checksum,
          ),
          createCompanionCallback: ({
            required String id,
            i0.Value<DateTime> updatedAt = const i0.Value.absent(),
            required String checksum,
          }) =>
              i1.LocalAssetHashEntityCompanion.insert(
            id: id,
            updatedAt: updatedAt,
            checksum: checksum,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), i0.BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$LocalAssetHashEntityTableProcessedTableManager
    = i0.ProcessedTableManager<
        i0.GeneratedDatabase,
        i1.$LocalAssetHashEntityTable,
        i1.LocalAssetHashEntityData,
        i1.$$LocalAssetHashEntityTableFilterComposer,
        i1.$$LocalAssetHashEntityTableOrderingComposer,
        i1.$$LocalAssetHashEntityTableAnnotationComposer,
        $$LocalAssetHashEntityTableCreateCompanionBuilder,
        $$LocalAssetHashEntityTableUpdateCompanionBuilder,
        (
          i1.LocalAssetHashEntityData,
          i0.BaseReferences<i0.GeneratedDatabase, i1.$LocalAssetHashEntityTable,
              i1.LocalAssetHashEntityData>
        ),
        i1.LocalAssetHashEntityData,
        i0.PrefetchHooks Function()>;

class $LocalAssetHashEntityTable extends i2.LocalAssetHashEntity
    with i0.TableInfo<$LocalAssetHashEntityTable, i1.LocalAssetHashEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalAssetHashEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _idMeta = const i0.VerificationMeta('id');
  @override
  late final i0.GeneratedColumn<String> id = i0.GeneratedColumn<String>(
      'id', aliasedName, false,
      type: i0.DriftSqlType.string, requiredDuringInsert: true);
  static const i0.VerificationMeta _updatedAtMeta =
      const i0.VerificationMeta('updatedAt');
  @override
  late final i0.GeneratedColumn<DateTime> updatedAt =
      i0.GeneratedColumn<DateTime>('updated_at', aliasedName, false,
          type: i0.DriftSqlType.dateTime,
          requiredDuringInsert: false,
          defaultValue: i3.currentDateAndTime);
  static const i0.VerificationMeta _checksumMeta =
      const i0.VerificationMeta('checksum');
  @override
  late final i0.GeneratedColumn<String> checksum = i0.GeneratedColumn<String>(
      'checksum', aliasedName, false,
      type: i0.DriftSqlType.string, requiredDuringInsert: true);
  @override
  List<i0.GeneratedColumn> get $columns => [id, updatedAt, checksum];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_asset_hash_entity';
  @override
  i0.VerificationContext validateIntegrity(
      i0.Insertable<i1.LocalAssetHashEntityData> instance,
      {bool isInserting = false}) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    if (data.containsKey('checksum')) {
      context.handle(_checksumMeta,
          checksum.isAcceptableOrUnknown(data['checksum']!, _checksumMeta));
    } else if (isInserting) {
      context.missing(_checksumMeta);
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {id};
  @override
  i1.LocalAssetHashEntityData map(Map<String, dynamic> data,
      {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.LocalAssetHashEntityData(
      id: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}id'])!,
      updatedAt: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
      checksum: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}checksum'])!,
    );
  }

  @override
  $LocalAssetHashEntityTable createAlias(String alias) {
    return $LocalAssetHashEntityTable(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class LocalAssetHashEntityData extends i0.DataClass
    implements i0.Insertable<i1.LocalAssetHashEntityData> {
  final String id;
  final DateTime updatedAt;
  final String checksum;
  const LocalAssetHashEntityData(
      {required this.id, required this.updatedAt, required this.checksum});
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['id'] = i0.Variable<String>(id);
    map['updated_at'] = i0.Variable<DateTime>(updatedAt);
    map['checksum'] = i0.Variable<String>(checksum);
    return map;
  }

  factory LocalAssetHashEntityData.fromJson(Map<String, dynamic> json,
      {i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return LocalAssetHashEntityData(
      id: serializer.fromJson<String>(json['id']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      checksum: serializer.fromJson<String>(json['checksum']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'checksum': serializer.toJson<String>(checksum),
    };
  }

  i1.LocalAssetHashEntityData copyWith(
          {String? id, DateTime? updatedAt, String? checksum}) =>
      i1.LocalAssetHashEntityData(
        id: id ?? this.id,
        updatedAt: updatedAt ?? this.updatedAt,
        checksum: checksum ?? this.checksum,
      );
  LocalAssetHashEntityData copyWithCompanion(
      i1.LocalAssetHashEntityCompanion data) {
    return LocalAssetHashEntityData(
      id: data.id.present ? data.id.value : this.id,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      checksum: data.checksum.present ? data.checksum.value : this.checksum,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalAssetHashEntityData(')
          ..write('id: $id, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('checksum: $checksum')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, updatedAt, checksum);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.LocalAssetHashEntityData &&
          other.id == this.id &&
          other.updatedAt == this.updatedAt &&
          other.checksum == this.checksum);
}

class LocalAssetHashEntityCompanion
    extends i0.UpdateCompanion<i1.LocalAssetHashEntityData> {
  final i0.Value<String> id;
  final i0.Value<DateTime> updatedAt;
  final i0.Value<String> checksum;
  const LocalAssetHashEntityCompanion({
    this.id = const i0.Value.absent(),
    this.updatedAt = const i0.Value.absent(),
    this.checksum = const i0.Value.absent(),
  });
  LocalAssetHashEntityCompanion.insert({
    required String id,
    this.updatedAt = const i0.Value.absent(),
    required String checksum,
  })  : id = i0.Value(id),
        checksum = i0.Value(checksum);
  static i0.Insertable<i1.LocalAssetHashEntityData> custom({
    i0.Expression<String>? id,
    i0.Expression<DateTime>? updatedAt,
    i0.Expression<String>? checksum,
  }) {
    return i0.RawValuesInsertable({
      if (id != null) 'id': id,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (checksum != null) 'checksum': checksum,
    });
  }

  i1.LocalAssetHashEntityCompanion copyWith(
      {i0.Value<String>? id,
      i0.Value<DateTime>? updatedAt,
      i0.Value<String>? checksum}) {
    return i1.LocalAssetHashEntityCompanion(
      id: id ?? this.id,
      updatedAt: updatedAt ?? this.updatedAt,
      checksum: checksum ?? this.checksum,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (id.present) {
      map['id'] = i0.Variable<String>(id.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = i0.Variable<DateTime>(updatedAt.value);
    }
    if (checksum.present) {
      map['checksum'] = i0.Variable<String>(checksum.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalAssetHashEntityCompanion(')
          ..write('id: $id, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('checksum: $checksum')
          ..write(')'))
        .toString();
  }
}
