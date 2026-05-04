// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/shared_space_asset.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/shared_space_asset.entity.dart'
    as i2;
import 'package:immich_mobile/infrastructure/entities/shared_space.entity.drift.dart'
    as i3;
import 'package:drift/internal/modular.dart' as i4;

typedef $$SharedSpaceAssetEntityTableCreateCompanionBuilder =
    i1.SharedSpaceAssetEntityCompanion Function({
      required String spaceId,
      required String assetId,
    });
typedef $$SharedSpaceAssetEntityTableUpdateCompanionBuilder =
    i1.SharedSpaceAssetEntityCompanion Function({
      i0.Value<String> spaceId,
      i0.Value<String> assetId,
    });

final class $$SharedSpaceAssetEntityTableReferences
    extends
        i0.BaseReferences<
          i0.GeneratedDatabase,
          i1.$SharedSpaceAssetEntityTable,
          i1.SharedSpaceAssetEntityData
        > {
  $$SharedSpaceAssetEntityTableReferences(
    super.$_db,
    super.$_table,
    super.$_typedResult,
  );

  static i3.$SharedSpaceEntityTable _spaceIdTable(i0.GeneratedDatabase db) =>
      i4.ReadDatabaseContainer(db)
          .resultSet<i3.$SharedSpaceEntityTable>('shared_space_entity')
          .createAlias(
            i0.$_aliasNameGenerator(
              i4.ReadDatabaseContainer(db)
                  .resultSet<i1.$SharedSpaceAssetEntityTable>(
                    'shared_space_asset_entity',
                  )
                  .spaceId,
              i4.ReadDatabaseContainer(
                db,
              ).resultSet<i3.$SharedSpaceEntityTable>('shared_space_entity').id,
            ),
          );

  i3.$$SharedSpaceEntityTableProcessedTableManager get spaceId {
    final $_column = $_itemColumn<String>('space_id')!;

    final manager = i3
        .$$SharedSpaceEntityTableTableManager(
          $_db,
          i4.ReadDatabaseContainer(
            $_db,
          ).resultSet<i3.$SharedSpaceEntityTable>('shared_space_entity'),
        )
        .filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_spaceIdTable($_db));
    if (item == null) return manager;
    return i0.ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }
}

class $$SharedSpaceAssetEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$SharedSpaceAssetEntityTable> {
  $$SharedSpaceAssetEntityTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnFilters<String> get assetId => $composableBuilder(
    column: $table.assetId,
    builder: (column) => i0.ColumnFilters(column),
  );

