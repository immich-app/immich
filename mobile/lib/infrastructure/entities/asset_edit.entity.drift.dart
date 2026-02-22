// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/asset_edit.entity.drift.dart'
    as i1;
import 'package:immich_mobile/domain/models/asset_edit.model.dart' as i2;
import 'dart:typed_data' as i3;
import 'package:immich_mobile/infrastructure/entities/asset_edit.entity.dart'
    as i4;
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart'
    as i5;
import 'package:drift/internal/modular.dart' as i6;

typedef $$AssetEditEntityTableCreateCompanionBuilder =
    i1.AssetEditEntityCompanion Function({
      required String id,
      required String assetId,
      required i2.AssetEditAction action,
      required Map<String, Object?> parameters,
      required int sequence,
    });
typedef $$AssetEditEntityTableUpdateCompanionBuilder =
    i1.AssetEditEntityCompanion Function({
      i0.Value<String> id,
      i0.Value<String> assetId,
      i0.Value<i2.AssetEditAction> action,
      i0.Value<Map<String, Object?>> parameters,
      i0.Value<int> sequence,
    });

final class $$AssetEditEntityTableReferences
    extends
        i0.BaseReferences<
          i0.GeneratedDatabase,
          i1.$AssetEditEntityTable,
          i1.AssetEditEntityData
        > {
  $$AssetEditEntityTableReferences(
    super.$_db,
    super.$_table,
    super.$_typedResult,
  );

  static i5.$RemoteAssetEntityTable _assetIdTable(i0.GeneratedDatabase db) =>
      i6.ReadDatabaseContainer(db)
          .resultSet<i5.$RemoteAssetEntityTable>('remote_asset_entity')
          .createAlias(
            i0.$_aliasNameGenerator(
              i6.ReadDatabaseContainer(db)
                  .resultSet<i1.$AssetEditEntityTable>('asset_edit_entity')
                  .assetId,
              i6.ReadDatabaseContainer(
                db,
              ).resultSet<i5.$RemoteAssetEntityTable>('remote_asset_entity').id,
            ),
          );

  i5.$$RemoteAssetEntityTableProcessedTableManager get assetId {
    final $_column = $_itemColumn<String>('asset_id')!;

    final manager = i5
        .$$RemoteAssetEntityTableTableManager(
          $_db,
          i6.ReadDatabaseContainer(
            $_db,
          ).resultSet<i5.$RemoteAssetEntityTable>('remote_asset_entity'),
        )
        .filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_assetIdTable($_db));
    if (item == null) return manager;
    return i0.ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }
}

