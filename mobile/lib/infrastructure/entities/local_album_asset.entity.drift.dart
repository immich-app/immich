// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/local_album_asset.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/local_album_asset.entity.dart'
    as i2;
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart'
    as i3;
import 'package:drift/internal/modular.dart' as i4;
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart'
    as i5;

typedef $$LocalAlbumAssetEntityTableCreateCompanionBuilder
    = i1.LocalAlbumAssetEntityCompanion Function({
  required String assetId,
  required String albumId,
});
typedef $$LocalAlbumAssetEntityTableUpdateCompanionBuilder
    = i1.LocalAlbumAssetEntityCompanion Function({
  i0.Value<String> assetId,
  i0.Value<String> albumId,
});

final class $$LocalAlbumAssetEntityTableReferences extends i0.BaseReferences<
    i0.GeneratedDatabase,
    i1.$LocalAlbumAssetEntityTable,
    i1.LocalAlbumAssetEntityData> {
  $$LocalAlbumAssetEntityTableReferences(
      super.$_db, super.$_table, super.$_typedResult);

  static i3.$LocalAssetEntityTable _assetIdTable(i0.GeneratedDatabase db) =>
      i4.ReadDatabaseContainer(db)
          .resultSet<i3.$LocalAssetEntityTable>('local_asset_entity')
          .createAlias(i0.$_aliasNameGenerator(
              i4.ReadDatabaseContainer(db)
                  .resultSet<i1.$LocalAlbumAssetEntityTable>(
                      'local_album_asset_entity')
                  .assetId,
              i4.ReadDatabaseContainer(db)
                  .resultSet<i3.$LocalAssetEntityTable>('local_asset_entity')
                  .id));

  i3.$$LocalAssetEntityTableProcessedTableManager get assetId {
    final $_column = $_itemColumn<String>('asset_id')!;

    final manager = i3
        .$$LocalAssetEntityTableTableManager(
            $_db,
            i4.ReadDatabaseContainer($_db)
                .resultSet<i3.$LocalAssetEntityTable>('local_asset_entity'))
        .filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_assetIdTable($_db));
    if (item == null) return manager;
    return i0.ProcessedTableManager(
        manager.$state.copyWith(prefetchedData: [item]));
  }

  static i5.$LocalAlbumEntityTable _albumIdTable(i0.GeneratedDatabase db) =>
      i4.ReadDatabaseContainer(db)
          .resultSet<i5.$LocalAlbumEntityTable>('local_album_entity')
          .createAlias(i0.$_aliasNameGenerator(
              i4.ReadDatabaseContainer(db)
                  .resultSet<i1.$LocalAlbumAssetEntityTable>(
                      'local_album_asset_entity')
                  .albumId,
              i4.ReadDatabaseContainer(db)
                  .resultSet<i5.$LocalAlbumEntityTable>('local_album_entity')
                  .id));

  i5.$$LocalAlbumEntityTableProcessedTableManager get albumId {
    final $_column = $_itemColumn<String>('album_id')!;

    final manager = i5
        .$$LocalAlbumEntityTableTableManager(
            $_db,
            i4.ReadDatabaseContainer($_db)
                .resultSet<i5.$LocalAlbumEntityTable>('local_album_entity'))
        .filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_albumIdTable($_db));
    if (item == null) return manager;
    return i0.ProcessedTableManager(
        manager.$state.copyWith(prefetchedData: [item]));
  }
}

