// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/local_trashed_asset.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/local_trashed_asset.entity.dart'
    as i2;
import 'package:drift/src/runtime/query_builder/query_builder.dart' as i3;
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart'
    as i4;
import 'package:drift/internal/modular.dart' as i5;

typedef $$LocalTrashedAssetEntityTableCreateCompanionBuilder =
    i1.LocalTrashedAssetEntityCompanion Function({
      required String id,
      required String remoteId,
      i0.Value<DateTime> createdAt,
    });
typedef $$LocalTrashedAssetEntityTableUpdateCompanionBuilder =
    i1.LocalTrashedAssetEntityCompanion Function({
      i0.Value<String> id,
      i0.Value<String> remoteId,
      i0.Value<DateTime> createdAt,
    });

final class $$LocalTrashedAssetEntityTableReferences
    extends
        i0.BaseReferences<
          i0.GeneratedDatabase,
          i1.$LocalTrashedAssetEntityTable,
          i1.LocalTrashedAssetEntityData
        > {
  $$LocalTrashedAssetEntityTableReferences(
    super.$_db,
    super.$_table,
    super.$_typedResult,
  );

  static i4.$RemoteAssetEntityTable _remoteIdTable(i0.GeneratedDatabase db) =>
      i5.ReadDatabaseContainer(db)
          .resultSet<i4.$RemoteAssetEntityTable>('remote_asset_entity')
          .createAlias(
            i0.$_aliasNameGenerator(
              i5.ReadDatabaseContainer(db)
                  .resultSet<i1.$LocalTrashedAssetEntityTable>(
                    'local_trashed_asset_entity',
                  )
                  .remoteId,
              i5.ReadDatabaseContainer(
                db,
              ).resultSet<i4.$RemoteAssetEntityTable>('remote_asset_entity').id,
            ),
          );

  i4.$$RemoteAssetEntityTableProcessedTableManager get remoteId {
    final $_column = $_itemColumn<String>('remote_id')!;

    final manager = i4
        .$$RemoteAssetEntityTableTableManager(
          $_db,
          i5.ReadDatabaseContainer(
            $_db,
          ).resultSet<i4.$RemoteAssetEntityTable>('remote_asset_entity'),
        )
        .filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_remoteIdTable($_db));
    if (item == null) return manager;
    return i0.ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }
}