class $$AssetEditEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$AssetEditEntityTable> {
  $$AssetEditEntityTableFilterComposer({
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

  i0.ColumnWithTypeConverterFilters<i2.AssetEditAction, i2.AssetEditAction, int>
  get action => $composableBuilder(
    column: $table.action,
    builder: (column) => i0.ColumnWithTypeConverterFilters(column),
  );

  i0.ColumnWithTypeConverterFilters<
    Map<String, Object?>,
    Map<String, Object>,
    i3.Uint8List
  >
  get parameters => $composableBuilder(
    column: $table.parameters,
    builder: (column) => i0.ColumnWithTypeConverterFilters(column),
  );

  i0.ColumnFilters<int> get sequence => $composableBuilder(
    column: $table.sequence,
    builder: (column) => i0.ColumnFilters(column),
  );

  i5.$$RemoteAssetEntityTableFilterComposer get assetId {
    final i5.$$RemoteAssetEntityTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.assetId,
      referencedTable: i6.ReadDatabaseContainer(
        $db,
      ).resultSet<i5.$RemoteAssetEntityTable>('remote_asset_entity'),
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => i5.$$RemoteAssetEntityTableFilterComposer(
            $db: $db,
            $table: i6.ReadDatabaseContainer(
              $db,
            ).resultSet<i5.$RemoteAssetEntityTable>('remote_asset_entity'),
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$AssetEditEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$AssetEditEntityTable> {
  $$AssetEditEntityTableOrderingComposer({
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

  i0.ColumnOrderings<int> get action => $composableBuilder(
    column: $table.action,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<i3.Uint8List> get parameters => $composableBuilder(
    column: $table.parameters,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get sequence => $composableBuilder(
    column: $table.sequence,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i5.$$RemoteAssetEntityTableOrderingComposer get assetId {
    final i5.$$RemoteAssetEntityTableOrderingComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.assetId,
          referencedTable: i6.ReadDatabaseContainer(
            $db,
          ).resultSet<i5.$RemoteAssetEntityTable>('remote_asset_entity'),
          getReferencedColumn: (t) => t.id,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => i5.$$RemoteAssetEntityTableOrderingComposer(
                $db: $db,
                $table: i6.ReadDatabaseContainer(
                  $db,
                ).resultSet<i5.$RemoteAssetEntityTable>('remote_asset_entity'),
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return composer;
  }
}

class $$AssetEditEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$AssetEditEntityTable> {
  $$AssetEditEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  i0.GeneratedColumnWithTypeConverter<i2.AssetEditAction, int> get action =>
      $composableBuilder(column: $table.action, builder: (column) => column);

  i0.GeneratedColumnWithTypeConverter<Map<String, Object?>, i3.Uint8List>
  get parameters => $composableBuilder(
    column: $table.parameters,
    builder: (column) => column,
  );

  i0.GeneratedColumn<int> get sequence =>
      $composableBuilder(column: $table.sequence, builder: (column) => column);

  i5.$$RemoteAssetEntityTableAnnotationComposer get assetId {
    final i5.$$RemoteAssetEntityTableAnnotationComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.assetId,
          referencedTable: i6.ReadDatabaseContainer(
            $db,
          ).resultSet<i5.$RemoteAssetEntityTable>('remote_asset_entity'),
          getReferencedColumn: (t) => t.id,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => i5.$$RemoteAssetEntityTableAnnotationComposer(
                $db: $db,
                $table: i6.ReadDatabaseContainer(
                  $db,
                ).resultSet<i5.$RemoteAssetEntityTable>('remote_asset_entity'),
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return composer;
  }
}

class $$AssetEditEntityTableTableManager
    extends
        i0.RootTableManager<
          i0.GeneratedDatabase,
          i1.$AssetEditEntityTable,
          i1.AssetEditEntityData,
          i1.$$AssetEditEntityTableFilterComposer,
          i1.$$AssetEditEntityTableOrderingComposer,
          i1.$$AssetEditEntityTableAnnotationComposer,
          $$AssetEditEntityTableCreateCompanionBuilder,
          $$AssetEditEntityTableUpdateCompanionBuilder,
          (i1.AssetEditEntityData, i1.$$AssetEditEntityTableReferences),
          i1.AssetEditEntityData,
          i0.PrefetchHooks Function({bool assetId})
        > {
  $$AssetEditEntityTableTableManager(
    i0.GeneratedDatabase db,
    i1.$AssetEditEntityTable table,
  ) : super(
        i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$AssetEditEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              i1.$$AssetEditEntityTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () => i1
              .$$AssetEditEntityTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                i0.Value<String> id = const i0.Value.absent(),
                i0.Value<String> assetId = const i0.Value.absent(),
                i0.Value<i2.AssetEditAction> action = const i0.Value.absent(),
                i0.Value<Map<String, Object?>> parameters =
                    const i0.Value.absent(),
                i0.Value<int> sequence = const i0.Value.absent(),
              }) => i1.AssetEditEntityCompanion(
                id: id,
                assetId: assetId,
                action: action,
                parameters: parameters,
                sequence: sequence,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String assetId,
                required i2.AssetEditAction action,
                required Map<String, Object?> parameters,
                required int sequence,
              }) => i1.AssetEditEntityCompanion.insert(
                id: id,
                assetId: assetId,
                action: action,
                parameters: parameters,
                sequence: sequence,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable(table),
                  i1.$$AssetEditEntityTableReferences(db, table, e),
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
                                    .$$AssetEditEntityTableReferences
                                    ._assetIdTable(db),
                                referencedColumn: i1
                                    .$$AssetEditEntityTableReferences
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

typedef $$AssetEditEntityTableProcessedTableManager =
    i0.ProcessedTableManager<
      i0.GeneratedDatabase,
      i1.$AssetEditEntityTable,
      i1.AssetEditEntityData,
      i1.$$AssetEditEntityTableFilterComposer,
      i1.$$AssetEditEntityTableOrderingComposer,
      i1.$$AssetEditEntityTableAnnotationComposer,
      $$AssetEditEntityTableCreateCompanionBuilder,
      $$AssetEditEntityTableUpdateCompanionBuilder,
      (i1.AssetEditEntityData, i1.$$AssetEditEntityTableReferences),
      i1.AssetEditEntityData,
      i0.PrefetchHooks Function({bool assetId})
    >;
i0.Index get idxAssetEditAssetId => i0.Index(
  'idx_asset_edit_asset_id',
  'CREATE INDEX IF NOT EXISTS idx_asset_edit_asset_id ON asset_edit_entity (asset_id)',
);

class $AssetEditEntityTable extends i4.AssetEditEntity
    with i0.TableInfo<$AssetEditEntityTable, i1.AssetEditEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $AssetEditEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _idMeta = const i0.VerificationMeta('id');
  @override
  late final i0.GeneratedColumn<String> id = i0.GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
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
    defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
      'REFERENCES remote_asset_entity (id) ON DELETE CASCADE',
    ),
  );
  @override
  late final i0.GeneratedColumnWithTypeConverter<i2.AssetEditAction, int>
  action =
      i0.GeneratedColumn<int>(
        'action',
        aliasedName,
        false,
        type: i0.DriftSqlType.int,
        requiredDuringInsert: true,
      ).withConverter<i2.AssetEditAction>(
        i1.$AssetEditEntityTable.$converteraction,
      );
  @override
  late final i0.GeneratedColumnWithTypeConverter<
    Map<String, Object?>,
    i3.Uint8List
  >
  parameters =
      i0.GeneratedColumn<i3.Uint8List>(
        'parameters',
        aliasedName,
        false,
        type: i0.DriftSqlType.blob,
        requiredDuringInsert: true,
      ).withConverter<Map<String, Object?>>(
        i1.$AssetEditEntityTable.$converterparameters,
      );
  static const i0.VerificationMeta _sequenceMeta = const i0.VerificationMeta(
    'sequence',
  );
  @override
  late final i0.GeneratedColumn<int> sequence = i0.GeneratedColumn<int>(
    'sequence',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: true,
  );
  @override
  List<i0.GeneratedColumn> get $columns => [
    id,
    assetId,
    action,
    parameters,
    sequence,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'asset_edit_entity';
  @override
  i0.VerificationContext validateIntegrity(
    i0.Insertable<i1.AssetEditEntityData> instance, {
    bool isInserting = false,
  }) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('asset_id')) {
      context.handle(
        _assetIdMeta,
        assetId.isAcceptableOrUnknown(data['asset_id']!, _assetIdMeta),
      );
    } else if (isInserting) {
      context.missing(_assetIdMeta);
    }
    if (data.containsKey('sequence')) {
      context.handle(
        _sequenceMeta,
        sequence.isAcceptableOrUnknown(data['sequence']!, _sequenceMeta),
      );
    } else if (isInserting) {
      context.missing(_sequenceMeta);
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {id};
  @override
  i1.AssetEditEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.AssetEditEntityData(
      id: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      assetId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}asset_id'],
      )!,
      action: i1.$AssetEditEntityTable.$converteraction.fromSql(
        attachedDatabase.typeMapping.read(
          i0.DriftSqlType.int,
          data['${effectivePrefix}action'],
        )!,
      ),
      parameters: i1.$AssetEditEntityTable.$converterparameters.fromSql(
        attachedDatabase.typeMapping.read(
          i0.DriftSqlType.blob,
          data['${effectivePrefix}parameters'],
        )!,
      ),
      sequence: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}sequence'],
      )!,
    );
  }

  @override
  $AssetEditEntityTable createAlias(String alias) {
    return $AssetEditEntityTable(attachedDatabase, alias);
  }

  static i0.JsonTypeConverter2<i2.AssetEditAction, int, int> $converteraction =
      const i0.EnumIndexConverter<i2.AssetEditAction>(
        i2.AssetEditAction.values,
      );
  static i0.JsonTypeConverter2<Map<String, Object?>, i3.Uint8List, Object?>
  $converterparameters = i4.editParameterConverter;
  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class AssetEditEntityData extends i0.DataClass
    implements i0.Insertable<i1.AssetEditEntityData> {
  final String id;
  final String assetId;
  final i2.AssetEditAction action;
  final Map<String, Object?> parameters;
  final int sequence;
  const AssetEditEntityData({
    required this.id,
    required this.assetId,
    required this.action,
    required this.parameters,
    required this.sequence,
  });
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['id'] = i0.Variable<String>(id);
    map['asset_id'] = i0.Variable<String>(assetId);
    {
      map['action'] = i0.Variable<int>(
        i1.$AssetEditEntityTable.$converteraction.toSql(action),
      );
    }
    {
      map['parameters'] = i0.Variable<i3.Uint8List>(
        i1.$AssetEditEntityTable.$converterparameters.toSql(parameters),
      );
    }
    map['sequence'] = i0.Variable<int>(sequence);
    return map;
  }

  factory AssetEditEntityData.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return AssetEditEntityData(
      id: serializer.fromJson<String>(json['id']),
      assetId: serializer.fromJson<String>(json['assetId']),
      action: i1.$AssetEditEntityTable.$converteraction.fromJson(
        serializer.fromJson<int>(json['action']),
      ),
      parameters: i1.$AssetEditEntityTable.$converterparameters.fromJson(
        serializer.fromJson<Object?>(json['parameters']),
      ),
      sequence: serializer.fromJson<int>(json['sequence']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'assetId': serializer.toJson<String>(assetId),
      'action': serializer.toJson<int>(
        i1.$AssetEditEntityTable.$converteraction.toJson(action),
      ),
      'parameters': serializer.toJson<Object?>(
        i1.$AssetEditEntityTable.$converterparameters.toJson(parameters),
      ),
      'sequence': serializer.toJson<int>(sequence),
    };
  }

  i1.AssetEditEntityData copyWith({
    String? id,
    String? assetId,
    i2.AssetEditAction? action,
    Map<String, Object?>? parameters,
    int? sequence,
  }) => i1.AssetEditEntityData(
    id: id ?? this.id,
    assetId: assetId ?? this.assetId,
    action: action ?? this.action,
    parameters: parameters ?? this.parameters,
    sequence: sequence ?? this.sequence,
  );
  AssetEditEntityData copyWithCompanion(i1.AssetEditEntityCompanion data) {
    return AssetEditEntityData(
      id: data.id.present ? data.id.value : this.id,
      assetId: data.assetId.present ? data.assetId.value : this.assetId,
      action: data.action.present ? data.action.value : this.action,
      parameters: data.parameters.present
          ? data.parameters.value
          : this.parameters,
      sequence: data.sequence.present ? data.sequence.value : this.sequence,
    );
  }

  @override
  String toString() {
    return (StringBuffer('AssetEditEntityData(')
          ..write('id: $id, ')
          ..write('assetId: $assetId, ')
          ..write('action: $action, ')
          ..write('parameters: $parameters, ')
          ..write('sequence: $sequence')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, assetId, action, parameters, sequence);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.AssetEditEntityData &&
          other.id == this.id &&
          other.assetId == this.assetId &&
          other.action == this.action &&
          other.parameters == this.parameters &&
          other.sequence == this.sequence);
}

class AssetEditEntityCompanion
    extends i0.UpdateCompanion<i1.AssetEditEntityData> {
  final i0.Value<String> id;
  final i0.Value<String> assetId;
  final i0.Value<i2.AssetEditAction> action;
  final i0.Value<Map<String, Object?>> parameters;
  final i0.Value<int> sequence;
  const AssetEditEntityCompanion({
    this.id = const i0.Value.absent(),
    this.assetId = const i0.Value.absent(),
    this.action = const i0.Value.absent(),
    this.parameters = const i0.Value.absent(),
    this.sequence = const i0.Value.absent(),
  });
  AssetEditEntityCompanion.insert({
    required String id,
    required String assetId,
    required i2.AssetEditAction action,
    required Map<String, Object?> parameters,
    required int sequence,
  }) : id = i0.Value(id),
       assetId = i0.Value(assetId),
       action = i0.Value(action),
       parameters = i0.Value(parameters),
       sequence = i0.Value(sequence);
  static i0.Insertable<i1.AssetEditEntityData> custom({
    i0.Expression<String>? id,
    i0.Expression<String>? assetId,
    i0.Expression<int>? action,
    i0.Expression<i3.Uint8List>? parameters,
    i0.Expression<int>? sequence,
  }) {
    return i0.RawValuesInsertable({
      if (id != null) 'id': id,
      if (assetId != null) 'asset_id': assetId,
      if (action != null) 'action': action,
      if (parameters != null) 'parameters': parameters,
      if (sequence != null) 'sequence': sequence,
    });
  }

  i1.AssetEditEntityCompanion copyWith({
    i0.Value<String>? id,
    i0.Value<String>? assetId,
    i0.Value<i2.AssetEditAction>? action,
    i0.Value<Map<String, Object?>>? parameters,
    i0.Value<int>? sequence,
  }) {
    return i1.AssetEditEntityCompanion(
      id: id ?? this.id,
      assetId: assetId ?? this.assetId,
      action: action ?? this.action,
      parameters: parameters ?? this.parameters,
      sequence: sequence ?? this.sequence,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (id.present) {
      map['id'] = i0.Variable<String>(id.value);
    }
    if (assetId.present) {
      map['asset_id'] = i0.Variable<String>(assetId.value);
    }
    if (action.present) {
      map['action'] = i0.Variable<int>(
        i1.$AssetEditEntityTable.$converteraction.toSql(action.value),
      );
    }
    if (parameters.present) {
      map['parameters'] = i0.Variable<i3.Uint8List>(
        i1.$AssetEditEntityTable.$converterparameters.toSql(parameters.value),
      );
    }
    if (sequence.present) {
      map['sequence'] = i0.Variable<int>(sequence.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('AssetEditEntityCompanion(')
          ..write('id: $id, ')
          ..write('assetId: $assetId, ')
          ..write('action: $action, ')
          ..write('parameters: $parameters, ')
          ..write('sequence: $sequence')
          ..write(')'))
        .toString();
  }
}