class $$LocalAlbumAssetEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$LocalAlbumAssetEntityTable> {
  $$LocalAlbumAssetEntityTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i3.$$LocalAssetEntityTableFilterComposer get assetId {
    final i3.$$LocalAssetEntityTableFilterComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.assetId,
        referencedTable: i4.ReadDatabaseContainer($db)
            .resultSet<i3.$LocalAssetEntityTable>('local_asset_entity'),
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            i3.$$LocalAssetEntityTableFilterComposer(
              $db: $db,
              $table: i4.ReadDatabaseContainer($db)
                  .resultSet<i3.$LocalAssetEntityTable>('local_asset_entity'),
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }

  i5.$$LocalAlbumEntityTableFilterComposer get albumId {
    final i5.$$LocalAlbumEntityTableFilterComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.albumId,
        referencedTable: i4.ReadDatabaseContainer($db)
            .resultSet<i5.$LocalAlbumEntityTable>('local_album_entity'),
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            i5.$$LocalAlbumEntityTableFilterComposer(
              $db: $db,
              $table: i4.ReadDatabaseContainer($db)
                  .resultSet<i5.$LocalAlbumEntityTable>('local_album_entity'),
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$LocalAlbumAssetEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$LocalAlbumAssetEntityTable> {
  $$LocalAlbumAssetEntityTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i3.$$LocalAssetEntityTableOrderingComposer get assetId {
    final i3.$$LocalAssetEntityTableOrderingComposer composer =
        $composerBuilder(
            composer: this,
            getCurrentColumn: (t) => t.assetId,
            referencedTable: i4.ReadDatabaseContainer($db)
                .resultSet<i3.$LocalAssetEntityTable>('local_asset_entity'),
            getReferencedColumn: (t) => t.id,
            builder: (joinBuilder,
                    {$addJoinBuilderToRootComposer,
                    $removeJoinBuilderFromRootComposer}) =>
                i3.$$LocalAssetEntityTableOrderingComposer(
                  $db: $db,
                  $table: i4.ReadDatabaseContainer($db)
                      .resultSet<i3.$LocalAssetEntityTable>(
                          'local_asset_entity'),
                  $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                  joinBuilder: joinBuilder,
                  $removeJoinBuilderFromRootComposer:
                      $removeJoinBuilderFromRootComposer,
                ));
    return composer;
  }

  i5.$$LocalAlbumEntityTableOrderingComposer get albumId {
    final i5.$$LocalAlbumEntityTableOrderingComposer composer =
        $composerBuilder(
            composer: this,
            getCurrentColumn: (t) => t.albumId,
            referencedTable: i4.ReadDatabaseContainer($db)
                .resultSet<i5.$LocalAlbumEntityTable>('local_album_entity'),
            getReferencedColumn: (t) => t.id,
            builder: (joinBuilder,
                    {$addJoinBuilderToRootComposer,
                    $removeJoinBuilderFromRootComposer}) =>
                i5.$$LocalAlbumEntityTableOrderingComposer(
                  $db: $db,
                  $table: i4.ReadDatabaseContainer($db)
                      .resultSet<i5.$LocalAlbumEntityTable>(
                          'local_album_entity'),
                  $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                  joinBuilder: joinBuilder,
                  $removeJoinBuilderFromRootComposer:
                      $removeJoinBuilderFromRootComposer,
                ));
    return composer;
  }
}

class $$LocalAlbumAssetEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$LocalAlbumAssetEntityTable> {
  $$LocalAlbumAssetEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i3.$$LocalAssetEntityTableAnnotationComposer get assetId {
    final i3.$$LocalAssetEntityTableAnnotationComposer composer =
        $composerBuilder(
            composer: this,
            getCurrentColumn: (t) => t.assetId,
            referencedTable: i4.ReadDatabaseContainer($db)
                .resultSet<i3.$LocalAssetEntityTable>('local_asset_entity'),
            getReferencedColumn: (t) => t.id,
            builder: (joinBuilder,
                    {$addJoinBuilderToRootComposer,
                    $removeJoinBuilderFromRootComposer}) =>
                i3.$$LocalAssetEntityTableAnnotationComposer(
                  $db: $db,
                  $table: i4.ReadDatabaseContainer($db)
                      .resultSet<i3.$LocalAssetEntityTable>(
                          'local_asset_entity'),
                  $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                  joinBuilder: joinBuilder,
                  $removeJoinBuilderFromRootComposer:
                      $removeJoinBuilderFromRootComposer,
                ));
    return composer;
  }

  i5.$$LocalAlbumEntityTableAnnotationComposer get albumId {
    final i5.$$LocalAlbumEntityTableAnnotationComposer composer =
        $composerBuilder(
            composer: this,
            getCurrentColumn: (t) => t.albumId,
            referencedTable: i4.ReadDatabaseContainer($db)
                .resultSet<i5.$LocalAlbumEntityTable>('local_album_entity'),
            getReferencedColumn: (t) => t.id,
            builder: (joinBuilder,
                    {$addJoinBuilderToRootComposer,
                    $removeJoinBuilderFromRootComposer}) =>
                i5.$$LocalAlbumEntityTableAnnotationComposer(
                  $db: $db,
                  $table: i4.ReadDatabaseContainer($db)
                      .resultSet<i5.$LocalAlbumEntityTable>(
                          'local_album_entity'),
                  $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                  joinBuilder: joinBuilder,
                  $removeJoinBuilderFromRootComposer:
                      $removeJoinBuilderFromRootComposer,
                ));
    return composer;
  }
}

class $$LocalAlbumAssetEntityTableTableManager extends i0.RootTableManager<
    i0.GeneratedDatabase,
    i1.$LocalAlbumAssetEntityTable,
    i1.LocalAlbumAssetEntityData,
    i1.$$LocalAlbumAssetEntityTableFilterComposer,
    i1.$$LocalAlbumAssetEntityTableOrderingComposer,
    i1.$$LocalAlbumAssetEntityTableAnnotationComposer,
    $$LocalAlbumAssetEntityTableCreateCompanionBuilder,
    $$LocalAlbumAssetEntityTableUpdateCompanionBuilder,
    (i1.LocalAlbumAssetEntityData, i1.$$LocalAlbumAssetEntityTableReferences),
    i1.LocalAlbumAssetEntityData,
    i0.PrefetchHooks Function({bool assetId, bool albumId})> {
  $$LocalAlbumAssetEntityTableTableManager(
      i0.GeneratedDatabase db, i1.$LocalAlbumAssetEntityTable table)
      : super(i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$LocalAlbumAssetEntityTableFilterComposer(
                  $db: db, $table: table),
          createOrderingComposer: () =>
              i1.$$LocalAlbumAssetEntityTableOrderingComposer(
                  $db: db, $table: table),
          createComputedFieldComposer: () =>
              i1.$$LocalAlbumAssetEntityTableAnnotationComposer(
                  $db: db, $table: table),
          updateCompanionCallback: ({
            i0.Value<String> assetId = const i0.Value.absent(),
            i0.Value<String> albumId = const i0.Value.absent(),
          }) =>
              i1.LocalAlbumAssetEntityCompanion(
            assetId: assetId,
            albumId: albumId,
          ),
          createCompanionCallback: ({
            required String assetId,
            required String albumId,
          }) =>
              i1.LocalAlbumAssetEntityCompanion.insert(
            assetId: assetId,
            albumId: albumId,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (
                    e.readTable(table),
                    i1.$$LocalAlbumAssetEntityTableReferences(db, table, e)
                  ))
              .toList(),
          prefetchHooksCallback: ({assetId = false, albumId = false}) {
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
                    referencedTable: i1.$$LocalAlbumAssetEntityTableReferences
                        ._assetIdTable(db),
                    referencedColumn: i1.$$LocalAlbumAssetEntityTableReferences
                        ._assetIdTable(db)
                        .id,
                  ) as T;
                }
                if (albumId) {
                  state = state.withJoin(
                    currentTable: table,
                    currentColumn: table.albumId,
                    referencedTable: i1.$$LocalAlbumAssetEntityTableReferences
                        ._albumIdTable(db),
                    referencedColumn: i1.$$LocalAlbumAssetEntityTableReferences
                        ._albumIdTable(db)
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

typedef $$LocalAlbumAssetEntityTableProcessedTableManager
    = i0.ProcessedTableManager<
        i0.GeneratedDatabase,
        i1.$LocalAlbumAssetEntityTable,
        i1.LocalAlbumAssetEntityData,
        i1.$$LocalAlbumAssetEntityTableFilterComposer,
        i1.$$LocalAlbumAssetEntityTableOrderingComposer,
        i1.$$LocalAlbumAssetEntityTableAnnotationComposer,
        $$LocalAlbumAssetEntityTableCreateCompanionBuilder,
        $$LocalAlbumAssetEntityTableUpdateCompanionBuilder,
        (
          i1.LocalAlbumAssetEntityData,
          i1.$$LocalAlbumAssetEntityTableReferences
        ),
        i1.LocalAlbumAssetEntityData,
        i0.PrefetchHooks Function({bool assetId, bool albumId})>;

class $LocalAlbumAssetEntityTable extends i2.LocalAlbumAssetEntity
    with
        i0
        .TableInfo<$LocalAlbumAssetEntityTable, i1.LocalAlbumAssetEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalAlbumAssetEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _assetIdMeta =
      const i0.VerificationMeta('assetId');
  @override
  late final i0.GeneratedColumn<String> assetId = i0.GeneratedColumn<String>(
      'asset_id', aliasedName, false,
      type: i0.DriftSqlType.string,
      requiredDuringInsert: true,
      defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
          'REFERENCES local_asset_entity (id) ON DELETE CASCADE'));
  static const i0.VerificationMeta _albumIdMeta =
      const i0.VerificationMeta('albumId');
  @override
  late final i0.GeneratedColumn<String> albumId = i0.GeneratedColumn<String>(
      'album_id', aliasedName, false,
      type: i0.DriftSqlType.string,
      requiredDuringInsert: true,
      defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
          'REFERENCES local_album_entity (id) ON DELETE CASCADE'));
  @override
  List<i0.GeneratedColumn> get $columns => [assetId, albumId];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_album_asset_entity';
  @override
  i0.VerificationContext validateIntegrity(
      i0.Insertable<i1.LocalAlbumAssetEntityData> instance,
      {bool isInserting = false}) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('asset_id')) {
      context.handle(_assetIdMeta,
          assetId.isAcceptableOrUnknown(data['asset_id']!, _assetIdMeta));
    } else if (isInserting) {
      context.missing(_assetIdMeta);
    }
    if (data.containsKey('album_id')) {
      context.handle(_albumIdMeta,
          albumId.isAcceptableOrUnknown(data['album_id']!, _albumIdMeta));
    } else if (isInserting) {
      context.missing(_albumIdMeta);
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {assetId, albumId};
  @override
  i1.LocalAlbumAssetEntityData map(Map<String, dynamic> data,
      {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.LocalAlbumAssetEntityData(
      assetId: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}asset_id'])!,
      albumId: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}album_id'])!,
    );
  }

  @override
  $LocalAlbumAssetEntityTable createAlias(String alias) {
    return $LocalAlbumAssetEntityTable(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class LocalAlbumAssetEntityData extends i0.DataClass
    implements i0.Insertable<i1.LocalAlbumAssetEntityData> {
  final String assetId;
  final String albumId;
  const LocalAlbumAssetEntityData(
      {required this.assetId, required this.albumId});
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['asset_id'] = i0.Variable<String>(assetId);
    map['album_id'] = i0.Variable<String>(albumId);
    return map;
  }

  factory LocalAlbumAssetEntityData.fromJson(Map<String, dynamic> json,
      {i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return LocalAlbumAssetEntityData(
      assetId: serializer.fromJson<String>(json['assetId']),
      albumId: serializer.fromJson<String>(json['albumId']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'assetId': serializer.toJson<String>(assetId),
      'albumId': serializer.toJson<String>(albumId),
    };
  }

  i1.LocalAlbumAssetEntityData copyWith({String? assetId, String? albumId}) =>
      i1.LocalAlbumAssetEntityData(
        assetId: assetId ?? this.assetId,
        albumId: albumId ?? this.albumId,
      );
  LocalAlbumAssetEntityData copyWithCompanion(
      i1.LocalAlbumAssetEntityCompanion data) {
    return LocalAlbumAssetEntityData(
      assetId: data.assetId.present ? data.assetId.value : this.assetId,
      albumId: data.albumId.present ? data.albumId.value : this.albumId,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalAlbumAssetEntityData(')
          ..write('assetId: $assetId, ')
          ..write('albumId: $albumId')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(assetId, albumId);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.LocalAlbumAssetEntityData &&
          other.assetId == this.assetId &&
          other.albumId == this.albumId);
}

class LocalAlbumAssetEntityCompanion
    extends i0.UpdateCompanion<i1.LocalAlbumAssetEntityData> {
  final i0.Value<String> assetId;
  final i0.Value<String> albumId;
  const LocalAlbumAssetEntityCompanion({
    this.assetId = const i0.Value.absent(),
    this.albumId = const i0.Value.absent(),
  });
  LocalAlbumAssetEntityCompanion.insert({
    required String assetId,
    required String albumId,
  })  : assetId = i0.Value(assetId),
        albumId = i0.Value(albumId);
  static i0.Insertable<i1.LocalAlbumAssetEntityData> custom({
    i0.Expression<String>? assetId,
    i0.Expression<String>? albumId,
  }) {
    return i0.RawValuesInsertable({
      if (assetId != null) 'asset_id': assetId,
      if (albumId != null) 'album_id': albumId,
    });
  }

  i1.LocalAlbumAssetEntityCompanion copyWith(
      {i0.Value<String>? assetId, i0.Value<String>? albumId}) {
    return i1.LocalAlbumAssetEntityCompanion(
      assetId: assetId ?? this.assetId,
      albumId: albumId ?? this.albumId,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (assetId.present) {
      map['asset_id'] = i0.Variable<String>(assetId.value);
    }
    if (albumId.present) {
      map['album_id'] = i0.Variable<String>(albumId.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalAlbumAssetEntityCompanion(')
          ..write('assetId: $assetId, ')
          ..write('albumId: $albumId')
          ..write(')'))
        .toString();
  }
}
