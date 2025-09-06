// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/remote_asset_cloud_id.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/remote_asset_cloud_id.entity.dart'
    as i2;
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart'
    as i3;
import 'package:drift/internal/modular.dart' as i4;

typedef $$RemoteAssetCloudIdEntityTableCreateCompanionBuilder =
    i1.RemoteAssetCloudIdEntityCompanion Function({
      required String assetId,
      i0.Value<String?> cloudId,
    });
typedef $$RemoteAssetCloudIdEntityTableUpdateCompanionBuilder =
    i1.RemoteAssetCloudIdEntityCompanion Function({
      i0.Value<String> assetId,
      i0.Value<String?> cloudId,
    });

final class $$RemoteAssetCloudIdEntityTableReferences
    extends
        i0.BaseReferences<
          i0.GeneratedDatabase,
          i1.$RemoteAssetCloudIdEntityTable,
          i1.RemoteAssetCloudIdEntityData
        > {
  $$RemoteAssetCloudIdEntityTableReferences(
    super.$_db,
    super.$_table,
    super.$_typedResult,
  );

  static i3.$RemoteAssetEntityTable _assetIdTable(i0.GeneratedDatabase db) =>
      i4.ReadDatabaseContainer(db)
          .resultSet<i3.$RemoteAssetEntityTable>('remote_asset_entity')
          .createAlias(
            i0.$_aliasNameGenerator(
              i4.ReadDatabaseContainer(db)
                  .resultSet<i1.$RemoteAssetCloudIdEntityTable>(
                    'remote_asset_cloud_id_entity',
                  )
                  .assetId,
              i4.ReadDatabaseContainer(
                db,
              ).resultSet<i3.$RemoteAssetEntityTable>('remote_asset_entity').id,
            ),
          );

  i3.$$RemoteAssetEntityTableProcessedTableManager get assetId {
    final $_column = $_itemColumn<String>('asset_id')!;

    final manager = i3
        .$$RemoteAssetEntityTableTableManager(
          $_db,
          i4.ReadDatabaseContainer(
            $_db,
          ).resultSet<i3.$RemoteAssetEntityTable>('remote_asset_entity'),
        )
        .filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_assetIdTable($_db));
    if (item == null) return manager;
    return i0.ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }
}

