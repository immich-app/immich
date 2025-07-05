// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/stack.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/stack.entity.dart' as i2;
import 'package:drift/src/runtime/query_builder/query_builder.dart' as i3;
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart'
    as i4;
import 'package:drift/internal/modular.dart' as i5;
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart'
    as i6;

typedef $$StackEntityTableCreateCompanionBuilder = i1.StackEntityCompanion
    Function({
  required String id,
  i0.Value<DateTime> createdAt,
  i0.Value<DateTime> updatedAt,
  required String ownerId,
  required String primaryAssetId,
});
typedef $$StackEntityTableUpdateCompanionBuilder = i1.StackEntityCompanion
    Function({
  i0.Value<String> id,
  i0.Value<DateTime> createdAt,
  i0.Value<DateTime> updatedAt,
  i0.Value<String> ownerId,
  i0.Value<String> primaryAssetId,
});

final class $$StackEntityTableReferences extends i0.BaseReferences<
    i0.GeneratedDatabase, i1.$StackEntityTable, i1.StackEntityData> {
  $$StackEntityTableReferences(super.$_db, super.$_table, super.$_typedResult);

  static i4.$UserEntityTable _ownerIdTable(i0.GeneratedDatabase db) =>
      i5.ReadDatabaseContainer(db)
          .resultSet<i4.$UserEntityTable>('user_entity')
          .createAlias(i0.$_aliasNameGenerator(
              i5.ReadDatabaseContainer(db)
                  .resultSet<i1.$StackEntityTable>('stack_entity')
                  .ownerId,
              i5.ReadDatabaseContainer(db)
                  .resultSet<i4.$UserEntityTable>('user_entity')
                  .id));

  i4.$$UserEntityTableProcessedTableManager get ownerId {
    final $_column = $_itemColumn<String>('owner_id')!;

    final manager = i4
        .$$UserEntityTableTableManager(
            $_db,
            i5.ReadDatabaseContainer($_db)
                .resultSet<i4.$UserEntityTable>('user_entity'))
        .filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_ownerIdTable($_db));
    if (item == null) return manager;
    return i0.ProcessedTableManager(
        manager.$state.copyWith(prefetchedData: [item]));
  }

  static i6.$RemoteAssetEntityTable _primaryAssetIdTable(
          i0.GeneratedDatabase db) =>
      i5.ReadDatabaseContainer(db)
          .resultSet<i6.$RemoteAssetEntityTable>('remote_asset_entity')
          .createAlias(i0.$_aliasNameGenerator(
              i5.ReadDatabaseContainer(db)
                  .resultSet<i1.$StackEntityTable>('stack_entity')
                  .primaryAssetId,
              i5.ReadDatabaseContainer(db)
                  .resultSet<i6.$RemoteAssetEntityTable>('remote_asset_entity')
                  .id));

  i6.$$RemoteAssetEntityTableProcessedTableManager get primaryAssetId {
    final $_column = $_itemColumn<String>('primary_asset_id')!;

    final manager = i6
        .$$RemoteAssetEntityTableTableManager(
            $_db,
            i5.ReadDatabaseContainer($_db)
                .resultSet<i6.$RemoteAssetEntityTable>('remote_asset_entity'))
        .filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_primaryAssetIdTable($_db));
    if (item == null) return manager;
    return i0.ProcessedTableManager(
        manager.$state.copyWith(prefetchedData: [item]));
  }
}

