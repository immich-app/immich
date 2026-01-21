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
      i0.Value<DateTime?> createdAt,
      i0.Value<DateTime?> adjustmentTime,
      i0.Value<double?> latitude,
      i0.Value<double?> longitude,
    });
typedef $$RemoteAssetCloudIdEntityTableUpdateCompanionBuilder =
    i1.RemoteAssetCloudIdEntityCompanion Function({
      i0.Value<String> assetId,
      i0.Value<String?> cloudId,
      i0.Value<DateTime?> createdAt,
      i0.Value<DateTime?> adjustmentTime,
      i0.Value<double?> latitude,
      i0.Value<double?> longitude,
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

  i0.ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<DateTime> get adjustmentTime => $composableBuilder(
    column: $table.adjustmentTime,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<double> get latitude => $composableBuilder(
    column: $table.latitude,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<double> get longitude => $composableBuilder(
    column: $table.longitude,
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

  i0.ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<DateTime> get adjustmentTime => $composableBuilder(
    column: $table.adjustmentTime,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<double> get latitude => $composableBuilder(
    column: $table.latitude,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<double> get longitude => $composableBuilder(
    column: $table.longitude,
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

  i0.GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get adjustmentTime => $composableBuilder(
    column: $table.adjustmentTime,
    builder: (column) => column,
  );

  i0.GeneratedColumn<double> get latitude =>
      $composableBuilder(column: $table.latitude, builder: (column) => column);

  i0.GeneratedColumn<double> get longitude =>
      $composableBuilder(column: $table.longitude, builder: (column) => column);

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
                i0.Value<DateTime?> createdAt = const i0.Value.absent(),
                i0.Value<DateTime?> adjustmentTime = const i0.Value.absent(),
                i0.Value<double?> latitude = const i0.Value.absent(),
                i0.Value<double?> longitude = const i0.Value.absent(),
              }) => i1.RemoteAssetCloudIdEntityCompanion(
                assetId: assetId,
                cloudId: cloudId,
                createdAt: createdAt,
                adjustmentTime: adjustmentTime,
                latitude: latitude,
                longitude: longitude,
              ),
          createCompanionCallback:
              ({
                required String assetId,
                i0.Value<String?> cloudId = const i0.Value.absent(),
                i0.Value<DateTime?> createdAt = const i0.Value.absent(),
                i0.Value<DateTime?> adjustmentTime = const i0.Value.absent(),
                i0.Value<double?> latitude = const i0.Value.absent(),
                i0.Value<double?> longitude = const i0.Value.absent(),
              }) => i1.RemoteAssetCloudIdEntityCompanion.insert(
                assetId: assetId,
                cloudId: cloudId,
                createdAt: createdAt,
                adjustmentTime: adjustmentTime,
                latitude: latitude,
                longitude: longitude,
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
  );
  static const i0.VerificationMeta _createdAtMeta = const i0.VerificationMeta(
    'createdAt',
  );
  @override
  late final i0.GeneratedColumn<DateTime> createdAt =
      i0.GeneratedColumn<DateTime>(
        'created_at',
        aliasedName,
        true,
        type: i0.DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  static const i0.VerificationMeta _adjustmentTimeMeta =
      const i0.VerificationMeta('adjustmentTime');
  @override
  late final i0.GeneratedColumn<DateTime> adjustmentTime =
      i0.GeneratedColumn<DateTime>(
        'adjustment_time',
        aliasedName,
        true,
        type: i0.DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  static const i0.VerificationMeta _latitudeMeta = const i0.VerificationMeta(
    'latitude',
  );
  @override
  late final i0.GeneratedColumn<double> latitude = i0.GeneratedColumn<double>(
    'latitude',
    aliasedName,
    true,
    type: i0.DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const i0.VerificationMeta _longitudeMeta = const i0.VerificationMeta(
    'longitude',
  );
  @override
  late final i0.GeneratedColumn<double> longitude = i0.GeneratedColumn<double>(
    'longitude',
    aliasedName,
    true,
    type: i0.DriftSqlType.double,
    requiredDuringInsert: false,
  );
  @override
  List<i0.GeneratedColumn> get $columns => [
    assetId,
    cloudId,
    createdAt,
    adjustmentTime,
    latitude,
    longitude,
  ];
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
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    }
    if (data.containsKey('adjustment_time')) {
      context.handle(
        _adjustmentTimeMeta,
        adjustmentTime.isAcceptableOrUnknown(
          data['adjustment_time']!,
          _adjustmentTimeMeta,
        ),
      );
    }
    if (data.containsKey('latitude')) {
      context.handle(
        _latitudeMeta,
        latitude.isAcceptableOrUnknown(data['latitude']!, _latitudeMeta),
      );
    }
    if (data.containsKey('longitude')) {
      context.handle(
        _longitudeMeta,
        longitude.isAcceptableOrUnknown(data['longitude']!, _longitudeMeta),
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
      createdAt: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      ),
      adjustmentTime: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.dateTime,
        data['${effectivePrefix}adjustment_time'],
      ),
      latitude: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.double,
        data['${effectivePrefix}latitude'],
      ),
      longitude: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.double,
        data['${effectivePrefix}longitude'],
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
  final DateTime? createdAt;
  final DateTime? adjustmentTime;
  final double? latitude;
  final double? longitude;
  const RemoteAssetCloudIdEntityData({
    required this.assetId,
    this.cloudId,
    this.createdAt,
    this.adjustmentTime,
    this.latitude,
    this.longitude,
  });
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['asset_id'] = i0.Variable<String>(assetId);
    if (!nullToAbsent || cloudId != null) {
      map['cloud_id'] = i0.Variable<String>(cloudId);
    }
    if (!nullToAbsent || createdAt != null) {
      map['created_at'] = i0.Variable<DateTime>(createdAt);
    }
    if (!nullToAbsent || adjustmentTime != null) {
      map['adjustment_time'] = i0.Variable<DateTime>(adjustmentTime);
    }
    if (!nullToAbsent || latitude != null) {
      map['latitude'] = i0.Variable<double>(latitude);
    }
    if (!nullToAbsent || longitude != null) {
      map['longitude'] = i0.Variable<double>(longitude);
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
      createdAt: serializer.fromJson<DateTime?>(json['createdAt']),
      adjustmentTime: serializer.fromJson<DateTime?>(json['adjustmentTime']),
      latitude: serializer.fromJson<double?>(json['latitude']),
      longitude: serializer.fromJson<double?>(json['longitude']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'assetId': serializer.toJson<String>(assetId),
      'cloudId': serializer.toJson<String?>(cloudId),
      'createdAt': serializer.toJson<DateTime?>(createdAt),
      'adjustmentTime': serializer.toJson<DateTime?>(adjustmentTime),
      'latitude': serializer.toJson<double?>(latitude),
      'longitude': serializer.toJson<double?>(longitude),
    };
  }

  i1.RemoteAssetCloudIdEntityData copyWith({
    String? assetId,
    i0.Value<String?> cloudId = const i0.Value.absent(),
    i0.Value<DateTime?> createdAt = const i0.Value.absent(),
    i0.Value<DateTime?> adjustmentTime = const i0.Value.absent(),
    i0.Value<double?> latitude = const i0.Value.absent(),
    i0.Value<double?> longitude = const i0.Value.absent(),
  }) => i1.RemoteAssetCloudIdEntityData(
    assetId: assetId ?? this.assetId,
    cloudId: cloudId.present ? cloudId.value : this.cloudId,
    createdAt: createdAt.present ? createdAt.value : this.createdAt,
    adjustmentTime: adjustmentTime.present
        ? adjustmentTime.value
        : this.adjustmentTime,
    latitude: latitude.present ? latitude.value : this.latitude,
    longitude: longitude.present ? longitude.value : this.longitude,
  );
  RemoteAssetCloudIdEntityData copyWithCompanion(
    i1.RemoteAssetCloudIdEntityCompanion data,
  ) {
    return RemoteAssetCloudIdEntityData(
      assetId: data.assetId.present ? data.assetId.value : this.assetId,
      cloudId: data.cloudId.present ? data.cloudId.value : this.cloudId,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      adjustmentTime: data.adjustmentTime.present
          ? data.adjustmentTime.value
          : this.adjustmentTime,
      latitude: data.latitude.present ? data.latitude.value : this.latitude,
      longitude: data.longitude.present ? data.longitude.value : this.longitude,
    );
  }

  @override
  String toString() {
    return (StringBuffer('RemoteAssetCloudIdEntityData(')
          ..write('assetId: $assetId, ')
          ..write('cloudId: $cloudId, ')
          ..write('createdAt: $createdAt, ')
          ..write('adjustmentTime: $adjustmentTime, ')
          ..write('latitude: $latitude, ')
          ..write('longitude: $longitude')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    assetId,
    cloudId,
    createdAt,
    adjustmentTime,
    latitude,
    longitude,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.RemoteAssetCloudIdEntityData &&
          other.assetId == this.assetId &&
          other.cloudId == this.cloudId &&
          other.createdAt == this.createdAt &&
          other.adjustmentTime == this.adjustmentTime &&
          other.latitude == this.latitude &&
          other.longitude == this.longitude);
}

class RemoteAssetCloudIdEntityCompanion
    extends i0.UpdateCompanion<i1.RemoteAssetCloudIdEntityData> {
  final i0.Value<String> assetId;
  final i0.Value<String?> cloudId;
  final i0.Value<DateTime?> createdAt;
  final i0.Value<DateTime?> adjustmentTime;
  final i0.Value<double?> latitude;
  final i0.Value<double?> longitude;
  const RemoteAssetCloudIdEntityCompanion({
    this.assetId = const i0.Value.absent(),
    this.cloudId = const i0.Value.absent(),
    this.createdAt = const i0.Value.absent(),
    this.adjustmentTime = const i0.Value.absent(),
    this.latitude = const i0.Value.absent(),
    this.longitude = const i0.Value.absent(),
  });
  RemoteAssetCloudIdEntityCompanion.insert({
    required String assetId,
    this.cloudId = const i0.Value.absent(),
    this.createdAt = const i0.Value.absent(),
    this.adjustmentTime = const i0.Value.absent(),
    this.latitude = const i0.Value.absent(),
    this.longitude = const i0.Value.absent(),
  }) : assetId = i0.Value(assetId);
  static i0.Insertable<i1.RemoteAssetCloudIdEntityData> custom({
    i0.Expression<String>? assetId,
    i0.Expression<String>? cloudId,
    i0.Expression<DateTime>? createdAt,
    i0.Expression<DateTime>? adjustmentTime,
    i0.Expression<double>? latitude,
    i0.Expression<double>? longitude,
  }) {
    return i0.RawValuesInsertable({
      if (assetId != null) 'asset_id': assetId,
      if (cloudId != null) 'cloud_id': cloudId,
      if (createdAt != null) 'created_at': createdAt,
      if (adjustmentTime != null) 'adjustment_time': adjustmentTime,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
    });
  }

  i1.RemoteAssetCloudIdEntityCompanion copyWith({
    i0.Value<String>? assetId,
    i0.Value<String?>? cloudId,
    i0.Value<DateTime?>? createdAt,
    i0.Value<DateTime?>? adjustmentTime,
    i0.Value<double?>? latitude,
    i0.Value<double?>? longitude,
  }) {
    return i1.RemoteAssetCloudIdEntityCompanion(
      assetId: assetId ?? this.assetId,
      cloudId: cloudId ?? this.cloudId,
      createdAt: createdAt ?? this.createdAt,
      adjustmentTime: adjustmentTime ?? this.adjustmentTime,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
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
    if (createdAt.present) {
      map['created_at'] = i0.Variable<DateTime>(createdAt.value);
    }
    if (adjustmentTime.present) {
      map['adjustment_time'] = i0.Variable<DateTime>(adjustmentTime.value);
    }
    if (latitude.present) {
      map['latitude'] = i0.Variable<double>(latitude.value);
    }
    if (longitude.present) {
      map['longitude'] = i0.Variable<double>(longitude.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('RemoteAssetCloudIdEntityCompanion(')
          ..write('assetId: $assetId, ')
          ..write('cloudId: $cloudId, ')
          ..write('createdAt: $createdAt, ')
          ..write('adjustmentTime: $adjustmentTime, ')
          ..write('latitude: $latitude, ')
          ..write('longitude: $longitude')
          ..write(')'))
        .toString();
  }
}