  i3.$$SharedSpaceEntityTableFilterComposer get spaceId {
    final i3.$$SharedSpaceEntityTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.spaceId,
      referencedTable: i4.ReadDatabaseContainer(
        $db,
      ).resultSet<i3.$SharedSpaceEntityTable>('shared_space_entity'),
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => i3.$$SharedSpaceEntityTableFilterComposer(
            $db: $db,
            $table: i4.ReadDatabaseContainer(
              $db,
            ).resultSet<i3.$SharedSpaceEntityTable>('shared_space_entity'),
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$SharedSpaceAssetEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$SharedSpaceAssetEntityTable> {
  $$SharedSpaceAssetEntityTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnOrderings<String> get assetId => $composableBuilder(
    column: $table.assetId,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i3.$$SharedSpaceEntityTableOrderingComposer get spaceId {
    final i3.$$SharedSpaceEntityTableOrderingComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.spaceId,
          referencedTable: i4.ReadDatabaseContainer(
            $db,
          ).resultSet<i3.$SharedSpaceEntityTable>('shared_space_entity'),
          getReferencedColumn: (t) => t.id,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => i3.$$SharedSpaceEntityTableOrderingComposer(
                $db: $db,
                $table: i4.ReadDatabaseContainer(
                  $db,
                ).resultSet<i3.$SharedSpaceEntityTable>('shared_space_entity'),
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return composer;
  }
}

class $$SharedSpaceAssetEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$SharedSpaceAssetEntityTable> {
  $$SharedSpaceAssetEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<String> get assetId =>
      $composableBuilder(column: $table.assetId, builder: (column) => column);

  i3.$$SharedSpaceEntityTableAnnotationComposer get spaceId {
    final i3.$$SharedSpaceEntityTableAnnotationComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.spaceId,
          referencedTable: i4.ReadDatabaseContainer(
            $db,
          ).resultSet<i3.$SharedSpaceEntityTable>('shared_space_entity'),
          getReferencedColumn: (t) => t.id,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => i3.$$SharedSpaceEntityTableAnnotationComposer(
                $db: $db,
                $table: i4.ReadDatabaseContainer(
                  $db,
                ).resultSet<i3.$SharedSpaceEntityTable>('shared_space_entity'),
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return composer;
  }
}

class $$SharedSpaceAssetEntityTableTableManager
    extends
        i0.RootTableManager<
          i0.GeneratedDatabase,
          i1.$SharedSpaceAssetEntityTable,
          i1.SharedSpaceAssetEntityData,
          i1.$$SharedSpaceAssetEntityTableFilterComposer,
          i1.$$SharedSpaceAssetEntityTableOrderingComposer,
          i1.$$SharedSpaceAssetEntityTableAnnotationComposer,
          $$SharedSpaceAssetEntityTableCreateCompanionBuilder,
          $$SharedSpaceAssetEntityTableUpdateCompanionBuilder,
          (
            i1.SharedSpaceAssetEntityData,
            i1.$$SharedSpaceAssetEntityTableReferences,
          ),
          i1.SharedSpaceAssetEntityData,
          i0.PrefetchHooks Function({bool spaceId})
        > {
  $$SharedSpaceAssetEntityTableTableManager(
    i0.GeneratedDatabase db,
    i1.$SharedSpaceAssetEntityTable table,
  ) : super(
        i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$SharedSpaceAssetEntityTableFilterComposer(
                $db: db,
                $table: table,
              ),
          createOrderingComposer: () =>
              i1.$$SharedSpaceAssetEntityTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              i1.$$SharedSpaceAssetEntityTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                i0.Value<String> spaceId = const i0.Value.absent(),
                i0.Value<String> assetId = const i0.Value.absent(),
              }) => i1.SharedSpaceAssetEntityCompanion(
                spaceId: spaceId,
                assetId: assetId,
              ),
          createCompanionCallback:
              ({required String spaceId, required String assetId}) =>
                  i1.SharedSpaceAssetEntityCompanion.insert(
                    spaceId: spaceId,
                    assetId: assetId,
                  ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable(table),
                  i1.$$SharedSpaceAssetEntityTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: ({spaceId = false}) {
            return i0.PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [],
              addJoins:
                  <
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
                      dynamic
                    >
                  >(state) {
                    if (spaceId) {
                      state =
                          state.withJoin(
                                currentTable: table,
                                currentColumn: table.spaceId,
                                referencedTable: i1
                                    .$$SharedSpaceAssetEntityTableReferences
                                    ._spaceIdTable(db),
                                referencedColumn: i1
                                    .$$SharedSpaceAssetEntityTableReferences
                                    ._spaceIdTable(db)
                                    .id,
                              )
                              as T;
                    }

                    return state;
                  },
              getPrefetchedDataCallback: (items) async {
                return [];
              },
            );
          },
        ),
      );
}

typedef $$SharedSpaceAssetEntityTableProcessedTableManager =
    i0.ProcessedTableManager<
      i0.GeneratedDatabase,
      i1.$SharedSpaceAssetEntityTable,
      i1.SharedSpaceAssetEntityData,
      i1.$$SharedSpaceAssetEntityTableFilterComposer,
      i1.$$SharedSpaceAssetEntityTableOrderingComposer,
      i1.$$SharedSpaceAssetEntityTableAnnotationComposer,
      $$SharedSpaceAssetEntityTableCreateCompanionBuilder,
      $$SharedSpaceAssetEntityTableUpdateCompanionBuilder,
      (
        i1.SharedSpaceAssetEntityData,
        i1.$$SharedSpaceAssetEntityTableReferences,
      ),
      i1.SharedSpaceAssetEntityData,
      i0.PrefetchHooks Function({bool spaceId})
    >;
i0.Index get idxSharedSpaceAssetSpaceAsset => i0.Index(
  'idx_shared_space_asset_space_asset',
  'CREATE INDEX IF NOT EXISTS idx_shared_space_asset_space_asset ON shared_space_asset_entity (space_id, asset_id)',
);

class $SharedSpaceAssetEntityTable extends i2.SharedSpaceAssetEntity
    with
        i0.TableInfo<
          $SharedSpaceAssetEntityTable,
          i1.SharedSpaceAssetEntityData
        > {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SharedSpaceAssetEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _spaceIdMeta = const i0.VerificationMeta(
    'spaceId',
  );
  @override
  late final i0.GeneratedColumn<String> spaceId = i0.GeneratedColumn<String>(
    'space_id',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
      'REFERENCES shared_space_entity (id) ON DELETE CASCADE',
    ),
  );
  static const i0.VerificationMeta _assetIdMeta = const i0.VerificationMeta(
    'assetId',
  );
  @override
  late final i0.GeneratedColumn<String> assetId = i0.GeneratedColumn<String>(
    'asset_id',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  List<i0.GeneratedColumn> get $columns => [spaceId, assetId];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'shared_space_asset_entity';
  @override
  i0.VerificationContext validateIntegrity(
    i0.Insertable<i1.SharedSpaceAssetEntityData> instance, {
    bool isInserting = false,
  }) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('space_id')) {
      context.handle(
        _spaceIdMeta,
        spaceId.isAcceptableOrUnknown(data['space_id']!, _spaceIdMeta),
      );
    } else if (isInserting) {
      context.missing(_spaceIdMeta);
    }
    if (data.containsKey('asset_id')) {
      context.handle(
        _assetIdMeta,
        assetId.isAcceptableOrUnknown(data['asset_id']!, _assetIdMeta),
      );
    } else if (isInserting) {
      context.missing(_assetIdMeta);
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {spaceId, assetId};
  @override
  i1.SharedSpaceAssetEntityData map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.SharedSpaceAssetEntityData(
      spaceId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}space_id'],
      )!,
      assetId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}asset_id'],
      )!,
    );
  }

  @override
  $SharedSpaceAssetEntityTable createAlias(String alias) {
    return $SharedSpaceAssetEntityTable(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class SharedSpaceAssetEntityData extends i0.DataClass
    implements i0.Insertable<i1.SharedSpaceAssetEntityData> {
  final String spaceId;
  final String assetId;
  const SharedSpaceAssetEntityData({
    required this.spaceId,
    required this.assetId,
  });
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['space_id'] = i0.Variable<String>(spaceId);
    map['asset_id'] = i0.Variable<String>(assetId);
    return map;
  }

  factory SharedSpaceAssetEntityData.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return SharedSpaceAssetEntityData(
      spaceId: serializer.fromJson<String>(json['spaceId']),
      assetId: serializer.fromJson<String>(json['assetId']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'spaceId': serializer.toJson<String>(spaceId),
      'assetId': serializer.toJson<String>(assetId),
    };
  }

  i1.SharedSpaceAssetEntityData copyWith({String? spaceId, String? assetId}) =>
      i1.SharedSpaceAssetEntityData(
        spaceId: spaceId ?? this.spaceId,
        assetId: assetId ?? this.assetId,
      );
  SharedSpaceAssetEntityData copyWithCompanion(
    i1.SharedSpaceAssetEntityCompanion data,
  ) {
    return SharedSpaceAssetEntityData(
      spaceId: data.spaceId.present ? data.spaceId.value : this.spaceId,
      assetId: data.assetId.present ? data.assetId.value : this.assetId,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SharedSpaceAssetEntityData(')
          ..write('spaceId: $spaceId, ')
          ..write('assetId: $assetId')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(spaceId, assetId);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.SharedSpaceAssetEntityData &&
          other.spaceId == this.spaceId &&
          other.assetId == this.assetId);
}

class SharedSpaceAssetEntityCompanion
    extends i0.UpdateCompanion<i1.SharedSpaceAssetEntityData> {
  final i0.Value<String> spaceId;
  final i0.Value<String> assetId;
  const SharedSpaceAssetEntityCompanion({
    this.spaceId = const i0.Value.absent(),
    this.assetId = const i0.Value.absent(),
  });
  SharedSpaceAssetEntityCompanion.insert({
    required String spaceId,
    required String assetId,
  }) : spaceId = i0.Value(spaceId),
       assetId = i0.Value(assetId);
  static i0.Insertable<i1.SharedSpaceAssetEntityData> custom({
    i0.Expression<String>? spaceId,
    i0.Expression<String>? assetId,
  }) {
    return i0.RawValuesInsertable({
      if (spaceId != null) 'space_id': spaceId,
      if (assetId != null) 'asset_id': assetId,
    });
  }

  i1.SharedSpaceAssetEntityCompanion copyWith({
    i0.Value<String>? spaceId,
    i0.Value<String>? assetId,
  }) {
    return i1.SharedSpaceAssetEntityCompanion(
      spaceId: spaceId ?? this.spaceId,
      assetId: assetId ?? this.assetId,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (spaceId.present) {
      map['space_id'] = i0.Variable<String>(spaceId.value);
    }
    if (assetId.present) {
      map['asset_id'] = i0.Variable<String>(assetId.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SharedSpaceAssetEntityCompanion(')
          ..write('spaceId: $spaceId, ')
          ..write('assetId: $assetId')
          ..write(')'))
        .toString();
  }
}

i0.Index get idxSharedSpaceAssetAssetSpace => i0.Index(
  'idx_shared_space_asset_asset_space',
  'CREATE INDEX IF NOT EXISTS idx_shared_space_asset_asset_space ON shared_space_asset_entity (asset_id, space_id)',
);