class $$StackEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$StackEntityTable> {
  $$StackEntityTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => i0.ColumnFilters(column));

  i4.$$UserEntityTableFilterComposer get ownerId {
    final i4.$$UserEntityTableFilterComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.ownerId,
        referencedTable: i5.ReadDatabaseContainer($db)
            .resultSet<i4.$UserEntityTable>('user_entity'),
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            i4.$$UserEntityTableFilterComposer(
              $db: $db,
              $table: i5.ReadDatabaseContainer($db)
                  .resultSet<i4.$UserEntityTable>('user_entity'),
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }

  i6.$$RemoteAssetEntityTableFilterComposer get primaryAssetId {
    final i6.$$RemoteAssetEntityTableFilterComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.primaryAssetId,
        referencedTable: i5.ReadDatabaseContainer($db)
            .resultSet<i6.$RemoteAssetEntityTable>('remote_asset_entity'),
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            i6.$$RemoteAssetEntityTableFilterComposer(
              $db: $db,
              $table: i5.ReadDatabaseContainer($db)
                  .resultSet<i6.$RemoteAssetEntityTable>('remote_asset_entity'),
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$StackEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$StackEntityTable> {
  $$StackEntityTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt,
      builder: (column) => i0.ColumnOrderings(column));

  i4.$$UserEntityTableOrderingComposer get ownerId {
    final i4.$$UserEntityTableOrderingComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.ownerId,
        referencedTable: i5.ReadDatabaseContainer($db)
            .resultSet<i4.$UserEntityTable>('user_entity'),
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            i4.$$UserEntityTableOrderingComposer(
              $db: $db,
              $table: i5.ReadDatabaseContainer($db)
                  .resultSet<i4.$UserEntityTable>('user_entity'),
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }

  i6.$$RemoteAssetEntityTableOrderingComposer get primaryAssetId {
    final i6.$$RemoteAssetEntityTableOrderingComposer composer =
        $composerBuilder(
            composer: this,
            getCurrentColumn: (t) => t.primaryAssetId,
            referencedTable: i5.ReadDatabaseContainer($db)
                .resultSet<i6.$RemoteAssetEntityTable>('remote_asset_entity'),
            getReferencedColumn: (t) => t.id,
            builder: (joinBuilder,
                    {$addJoinBuilderToRootComposer,
                    $removeJoinBuilderFromRootComposer}) =>
                i6.$$RemoteAssetEntityTableOrderingComposer(
                  $db: $db,
                  $table: i5.ReadDatabaseContainer($db)
                      .resultSet<i6.$RemoteAssetEntityTable>(
                          'remote_asset_entity'),
                  $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                  joinBuilder: joinBuilder,
                  $removeJoinBuilderFromRootComposer:
                      $removeJoinBuilderFromRootComposer,
                ));
    return composer;
  }
}

class $$StackEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$StackEntityTable> {
  $$StackEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  i4.$$UserEntityTableAnnotationComposer get ownerId {
    final i4.$$UserEntityTableAnnotationComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.ownerId,
        referencedTable: i5.ReadDatabaseContainer($db)
            .resultSet<i4.$UserEntityTable>('user_entity'),
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            i4.$$UserEntityTableAnnotationComposer(
              $db: $db,
              $table: i5.ReadDatabaseContainer($db)
                  .resultSet<i4.$UserEntityTable>('user_entity'),
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }

  i6.$$RemoteAssetEntityTableAnnotationComposer get primaryAssetId {
    final i6.$$RemoteAssetEntityTableAnnotationComposer composer =
        $composerBuilder(
            composer: this,
            getCurrentColumn: (t) => t.primaryAssetId,
            referencedTable: i5.ReadDatabaseContainer($db)
                .resultSet<i6.$RemoteAssetEntityTable>('remote_asset_entity'),
            getReferencedColumn: (t) => t.id,
            builder: (joinBuilder,
                    {$addJoinBuilderToRootComposer,
                    $removeJoinBuilderFromRootComposer}) =>
                i6.$$RemoteAssetEntityTableAnnotationComposer(
                  $db: $db,
                  $table: i5.ReadDatabaseContainer($db)
                      .resultSet<i6.$RemoteAssetEntityTable>(
                          'remote_asset_entity'),
                  $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                  joinBuilder: joinBuilder,
                  $removeJoinBuilderFromRootComposer:
                      $removeJoinBuilderFromRootComposer,
                ));
    return composer;
  }
}

class $$StackEntityTableTableManager extends i0.RootTableManager<
    i0.GeneratedDatabase,
    i1.$StackEntityTable,
    i1.StackEntityData,
    i1.$$StackEntityTableFilterComposer,
    i1.$$StackEntityTableOrderingComposer,
    i1.$$StackEntityTableAnnotationComposer,
    $$StackEntityTableCreateCompanionBuilder,
    $$StackEntityTableUpdateCompanionBuilder,
    (i1.StackEntityData, i1.$$StackEntityTableReferences),
    i1.StackEntityData,
    i0.PrefetchHooks Function({bool ownerId, bool primaryAssetId})> {
  $$StackEntityTableTableManager(
      i0.GeneratedDatabase db, i1.$StackEntityTable table)
      : super(i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$StackEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              i1.$$StackEntityTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              i1.$$StackEntityTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            i0.Value<String> id = const i0.Value.absent(),
            i0.Value<DateTime> createdAt = const i0.Value.absent(),
            i0.Value<DateTime> updatedAt = const i0.Value.absent(),
            i0.Value<String> ownerId = const i0.Value.absent(),
            i0.Value<String> primaryAssetId = const i0.Value.absent(),
          }) =>
              i1.StackEntityCompanion(
            id: id,
            createdAt: createdAt,
            updatedAt: updatedAt,
            ownerId: ownerId,
            primaryAssetId: primaryAssetId,
          ),
          createCompanionCallback: ({
            required String id,
            i0.Value<DateTime> createdAt = const i0.Value.absent(),
            i0.Value<DateTime> updatedAt = const i0.Value.absent(),
            required String ownerId,
            required String primaryAssetId,
          }) =>
              i1.StackEntityCompanion.insert(
            id: id,
            createdAt: createdAt,
            updatedAt: updatedAt,
            ownerId: ownerId,
            primaryAssetId: primaryAssetId,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (
                    e.readTable(table),
                    i1.$$StackEntityTableReferences(db, table, e)
                  ))
              .toList(),
          prefetchHooksCallback: ({ownerId = false, primaryAssetId = false}) {
            return i0.PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [],
              addJoins: <
                  T extends i0.TableManagerState<
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic>>(state) {
                if (ownerId) {
                  state = state.withJoin(
                    currentTable: table,
                    currentColumn: table.ownerId,
                    referencedTable:
                        i1.$$StackEntityTableReferences._ownerIdTable(db),
                    referencedColumn:
                        i1.$$StackEntityTableReferences._ownerIdTable(db).id,
                  ) as T;
                }
                if (primaryAssetId) {
                  state = state.withJoin(
                    currentTable: table,
                    currentColumn: table.primaryAssetId,
                    referencedTable: i1.$$StackEntityTableReferences
                        ._primaryAssetIdTable(db),
                    referencedColumn: i1.$$StackEntityTableReferences
                        ._primaryAssetIdTable(db)
                        .id,
                  ) as T;
                }

                return state;
              },
              getPrefetchedDataCallback: (items) async {
                return [];
              },
            );
          },
        ));
}