class $$RemoteAssetCloudIdEntityTableFilterComposer
    extends
        i0.Composer<i0.GeneratedDatabase, i1.$RemoteAssetCloudIdEntityTable> {
  $$RemoteAssetCloudIdEntityTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnFilters<String> get cloudId => $composableBuilder(
    column: $table.cloudId,
    builder: (column) => i0.ColumnFilters(column),
  );

  i3.$$RemoteAssetEntityTableFilterComposer get assetId {
    final i3.$$RemoteAssetEntityTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.assetId,
      referencedTable: i4.ReadDatabaseContainer(
        $db,
      ).resultSet<i3.$RemoteAssetEntityTable>('remote_asset_entity'),
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => i3.$$RemoteAssetEntityTableFilterComposer(
            $db: $db,
            $table: i4.ReadDatabaseContainer(
              $db,
            ).resultSet<i3.$RemoteAssetEntityTable>('remote_asset_entity'),
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$RemoteAssetCloudIdEntityTableOrderingComposer
    extends
        i0.Composer<i0.GeneratedDatabase, i1.$RemoteAssetCloudIdEntityTable> {
  $$RemoteAssetCloudIdEntityTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnOrderings<String> get cloudId => $composableBuilder(
    column: $table.cloudId,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i3.$$RemoteAssetEntityTableOrderingComposer get assetId {
    final i3.$$RemoteAssetEntityTableOrderingComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.assetId,
          referencedTable: i4.ReadDatabaseContainer(
            $db,
          ).resultSet<i3.$RemoteAssetEntityTable>('remote_asset_entity'),
          getReferencedColumn: (t) => t.id,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => i3.$$RemoteAssetEntityTableOrderingComposer(
                $db: $db,
                $table: i4.ReadDatabaseContainer(
                  $db,
                ).resultSet<i3.$RemoteAssetEntityTable>('remote_asset_entity'),
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return composer;
  }
}

class $$RemoteAssetCloudIdEntityTableAnnotationComposer
    extends
        i0.Composer<i0.GeneratedDatabase, i1.$RemoteAssetCloudIdEntityTable> {
  $$RemoteAssetCloudIdEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<String> get cloudId =>
      $composableBuilder(column: $table.cloudId, builder: (column) => column);

  i3.$$RemoteAssetEntityTableAnnotationComposer get assetId {
    final i3.$$RemoteAssetEntityTableAnnotationComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.assetId,
          referencedTable: i4.ReadDatabaseContainer(
            $db,
          ).resultSet<i3.$RemoteAssetEntityTable>('remote_asset_entity'),
          getReferencedColumn: (t) => t.id,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => i3.$$RemoteAssetEntityTableAnnotationComposer(
                $db: $db,
                $table: i4.ReadDatabaseContainer(
                  $db,
                ).resultSet<i3.$RemoteAssetEntityTable>('remote_asset_entity'),
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return composer;
  }
}

class $$RemoteAssetCloudIdEntityTableTableManager
    extends
        i0.RootTableManager<
          i0.GeneratedDatabase,
          i1.$RemoteAssetCloudIdEntityTable,
          i1.RemoteAssetCloudIdEntityData,
          i1.$$RemoteAssetCloudIdEntityTableFilterComposer,
          i1.$$RemoteAssetCloudIdEntityTableOrderingComposer,
          i1.$$RemoteAssetCloudIdEntityTableAnnotationComposer,
          $$RemoteAssetCloudIdEntityTableCreateCompanionBuilder,
          $$RemoteAssetCloudIdEntityTableUpdateCompanionBuilder,
          (
            i1.RemoteAssetCloudIdEntityData,
            i1.$$RemoteAssetCloudIdEntityTableReferences,
          ),
          i1.RemoteAssetCloudIdEntityData,
          i0.PrefetchHooks Function({bool assetId})
        > {
  $$RemoteAssetCloudIdEntityTableTableManager(
    i0.GeneratedDatabase db,
    i1.$RemoteAssetCloudIdEntityTable table,
  ) : super(
        i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$RemoteAssetCloudIdEntityTableFilterComposer(
                $db: db,
                $table: table,
              ),
          createOrderingComposer: () =>
              i1.$$RemoteAssetCloudIdEntityTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              i1.$$RemoteAssetCloudIdEntityTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                i0.Value<String> assetId = const i0.Value.absent(),
                i0.Value<String?> cloudId = const i0.Value.absent(),
              }) => i1.RemoteAssetCloudIdEntityCompanion(
                assetId: assetId,
                cloudId: cloudId,
              ),
          createCompanionCallback:
              ({
                required String assetId,
                i0.Value<String?> cloudId = const i0.Value.absent(),
              }) => i1.RemoteAssetCloudIdEntityCompanion.insert(
                assetId: assetId,
                cloudId: cloudId,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable(table),
                  i1.$$RemoteAssetCloudIdEntityTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: ({assetId = false}) {
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
                    if (assetId) {
                      state =
                          state.withJoin(
                                currentTable: table,
                                currentColumn: table.assetId,
                                referencedTable: i1
                                    .$$RemoteAssetCloudIdEntityTableReferences
                                    ._assetIdTable(db),
                                referencedColumn: i1
                                    .$$RemoteAssetCloudIdEntityTableReferences
                                    ._assetIdTable(db)
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

typedef $$RemoteAssetCloudIdEntityTableProcessedTableManager =
    i0.ProcessedTableManager<
      i0.GeneratedDatabase,
      i1.$RemoteAssetCloudIdEntityTable,
      i1.RemoteAssetCloudIdEntityData,
      i1.$$RemoteAssetCloudIdEntityTableFilterComposer,
      i1.$$RemoteAssetCloudIdEntityTableOrderingComposer,
      i1.$$RemoteAssetCloudIdEntityTableAnnotationComposer,
      $$RemoteAssetCloudIdEntityTableCreateCompanionBuilder,
      $$RemoteAssetCloudIdEntityTableUpdateCompanionBuilder,
      (
        i1.RemoteAssetCloudIdEntityData,
        i1.$$RemoteAssetCloudIdEntityTableReferences,
      ),
      i1.RemoteAssetCloudIdEntityData,
      i0.PrefetchHooks Function({bool assetId})
    >;

class $RemoteAssetCloudIdEntityTable extends i2.RemoteAssetCloudIdEntity
    with
        i0.TableInfo<
          $RemoteAssetCloudIdEntityTable,
          i1.RemoteAssetCloudIdEntityData
        > {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $RemoteAssetCloudIdEntityTable(this.attachedDatabase, [this._alias]);
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
    defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
      'REFERENCES remote_asset_entity (id) ON DELETE CASCADE',
    ),
  );
  static const i0.VerificationMeta _cloudIdMeta = const i0.VerificationMeta(
    'cloudId',
  );
  @override
  late final i0.GeneratedColumn<String> cloudId = i0.GeneratedColumn<String>(
    'cloud_id',
    aliasedName,
    true,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: false,
    defaultConstraints: i0.GeneratedColumn.constraintIsAlways('UNIQUE'),
  );
  @override
  List<i0.GeneratedColumn> get $columns => [assetId, cloudId];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'remote_asset_cloud_id_entity';
  @override
  i0.VerificationContext validateIntegrity(
    i0.Insertable<i1.RemoteAssetCloudIdEntityData> instance, {
    bool isInserting = false,
  }) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('asset_id')) {
      context.handle(
        _assetIdMeta,
        assetId.isAcceptableOrUnknown(data['asset_id']!, _assetIdMeta),
      );
    } else if (isInserting) {
      context.missing(_assetIdMeta);
    }
    if (data.containsKey('cloud_id')) {
      context.handle(
        _cloudIdMeta,
        cloudId.isAcceptableOrUnknown(data['cloud_id']!, _cloudIdMeta),
      );
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {assetId};
  @override
  i1.RemoteAssetCloudIdEntityData map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.RemoteAssetCloudIdEntityData(
      assetId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}asset_id'],
      )!,
      cloudId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}cloud_id'],
      ),
    );
  }

  @override
  $RemoteAssetCloudIdEntityTable createAlias(String alias) {
    return $RemoteAssetCloudIdEntityTable(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class RemoteAssetCloudIdEntityData extends i0.DataClass
    implements i0.Insertable<i1.RemoteAssetCloudIdEntityData> {
  final String assetId;
  final String? cloudId;
  const RemoteAssetCloudIdEntityData({required this.assetId, this.cloudId});
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['asset_id'] = i0.Variable<String>(assetId);
    if (!nullToAbsent || cloudId != null) {
      map['cloud_id'] = i0.Variable<String>(cloudId);
    }
    return map;
  }

  factory RemoteAssetCloudIdEntityData.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return RemoteAssetCloudIdEntityData(
      assetId: serializer.fromJson<String>(json['assetId']),
      cloudId: serializer.fromJson<String?>(json['cloudId']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'assetId': serializer.toJson<String>(assetId),
      'cloudId': serializer.toJson<String?>(cloudId),
    };
  }

  i1.RemoteAssetCloudIdEntityData copyWith({
    String? assetId,
    i0.Value<String?> cloudId = const i0.Value.absent(),
  }) => i1.RemoteAssetCloudIdEntityData(
    assetId: assetId ?? this.assetId,
    cloudId: cloudId.present ? cloudId.value : this.cloudId,
  );
  RemoteAssetCloudIdEntityData copyWithCompanion(
    i1.RemoteAssetCloudIdEntityCompanion data,
  ) {
    return RemoteAssetCloudIdEntityData(
      assetId: data.assetId.present ? data.assetId.value : this.assetId,
      cloudId: data.cloudId.present ? data.cloudId.value : this.cloudId,
    );
  }

  @override
  String toString() {
    return (StringBuffer('RemoteAssetCloudIdEntityData(')
          ..write('assetId: $assetId, ')
          ..write('cloudId: $cloudId')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(assetId, cloudId);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.RemoteAssetCloudIdEntityData &&
          other.assetId == this.assetId &&
          other.cloudId == this.cloudId);
}

class RemoteAssetCloudIdEntityCompanion
    extends i0.UpdateCompanion<i1.RemoteAssetCloudIdEntityData> {
  final i0.Value<String> assetId;
  final i0.Value<String?> cloudId;
  const RemoteAssetCloudIdEntityCompanion({
    this.assetId = const i0.Value.absent(),
    this.cloudId = const i0.Value.absent(),
  });
  RemoteAssetCloudIdEntityCompanion.insert({
    required String assetId,
    this.cloudId = const i0.Value.absent(),
  }) : assetId = i0.Value(assetId);
  static i0.Insertable<i1.RemoteAssetCloudIdEntityData> custom({
    i0.Expression<String>? assetId,
    i0.Expression<String>? cloudId,
  }) {
    return i0.RawValuesInsertable({
      if (assetId != null) 'asset_id': assetId,
      if (cloudId != null) 'cloud_id': cloudId,
    });
  }

  i1.RemoteAssetCloudIdEntityCompanion copyWith({
    i0.Value<String>? assetId,
    i0.Value<String?>? cloudId,
  }) {
    return i1.RemoteAssetCloudIdEntityCompanion(
      assetId: assetId ?? this.assetId,
      cloudId: cloudId ?? this.cloudId,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (assetId.present) {
      map['asset_id'] = i0.Variable<String>(assetId.value);
    }
    if (cloudId.present) {
      map['cloud_id'] = i0.Variable<String>(cloudId.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('RemoteAssetCloudIdEntityCompanion(')
          ..write('assetId: $assetId, ')
          ..write('cloudId: $cloudId')
          ..write(')'))
        .toString();
  }
}
