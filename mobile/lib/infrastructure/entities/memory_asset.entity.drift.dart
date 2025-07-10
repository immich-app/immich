// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/memory_asset.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/memory_asset.entity.dart'
    as i2;
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart'
    as i3;
import 'package:drift/internal/modular.dart' as i4;
import 'package:immich_mobile/infrastructure/entities/memory.entity.drift.dart'
    as i5;

typedef $$MemoryAssetEntityTableCreateCompanionBuilder
    = i1.MemoryAssetEntityCompanion Function({
  required String assetId,
  required String memoryId,
});
typedef $$MemoryAssetEntityTableUpdateCompanionBuilder
    = i1.MemoryAssetEntityCompanion Function({
  i0.Value<String> assetId,
  i0.Value<String> memoryId,
});

final class $$MemoryAssetEntityTableReferences extends i0.BaseReferences<
    i0.GeneratedDatabase,
    i1.$MemoryAssetEntityTable,
    i1.MemoryAssetEntityData> {
  $$MemoryAssetEntityTableReferences(
      super.$_db, super.$_table, super.$_typedResult);

  static i3.$RemoteAssetEntityTable _assetIdTable(i0.GeneratedDatabase db) =>
      i4.ReadDatabaseContainer(db)
          .resultSet<i3.$RemoteAssetEntityTable>('remote_asset_entity')
          .createAlias(i0.$_aliasNameGenerator(
              i4.ReadDatabaseContainer(db)
                  .resultSet<i1.$MemoryAssetEntityTable>('memory_asset_entity')
                  .assetId,
              i4.ReadDatabaseContainer(db)
                  .resultSet<i3.$RemoteAssetEntityTable>('remote_asset_entity')
                  .id));

  i3.$$RemoteAssetEntityTableProcessedTableManager get assetId {
    final $_column = $_itemColumn<String>('asset_id')!;

    final manager = i3
        .$$RemoteAssetEntityTableTableManager(
            $_db,
            i4.ReadDatabaseContainer($_db)
                .resultSet<i3.$RemoteAssetEntityTable>('remote_asset_entity'))
        .filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_assetIdTable($_db));
    if (item == null) return manager;
    return i0.ProcessedTableManager(
        manager.$state.copyWith(prefetchedData: [item]));
  }

  static i5.$MemoryEntityTable _memoryIdTable(i0.GeneratedDatabase db) =>
      i4.ReadDatabaseContainer(db)
          .resultSet<i5.$MemoryEntityTable>('memory_entity')
          .createAlias(i0.$_aliasNameGenerator(
              i4.ReadDatabaseContainer(db)
                  .resultSet<i1.$MemoryAssetEntityTable>('memory_asset_entity')
                  .memoryId,
              i4.ReadDatabaseContainer(db)
                  .resultSet<i5.$MemoryEntityTable>('memory_entity')
                  .id));

  i5.$$MemoryEntityTableProcessedTableManager get memoryId {
    final $_column = $_itemColumn<String>('memory_id')!;

    final manager = i5
        .$$MemoryEntityTableTableManager(
            $_db,
            i4.ReadDatabaseContainer($_db)
                .resultSet<i5.$MemoryEntityTable>('memory_entity'))
        .filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_memoryIdTable($_db));
    if (item == null) return manager;
    return i0.ProcessedTableManager(
        manager.$state.copyWith(prefetchedData: [item]));
  }
}