typedef $$StackEntityTableProcessedTableManager = i0.ProcessedTableManager<
    i0.GeneratedDatabase,
    i1.$StackEntityTable,
    i1.StackEntityData,
    i1.$$StackEntityTableFilterComposer,
    i1.$$StackEntityTableOrderingComposer,
    i1.$$StackEntityTableAnnotationComposer,
    $$StackEntityTableCreateCompanionBuilder,
    $$StackEntityTableUpdateCompanionBuilder,
    (i1.StackEntityData, i1.$$StackEntityTableReferences),
    i1.StackEntityData,
    i0.PrefetchHooks Function({bool ownerId, bool primaryAssetId})>;

class $StackEntityTable extends i2.StackEntity
    with i0.TableInfo<$StackEntityTable, i1.StackEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $StackEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _idMeta = const i0.VerificationMeta('id');
  @override
  late final i0.GeneratedColumn<String> id = i0.GeneratedColumn<String>(
      'id', aliasedName, false,
      type: i0.DriftSqlType.string, requiredDuringInsert: true);
  static const i0.VerificationMeta _createdAtMeta =
      const i0.VerificationMeta('createdAt');
  @override
  late final i0.GeneratedColumn<DateTime> createdAt =
      i0.GeneratedColumn<DateTime>('created_at', aliasedName, false,
          type: i0.DriftSqlType.dateTime,
          requiredDuringInsert: false,
          defaultValue: i3.currentDateAndTime);
  static const i0.VerificationMeta _updatedAtMeta =
      const i0.VerificationMeta('updatedAt');
  @override
  late final i0.GeneratedColumn<DateTime> updatedAt =
      i0.GeneratedColumn<DateTime>('updated_at', aliasedName, false,
          type: i0.DriftSqlType.dateTime,
          requiredDuringInsert: false,
          defaultValue: i3.currentDateAndTime);
  static const i0.VerificationMeta _ownerIdMeta =
      const i0.VerificationMeta('ownerId');
  @override
  late final i0.GeneratedColumn<String> ownerId = i0.GeneratedColumn<String>(
      'owner_id', aliasedName, false,
      type: i0.DriftSqlType.string,
      requiredDuringInsert: true,
      defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
          'REFERENCES user_entity (id) ON DELETE CASCADE'));
  static const i0.VerificationMeta _primaryAssetIdMeta =
      const i0.VerificationMeta('primaryAssetId');
  @override
  late final i0.GeneratedColumn<String> primaryAssetId =
      i0.GeneratedColumn<String>(
          'primary_asset_id', aliasedName, false,
          type: i0.DriftSqlType.string,
          requiredDuringInsert: true,
          defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
              'REFERENCES remote_asset_entity (id)'));
  @override
  List<i0.GeneratedColumn> get $columns =>
      [id, createdAt, updatedAt, ownerId, primaryAssetId];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'stack_entity';
  @override
  i0.VerificationContext validateIntegrity(
      i0.Insertable<i1.StackEntityData> instance,
      {bool isInserting = false}) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    if (data.containsKey('owner_id')) {
      context.handle(_ownerIdMeta,
          ownerId.isAcceptableOrUnknown(data['owner_id']!, _ownerIdMeta));
    } else if (isInserting) {
      context.missing(_ownerIdMeta);
    }
    if (data.containsKey('primary_asset_id')) {
      context.handle(
          _primaryAssetIdMeta,
          primaryAssetId.isAcceptableOrUnknown(
              data['primary_asset_id']!, _primaryAssetIdMeta));
    } else if (isInserting) {
      context.missing(_primaryAssetIdMeta);
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {id};
  @override
  i1.StackEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.StackEntityData(
      id: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}id'])!,
      createdAt: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      updatedAt: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
      ownerId: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}owner_id'])!,
      primaryAssetId: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.string, data['${effectivePrefix}primary_asset_id'])!,
    );
  }

  @override
  $StackEntityTable createAlias(String alias) {
    return $StackEntityTable(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class StackEntityData extends i0.DataClass
    implements i0.Insertable<i1.StackEntityData> {
  final String id;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String ownerId;
  final String primaryAssetId;
  const StackEntityData(
      {required this.id,
      required this.createdAt,
      required this.updatedAt,
      required this.ownerId,
      required this.primaryAssetId});
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['id'] = i0.Variable<String>(id);
    map['created_at'] = i0.Variable<DateTime>(createdAt);
    map['updated_at'] = i0.Variable<DateTime>(updatedAt);
    map['owner_id'] = i0.Variable<String>(ownerId);
    map['primary_asset_id'] = i0.Variable<String>(primaryAssetId);
    return map;
  }

  factory StackEntityData.fromJson(Map<String, dynamic> json,
      {i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return StackEntityData(
      id: serializer.fromJson<String>(json['id']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      ownerId: serializer.fromJson<String>(json['ownerId']),
      primaryAssetId: serializer.fromJson<String>(json['primaryAssetId']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'ownerId': serializer.toJson<String>(ownerId),
      'primaryAssetId': serializer.toJson<String>(primaryAssetId),
    };
  }

  i1.StackEntityData copyWith(
          {String? id,
          DateTime? createdAt,
          DateTime? updatedAt,
          String? ownerId,
          String? primaryAssetId}) =>
      i1.StackEntityData(
        id: id ?? this.id,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
        ownerId: ownerId ?? this.ownerId,
        primaryAssetId: primaryAssetId ?? this.primaryAssetId,
      );
  StackEntityData copyWithCompanion(i1.StackEntityCompanion data) {
    return StackEntityData(
      id: data.id.present ? data.id.value : this.id,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      ownerId: data.ownerId.present ? data.ownerId.value : this.ownerId,
      primaryAssetId: data.primaryAssetId.present
          ? data.primaryAssetId.value
          : this.primaryAssetId,
    );
  }

  @override
  String toString() {
    return (StringBuffer('StackEntityData(')
          ..write('id: $id, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('ownerId: $ownerId, ')
          ..write('primaryAssetId: $primaryAssetId')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, createdAt, updatedAt, ownerId, primaryAssetId);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.StackEntityData &&
          other.id == this.id &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt &&
          other.ownerId == this.ownerId &&
          other.primaryAssetId == this.primaryAssetId);
}

class StackEntityCompanion extends i0.UpdateCompanion<i1.StackEntityData> {
  final i0.Value<String> id;
  final i0.Value<DateTime> createdAt;
  final i0.Value<DateTime> updatedAt;
  final i0.Value<String> ownerId;
  final i0.Value<String> primaryAssetId;
  const StackEntityCompanion({
    this.id = const i0.Value.absent(),
    this.createdAt = const i0.Value.absent(),
    this.updatedAt = const i0.Value.absent(),
    this.ownerId = const i0.Value.absent(),
    this.primaryAssetId = const i0.Value.absent(),
  });
  StackEntityCompanion.insert({
    required String id,
    this.createdAt = const i0.Value.absent(),
    this.updatedAt = const i0.Value.absent(),
    required String ownerId,
    required String primaryAssetId,
  })  : id = i0.Value(id),
        ownerId = i0.Value(ownerId),
        primaryAssetId = i0.Value(primaryAssetId);
  static i0.Insertable<i1.StackEntityData> custom({
    i0.Expression<String>? id,
    i0.Expression<DateTime>? createdAt,
    i0.Expression<DateTime>? updatedAt,
    i0.Expression<String>? ownerId,
    i0.Expression<String>? primaryAssetId,
  }) {
    return i0.RawValuesInsertable({
      if (id != null) 'id': id,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (ownerId != null) 'owner_id': ownerId,
      if (primaryAssetId != null) 'primary_asset_id': primaryAssetId,
    });
  }

  i1.StackEntityCompanion copyWith(
      {i0.Value<String>? id,
      i0.Value<DateTime>? createdAt,
      i0.Value<DateTime>? updatedAt,
      i0.Value<String>? ownerId,
      i0.Value<String>? primaryAssetId}) {
    return i1.StackEntityCompanion(
      id: id ?? this.id,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      ownerId: ownerId ?? this.ownerId,
      primaryAssetId: primaryAssetId ?? this.primaryAssetId,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (id.present) {
      map['id'] = i0.Variable<String>(id.value);
    }
    if (createdAt.present) {
      map['created_at'] = i0.Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = i0.Variable<DateTime>(updatedAt.value);
    }
    if (ownerId.present) {
      map['owner_id'] = i0.Variable<String>(ownerId.value);
    }
    if (primaryAssetId.present) {
      map['primary_asset_id'] = i0.Variable<String>(primaryAssetId.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('StackEntityCompanion(')
          ..write('id: $id, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('ownerId: $ownerId, ')
          ..write('primaryAssetId: $primaryAssetId')
          ..write(')'))
        .toString();
  }
}