class $$LocalTrashedAssetEntityTableFilterComposer
    extends
        i0.Composer<i0.GeneratedDatabase, i1.$LocalTrashedAssetEntityTable> {
  $$LocalTrashedAssetEntityTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => i0.ColumnFilters(column),
  );

  i4.$$RemoteAssetEntityTableFilterComposer get remoteId {
    final i4.$$RemoteAssetEntityTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.remoteId,
      referencedTable: i5.ReadDatabaseContainer(
        $db,
      ).resultSet<i4.$RemoteAssetEntityTable>('remote_asset_entity'),
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => i4.$$RemoteAssetEntityTableFilterComposer(
            $db: $db,
            $table: i5.ReadDatabaseContainer(
              $db,
            ).resultSet<i4.$RemoteAssetEntityTable>('remote_asset_entity'),
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$LocalTrashedAssetEntityTableOrderingComposer
    extends
        i0.Composer<i0.GeneratedDatabase, i1.$LocalTrashedAssetEntityTable> {
  $$LocalTrashedAssetEntityTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i4.$$RemoteAssetEntityTableOrderingComposer get remoteId {
    final i4.$$RemoteAssetEntityTableOrderingComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.remoteId,
          referencedTable: i5.ReadDatabaseContainer(
            $db,
          ).resultSet<i4.$RemoteAssetEntityTable>('remote_asset_entity'),
          getReferencedColumn: (t) => t.id,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => i4.$$RemoteAssetEntityTableOrderingComposer(
                $db: $db,
                $table: i5.ReadDatabaseContainer(
                  $db,
                ).resultSet<i4.$RemoteAssetEntityTable>('remote_asset_entity'),
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return composer;
  }
}

class $$LocalTrashedAssetEntityTableAnnotationComposer
    extends
        i0.Composer<i0.GeneratedDatabase, i1.$LocalTrashedAssetEntityTable> {
  $$LocalTrashedAssetEntityTableAnnotationComposer({
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

  i4.$$RemoteAssetEntityTableAnnotationComposer get remoteId {
    final i4.$$RemoteAssetEntityTableAnnotationComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.remoteId,
          referencedTable: i5.ReadDatabaseContainer(
            $db,
          ).resultSet<i4.$RemoteAssetEntityTable>('remote_asset_entity'),
          getReferencedColumn: (t) => t.id,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => i4.$$RemoteAssetEntityTableAnnotationComposer(
                $db: $db,
                $table: i5.ReadDatabaseContainer(
                  $db,
                ).resultSet<i4.$RemoteAssetEntityTable>('remote_asset_entity'),
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return composer;
  }
}

class $$LocalTrashedAssetEntityTableTableManager
    extends
        i0.RootTableManager<
          i0.GeneratedDatabase,
          i1.$LocalTrashedAssetEntityTable,
          i1.LocalTrashedAssetEntityData,
          i1.$$LocalTrashedAssetEntityTableFilterComposer,
          i1.$$LocalTrashedAssetEntityTableOrderingComposer,
          i1.$$LocalTrashedAssetEntityTableAnnotationComposer,
          $$LocalTrashedAssetEntityTableCreateCompanionBuilder,
          $$LocalTrashedAssetEntityTableUpdateCompanionBuilder,
          (
            i1.LocalTrashedAssetEntityData,
            i1.$$LocalTrashedAssetEntityTableReferences,
          ),
          i1.LocalTrashedAssetEntityData,
          i0.PrefetchHooks Function({bool remoteId})
        > {
  $$LocalTrashedAssetEntityTableTableManager(
    i0.GeneratedDatabase db,
    i1.$LocalTrashedAssetEntityTable table,
  ) : super(
        i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$LocalTrashedAssetEntityTableFilterComposer(
                $db: db,
                $table: table,
              ),
          createOrderingComposer: () =>
              i1.$$LocalTrashedAssetEntityTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              i1.$$LocalTrashedAssetEntityTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                i0.Value<String> id = const i0.Value.absent(),
                i0.Value<String> remoteId = const i0.Value.absent(),
                i0.Value<DateTime> createdAt = const i0.Value.absent(),
              }) => i1.LocalTrashedAssetEntityCompanion(
                id: id,
                remoteId: remoteId,
                createdAt: createdAt,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String remoteId,
                i0.Value<DateTime> createdAt = const i0.Value.absent(),
              }) => i1.LocalTrashedAssetEntityCompanion.insert(
                id: id,
                remoteId: remoteId,
                createdAt: createdAt,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable(table),
                  i1.$$LocalTrashedAssetEntityTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: ({remoteId = false}) {
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
                    if (remoteId) {
                      state =
                          state.withJoin(
                                currentTable: table,
                                currentColumn: table.remoteId,
                                referencedTable: i1
                                    .$$LocalTrashedAssetEntityTableReferences
                                    ._remoteIdTable(db),
                                referencedColumn: i1
                                    .$$LocalTrashedAssetEntityTableReferences
                                    ._remoteIdTable(db)
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

typedef $$LocalTrashedAssetEntityTableProcessedTableManager =
    i0.ProcessedTableManager<
      i0.GeneratedDatabase,
      i1.$LocalTrashedAssetEntityTable,
      i1.LocalTrashedAssetEntityData,
      i1.$$LocalTrashedAssetEntityTableFilterComposer,
      i1.$$LocalTrashedAssetEntityTableOrderingComposer,
      i1.$$LocalTrashedAssetEntityTableAnnotationComposer,
      $$LocalTrashedAssetEntityTableCreateCompanionBuilder,
      $$LocalTrashedAssetEntityTableUpdateCompanionBuilder,
      (
        i1.LocalTrashedAssetEntityData,
        i1.$$LocalTrashedAssetEntityTableReferences,
      ),
      i1.LocalTrashedAssetEntityData,
      i0.PrefetchHooks Function({bool remoteId})
    >;
i0.Index get idxLocalTrashedAssetRemoteId => i0.Index(
  'idx_local_trashed_asset_remote_id',
  'CREATE INDEX IF NOT EXISTS idx_local_trashed_asset_remote_id ON local_trashed_asset_entity (remote_id)',
);

class $LocalTrashedAssetEntityTable extends i2.LocalTrashedAssetEntity
    with
        i0.TableInfo<
          $LocalTrashedAssetEntityTable,
          i1.LocalTrashedAssetEntityData
        > {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalTrashedAssetEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _idMeta = const i0.VerificationMeta('id');
  @override
  late final i0.GeneratedColumn<String> id = i0.GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _remoteIdMeta = const i0.VerificationMeta(
    'remoteId',
  );
  @override
  late final i0.GeneratedColumn<String> remoteId = i0.GeneratedColumn<String>(
    'remote_id',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
      'REFERENCES remote_asset_entity (id) ON DELETE CASCADE',
    ),
  );
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
        requiredDuringInsert: false,
        defaultValue: i3.currentDateAndTime,
      );
  @override
  List<i0.GeneratedColumn> get $columns => [id, remoteId, createdAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_trashed_asset_entity';
  @override
  i0.VerificationContext validateIntegrity(
    i0.Insertable<i1.LocalTrashedAssetEntityData> instance, {
    bool isInserting = false,
  }) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('remote_id')) {
      context.handle(
        _remoteIdMeta,
        remoteId.isAcceptableOrUnknown(data['remote_id']!, _remoteIdMeta),
      );
    } else if (isInserting) {
      context.missing(_remoteIdMeta);
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {id};
  @override
  i1.LocalTrashedAssetEntityData map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.LocalTrashedAssetEntityData(
      id: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      remoteId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}remote_id'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
    );
  }

  @override
  $LocalTrashedAssetEntityTable createAlias(String alias) {
    return $LocalTrashedAssetEntityTable(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class LocalTrashedAssetEntityData extends i0.DataClass
    implements i0.Insertable<i1.LocalTrashedAssetEntityData> {
  final String id;
  final String remoteId;
  final DateTime createdAt;
  const LocalTrashedAssetEntityData({
    required this.id,
    required this.remoteId,
    required this.createdAt,
  });
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['id'] = i0.Variable<String>(id);
    map['remote_id'] = i0.Variable<String>(remoteId);
    map['created_at'] = i0.Variable<DateTime>(createdAt);
    return map;
  }

  factory LocalTrashedAssetEntityData.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return LocalTrashedAssetEntityData(
      id: serializer.fromJson<String>(json['id']),
      remoteId: serializer.fromJson<String>(json['remoteId']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'remoteId': serializer.toJson<String>(remoteId),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  i1.LocalTrashedAssetEntityData copyWith({
    String? id,
    String? remoteId,
    DateTime? createdAt,
  }) => i1.LocalTrashedAssetEntityData(
    id: id ?? this.id,
    remoteId: remoteId ?? this.remoteId,
    createdAt: createdAt ?? this.createdAt,
  );
  LocalTrashedAssetEntityData copyWithCompanion(
    i1.LocalTrashedAssetEntityCompanion data,
  ) {
    return LocalTrashedAssetEntityData(
      id: data.id.present ? data.id.value : this.id,
      remoteId: data.remoteId.present ? data.remoteId.value : this.remoteId,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalTrashedAssetEntityData(')
          ..write('id: $id, ')
          ..write('remoteId: $remoteId, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, remoteId, createdAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.LocalTrashedAssetEntityData &&
          other.id == this.id &&
          other.remoteId == this.remoteId &&
          other.createdAt == this.createdAt);
}

class LocalTrashedAssetEntityCompanion
    extends i0.UpdateCompanion<i1.LocalTrashedAssetEntityData> {
  final i0.Value<String> id;
  final i0.Value<String> remoteId;
  final i0.Value<DateTime> createdAt;
  const LocalTrashedAssetEntityCompanion({
    this.id = const i0.Value.absent(),
    this.remoteId = const i0.Value.absent(),
    this.createdAt = const i0.Value.absent(),
  });
  LocalTrashedAssetEntityCompanion.insert({
    required String id,
    required String remoteId,
    this.createdAt = const i0.Value.absent(),
  }) : id = i0.Value(id),
       remoteId = i0.Value(remoteId);
  static i0.Insertable<i1.LocalTrashedAssetEntityData> custom({
    i0.Expression<String>? id,
    i0.Expression<String>? remoteId,
    i0.Expression<DateTime>? createdAt,
  }) {
    return i0.RawValuesInsertable({
      if (id != null) 'id': id,
      if (remoteId != null) 'remote_id': remoteId,
      if (createdAt != null) 'created_at': createdAt,
    });
  }

  i1.LocalTrashedAssetEntityCompanion copyWith({
    i0.Value<String>? id,
    i0.Value<String>? remoteId,
    i0.Value<DateTime>? createdAt,
  }) {
    return i1.LocalTrashedAssetEntityCompanion(
      id: id ?? this.id,
      remoteId: remoteId ?? this.remoteId,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (id.present) {
      map['id'] = i0.Variable<String>(id.value);
    }
    if (remoteId.present) {
      map['remote_id'] = i0.Variable<String>(remoteId.value);
    }
    if (createdAt.present) {
      map['created_at'] = i0.Variable<DateTime>(createdAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalTrashedAssetEntityCompanion(')
          ..write('id: $id, ')
          ..write('remoteId: $remoteId, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }
}