class $$MemoryAssetEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$MemoryAssetEntityTable> {
  $$MemoryAssetEntityTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i3.$$RemoteAssetEntityTableFilterComposer get assetId {
    final i3.$$RemoteAssetEntityTableFilterComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.assetId,
        referencedTable: i4.ReadDatabaseContainer($db)
            .resultSet<i3.$RemoteAssetEntityTable>('remote_asset_entity'),
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            i3.$$RemoteAssetEntityTableFilterComposer(
              $db: $db,
              $table: i4.ReadDatabaseContainer($db)
                  .resultSet<i3.$RemoteAssetEntityTable>('remote_asset_entity'),
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }

  i5.$$MemoryEntityTableFilterComposer get memoryId {
    final i5.$$MemoryEntityTableFilterComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.memoryId,
        referencedTable: i4.ReadDatabaseContainer($db)
            .resultSet<i5.$MemoryEntityTable>('memory_entity'),
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            i5.$$MemoryEntityTableFilterComposer(
              $db: $db,
              $table: i4.ReadDatabaseContainer($db)
                  .resultSet<i5.$MemoryEntityTable>('memory_entity'),
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$MemoryAssetEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$MemoryAssetEntityTable> {
  $$MemoryAssetEntityTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i3.$$RemoteAssetEntityTableOrderingComposer get assetId {
    final i3.$$RemoteAssetEntityTableOrderingComposer composer =
        $composerBuilder(
            composer: this,
            getCurrentColumn: (t) => t.assetId,
            referencedTable: i4.ReadDatabaseContainer($db)
                .resultSet<i3.$RemoteAssetEntityTable>('remote_asset_entity'),
            getReferencedColumn: (t) => t.id,
            builder: (joinBuilder,
                    {$addJoinBuilderToRootComposer,
                    $removeJoinBuilderFromRootComposer}) =>
                i3.$$RemoteAssetEntityTableOrderingComposer(
                  $db: $db,
                  $table: i4.ReadDatabaseContainer($db)
                      .resultSet<i3.$RemoteAssetEntityTable>(
                          'remote_asset_entity'),
                  $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                  joinBuilder: joinBuilder,
                  $removeJoinBuilderFromRootComposer:
                      $removeJoinBuilderFromRootComposer,
                ));
    return composer;
  }

  i5.$$MemoryEntityTableOrderingComposer get memoryId {
    final i5.$$MemoryEntityTableOrderingComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.memoryId,
        referencedTable: i4.ReadDatabaseContainer($db)
            .resultSet<i5.$MemoryEntityTable>('memory_entity'),
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            i5.$$MemoryEntityTableOrderingComposer(
              $db: $db,
              $table: i4.ReadDatabaseContainer($db)
                  .resultSet<i5.$MemoryEntityTable>('memory_entity'),
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$MemoryAssetEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$MemoryAssetEntityTable> {
  $$MemoryAssetEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i3.$$RemoteAssetEntityTableAnnotationComposer get assetId {
    final i3.$$RemoteAssetEntityTableAnnotationComposer composer =
        $composerBuilder(
            composer: this,
            getCurrentColumn: (t) => t.assetId,
            referencedTable: i4.ReadDatabaseContainer($db)
                .resultSet<i3.$RemoteAssetEntityTable>('remote_asset_entity'),
            getReferencedColumn: (t) => t.id,
            builder: (joinBuilder,
                    {$addJoinBuilderToRootComposer,
                    $removeJoinBuilderFromRootComposer}) =>
                i3.$$RemoteAssetEntityTableAnnotationComposer(
                  $db: $db,
                  $table: i4.ReadDatabaseContainer($db)
                      .resultSet<i3.$RemoteAssetEntityTable>(
                          'remote_asset_entity'),
                  $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                  joinBuilder: joinBuilder,
                  $removeJoinBuilderFromRootComposer:
                      $removeJoinBuilderFromRootComposer,
                ));
    return composer;
  }

  i5.$$MemoryEntityTableAnnotationComposer get memoryId {
    final i5.$$MemoryEntityTableAnnotationComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.memoryId,
        referencedTable: i4.ReadDatabaseContainer($db)
            .resultSet<i5.$MemoryEntityTable>('memory_entity'),
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            i5.$$MemoryEntityTableAnnotationComposer(
              $db: $db,
              $table: i4.ReadDatabaseContainer($db)
                  .resultSet<i5.$MemoryEntityTable>('memory_entity'),
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$MemoryAssetEntityTableTableManager extends i0.RootTableManager<
    i0.GeneratedDatabase,
    i1.$MemoryAssetEntityTable,
    i1.MemoryAssetEntityData,
    i1.$$MemoryAssetEntityTableFilterComposer,
    i1.$$MemoryAssetEntityTableOrderingComposer,
    i1.$$MemoryAssetEntityTableAnnotationComposer,
    $$MemoryAssetEntityTableCreateCompanionBuilder,
    $$MemoryAssetEntityTableUpdateCompanionBuilder,
    (i1.MemoryAssetEntityData, i1.$$MemoryAssetEntityTableReferences),
    i1.MemoryAssetEntityData,
    i0.PrefetchHooks Function({bool assetId, bool memoryId})> {
  $$MemoryAssetEntityTableTableManager(
      i0.GeneratedDatabase db, i1.$MemoryAssetEntityTable table)
      : super(i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$MemoryAssetEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () => i1
              .$$MemoryAssetEntityTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              i1.$$MemoryAssetEntityTableAnnotationComposer(
                  $db: db, $table: table),
          updateCompanionCallback: ({
            i0.Value<String> assetId = const i0.Value.absent(),
            i0.Value<String> memoryId = const i0.Value.absent(),
          }) =>
              i1.MemoryAssetEntityCompanion(
            assetId: assetId,
            memoryId: memoryId,
          ),
          createCompanionCallback: ({
            required String assetId,
            required String memoryId,
          }) =>
              i1.MemoryAssetEntityCompanion.insert(
            assetId: assetId,
            memoryId: memoryId,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (
                    e.readTable(table),
                    i1.$$MemoryAssetEntityTableReferences(db, table, e)
                  ))
              .toList(),
          prefetchHooksCallback: ({assetId = false, memoryId = false}) {
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
                if (assetId) {
                  state = state.withJoin(
                    currentTable: table,
                    currentColumn: table.assetId,
                    referencedTable:
                        i1.$$MemoryAssetEntityTableReferences._assetIdTable(db),
                    referencedColumn: i1.$$MemoryAssetEntityTableReferences
                        ._assetIdTable(db)
                        .id,
                  ) as T;
                }
                if (memoryId) {
                  state = state.withJoin(
                    currentTable: table,
                    currentColumn: table.memoryId,
                    referencedTable: i1.$$MemoryAssetEntityTableReferences
                        ._memoryIdTable(db),
                    referencedColumn: i1.$$MemoryAssetEntityTableReferences
                        ._memoryIdTable(db)
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

typedef $$MemoryAssetEntityTableProcessedTableManager
    = i0.ProcessedTableManager<
        i0.GeneratedDatabase,
        i1.$MemoryAssetEntityTable,
        i1.MemoryAssetEntityData,
        i1.$$MemoryAssetEntityTableFilterComposer,
        i1.$$MemoryAssetEntityTableOrderingComposer,
        i1.$$MemoryAssetEntityTableAnnotationComposer,
        $$MemoryAssetEntityTableCreateCompanionBuilder,
        $$MemoryAssetEntityTableUpdateCompanionBuilder,
        (i1.MemoryAssetEntityData, i1.$$MemoryAssetEntityTableReferences),
        i1.MemoryAssetEntityData,
        i0.PrefetchHooks Function({bool assetId, bool memoryId})>;

class $MemoryAssetEntityTable extends i2.MemoryAssetEntity
    with i0.TableInfo<$MemoryAssetEntityTable, i1.MemoryAssetEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $MemoryAssetEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _assetIdMeta =
      const i0.VerificationMeta('assetId');
  @override
  late final i0.GeneratedColumn<String> assetId = i0.GeneratedColumn<String>(
      'asset_id', aliasedName, false,
      type: i0.DriftSqlType.string,
      requiredDuringInsert: true,
      defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
          'REFERENCES remote_asset_entity (id) ON DELETE CASCADE'));
  static const i0.VerificationMeta _memoryIdMeta =
      const i0.VerificationMeta('memoryId');
  @override
  late final i0.GeneratedColumn<String> memoryId = i0.GeneratedColumn<String>(
      'memory_id', aliasedName, false,
      type: i0.DriftSqlType.string,
      requiredDuringInsert: true,
      defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
          'REFERENCES memory_entity (id) ON DELETE CASCADE'));
  @override
  List<i0.GeneratedColumn> get $columns => [assetId, memoryId];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'memory_asset_entity';
  @override
  i0.VerificationContext validateIntegrity(
      i0.Insertable<i1.MemoryAssetEntityData> instance,
      {bool isInserting = false}) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('asset_id')) {
      context.handle(_assetIdMeta,
          assetId.isAcceptableOrUnknown(data['asset_id']!, _assetIdMeta));
    } else if (isInserting) {
      context.missing(_assetIdMeta);
    }
    if (data.containsKey('memory_id')) {
      context.handle(_memoryIdMeta,
          memoryId.isAcceptableOrUnknown(data['memory_id']!, _memoryIdMeta));
    } else if (isInserting) {
      context.missing(_memoryIdMeta);
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {assetId, memoryId};
  @override
  i1.MemoryAssetEntityData map(Map<String, dynamic> data,
      {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.MemoryAssetEntityData(
      assetId: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}asset_id'])!,
      memoryId: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}memory_id'])!,
    );
  }

  @override
  $MemoryAssetEntityTable createAlias(String alias) {
    return $MemoryAssetEntityTable(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class MemoryAssetEntityData extends i0.DataClass
    implements i0.Insertable<i1.MemoryAssetEntityData> {
  final String assetId;
  final String memoryId;
  const MemoryAssetEntityData({required this.assetId, required this.memoryId});
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['asset_id'] = i0.Variable<String>(assetId);
    map['memory_id'] = i0.Variable<String>(memoryId);
    return map;
  }

  factory MemoryAssetEntityData.fromJson(Map<String, dynamic> json,
      {i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return MemoryAssetEntityData(
      assetId: serializer.fromJson<String>(json['assetId']),
      memoryId: serializer.fromJson<String>(json['memoryId']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'assetId': serializer.toJson<String>(assetId),
      'memoryId': serializer.toJson<String>(memoryId),
    };
  }

  i1.MemoryAssetEntityData copyWith({String? assetId, String? memoryId}) =>
      i1.MemoryAssetEntityData(
        assetId: assetId ?? this.assetId,
        memoryId: memoryId ?? this.memoryId,
      );
  MemoryAssetEntityData copyWithCompanion(i1.MemoryAssetEntityCompanion data) {
    return MemoryAssetEntityData(
      assetId: data.assetId.present ? data.assetId.value : this.assetId,
      memoryId: data.memoryId.present ? data.memoryId.value : this.memoryId,
    );
  }

  @override
  String toString() {
    return (StringBuffer('MemoryAssetEntityData(')
          ..write('assetId: $assetId, ')
          ..write('memoryId: $memoryId')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(assetId, memoryId);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.MemoryAssetEntityData &&
          other.assetId == this.assetId &&
          other.memoryId == this.memoryId);
}

class MemoryAssetEntityCompanion
    extends i0.UpdateCompanion<i1.MemoryAssetEntityData> {
  final i0.Value<String> assetId;
  final i0.Value<String> memoryId;
  const MemoryAssetEntityCompanion({
    this.assetId = const i0.Value.absent(),
    this.memoryId = const i0.Value.absent(),
  });
  MemoryAssetEntityCompanion.insert({
    required String assetId,
    required String memoryId,
  })  : assetId = i0.Value(assetId),
        memoryId = i0.Value(memoryId);
  static i0.Insertable<i1.MemoryAssetEntityData> custom({
    i0.Expression<String>? assetId,
    i0.Expression<String>? memoryId,
  }) {
    return i0.RawValuesInsertable({
      if (assetId != null) 'asset_id': assetId,
      if (memoryId != null) 'memory_id': memoryId,
    });
  }

  i1.MemoryAssetEntityCompanion copyWith(
      {i0.Value<String>? assetId, i0.Value<String>? memoryId}) {
    return i1.MemoryAssetEntityCompanion(
      assetId: assetId ?? this.assetId,
      memoryId: memoryId ?? this.memoryId,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (assetId.present) {
      map['asset_id'] = i0.Variable<String>(assetId.value);
    }
    if (memoryId.present) {
      map['memory_id'] = i0.Variable<String>(memoryId.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('MemoryAssetEntityCompanion(')
          ..write('assetId: $assetId, ')
          ..write('memoryId: $memoryId')
          ..write(')'))
        .toString();
  }
}
