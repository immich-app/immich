// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/offline_album.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/offline_album.entity.dart'
    as i2;
import 'package:drift/src/runtime/query_builder/query_builder.dart' as i3;
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.drift.dart'
    as i4;
import 'package:drift/internal/modular.dart' as i5;

typedef $$OfflineAlbumEntityTableCreateCompanionBuilder =
    i1.OfflineAlbumEntityCompanion Function({
      required String albumId,
      i0.Value<DateTime> createdAt,
    });
typedef $$OfflineAlbumEntityTableUpdateCompanionBuilder =
    i1.OfflineAlbumEntityCompanion Function({
      i0.Value<String> albumId,
      i0.Value<DateTime> createdAt,
    });

final class $$OfflineAlbumEntityTableReferences
    extends
        i0.BaseReferences<
          i0.GeneratedDatabase,
          i1.$OfflineAlbumEntityTable,
          i1.OfflineAlbumEntityData
        > {
  $$OfflineAlbumEntityTableReferences(
    super.$_db,
    super.$_table,
    super.$_typedResult,
  );

  static i4.$RemoteAlbumEntityTable _albumIdTable(i0.GeneratedDatabase db) =>
      i5.ReadDatabaseContainer(db)
          .resultSet<i4.$RemoteAlbumEntityTable>('remote_album_entity')
          .createAlias(
            i0.$_aliasNameGenerator(
              i5.ReadDatabaseContainer(db)
                  .resultSet<i1.$OfflineAlbumEntityTable>(
                    'offline_album_entity',
                  )
                  .albumId,
              i5.ReadDatabaseContainer(
                db,
              ).resultSet<i4.$RemoteAlbumEntityTable>('remote_album_entity').id,
            ),
          );

  i4.$$RemoteAlbumEntityTableProcessedTableManager get albumId {
    final $_column = $_itemColumn<String>('album_id')!;

    final manager = i4
        .$$RemoteAlbumEntityTableTableManager(
          $_db,
          i5.ReadDatabaseContainer(
            $_db,
          ).resultSet<i4.$RemoteAlbumEntityTable>('remote_album_entity'),
        )
        .filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_albumIdTable($_db));
    if (item == null) return manager;
    return i0.ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }
}

class $$OfflineAlbumEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$OfflineAlbumEntityTable> {
  $$OfflineAlbumEntityTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => i0.ColumnFilters(column),
  );

  i4.$$RemoteAlbumEntityTableFilterComposer get albumId {
    final i4.$$RemoteAlbumEntityTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.albumId,
      referencedTable: i5.ReadDatabaseContainer(
        $db,
      ).resultSet<i4.$RemoteAlbumEntityTable>('remote_album_entity'),
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => i4.$$RemoteAlbumEntityTableFilterComposer(
            $db: $db,
            $table: i5.ReadDatabaseContainer(
              $db,
            ).resultSet<i4.$RemoteAlbumEntityTable>('remote_album_entity'),
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$OfflineAlbumEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$OfflineAlbumEntityTable> {
  $$OfflineAlbumEntityTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i4.$$RemoteAlbumEntityTableOrderingComposer get albumId {
    final i4.$$RemoteAlbumEntityTableOrderingComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.albumId,
          referencedTable: i5.ReadDatabaseContainer(
            $db,
          ).resultSet<i4.$RemoteAlbumEntityTable>('remote_album_entity'),
          getReferencedColumn: (t) => t.id,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => i4.$$RemoteAlbumEntityTableOrderingComposer(
                $db: $db,
                $table: i5.ReadDatabaseContainer(
                  $db,
                ).resultSet<i4.$RemoteAlbumEntityTable>('remote_album_entity'),
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return composer;
  }
}

class $$OfflineAlbumEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$OfflineAlbumEntityTable> {
  $$OfflineAlbumEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  i4.$$RemoteAlbumEntityTableAnnotationComposer get albumId {
    final i4.$$RemoteAlbumEntityTableAnnotationComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.albumId,
          referencedTable: i5.ReadDatabaseContainer(
            $db,
          ).resultSet<i4.$RemoteAlbumEntityTable>('remote_album_entity'),
          getReferencedColumn: (t) => t.id,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => i4.$$RemoteAlbumEntityTableAnnotationComposer(
                $db: $db,
                $table: i5.ReadDatabaseContainer(
                  $db,
                ).resultSet<i4.$RemoteAlbumEntityTable>('remote_album_entity'),
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return composer;
  }
}

class $$OfflineAlbumEntityTableTableManager
    extends
        i0.RootTableManager<
          i0.GeneratedDatabase,
          i1.$OfflineAlbumEntityTable,
          i1.OfflineAlbumEntityData,
          i1.$$OfflineAlbumEntityTableFilterComposer,
          i1.$$OfflineAlbumEntityTableOrderingComposer,
          i1.$$OfflineAlbumEntityTableAnnotationComposer,
          $$OfflineAlbumEntityTableCreateCompanionBuilder,
          $$OfflineAlbumEntityTableUpdateCompanionBuilder,
          (i1.OfflineAlbumEntityData, i1.$$OfflineAlbumEntityTableReferences),
          i1.OfflineAlbumEntityData,
          i0.PrefetchHooks Function({bool albumId})
        > {
  $$OfflineAlbumEntityTableTableManager(
    i0.GeneratedDatabase db,
    i1.$OfflineAlbumEntityTable table,
  ) : super(
        i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () => i1
              .$$OfflineAlbumEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              i1.$$OfflineAlbumEntityTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              i1.$$OfflineAlbumEntityTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                i0.Value<String> albumId = const i0.Value.absent(),
                i0.Value<DateTime> createdAt = const i0.Value.absent(),
              }) => i1.OfflineAlbumEntityCompanion(
                albumId: albumId,
                createdAt: createdAt,
              ),
          createCompanionCallback:
              ({
                required String albumId,
                i0.Value<DateTime> createdAt = const i0.Value.absent(),
              }) => i1.OfflineAlbumEntityCompanion.insert(
                albumId: albumId,
                createdAt: createdAt,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable(table),
                  i1.$$OfflineAlbumEntityTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: ({albumId = false}) {
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
                    if (albumId) {
                      state =
                          state.withJoin(
                                currentTable: table,
                                currentColumn: table.albumId,
                                referencedTable: i1
                                    .$$OfflineAlbumEntityTableReferences
                                    ._albumIdTable(db),
                                referencedColumn: i1
                                    .$$OfflineAlbumEntityTableReferences
                                    ._albumIdTable(db)
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

typedef $$OfflineAlbumEntityTableProcessedTableManager =
    i0.ProcessedTableManager<
      i0.GeneratedDatabase,
      i1.$OfflineAlbumEntityTable,
      i1.OfflineAlbumEntityData,
      i1.$$OfflineAlbumEntityTableFilterComposer,
      i1.$$OfflineAlbumEntityTableOrderingComposer,
      i1.$$OfflineAlbumEntityTableAnnotationComposer,
      $$OfflineAlbumEntityTableCreateCompanionBuilder,
      $$OfflineAlbumEntityTableUpdateCompanionBuilder,
      (i1.OfflineAlbumEntityData, i1.$$OfflineAlbumEntityTableReferences),
      i1.OfflineAlbumEntityData,
      i0.PrefetchHooks Function({bool albumId})
    >;

class $OfflineAlbumEntityTable extends i2.OfflineAlbumEntity
    with i0.TableInfo<$OfflineAlbumEntityTable, i1.OfflineAlbumEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $OfflineAlbumEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _albumIdMeta = const i0.VerificationMeta(
    'albumId',
  );
  @override
  late final i0.GeneratedColumn<String> albumId = i0.GeneratedColumn<String>(
    'album_id',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
      'REFERENCES remote_album_entity (id) ON DELETE CASCADE',
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
  List<i0.GeneratedColumn> get $columns => [albumId, createdAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'offline_album_entity';
  @override
  i0.VerificationContext validateIntegrity(
    i0.Insertable<i1.OfflineAlbumEntityData> instance, {
    bool isInserting = false,
  }) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('album_id')) {
      context.handle(
        _albumIdMeta,
        albumId.isAcceptableOrUnknown(data['album_id']!, _albumIdMeta),
      );
    } else if (isInserting) {
      context.missing(_albumIdMeta);
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
  Set<i0.GeneratedColumn> get $primaryKey => {albumId};
  @override
  i1.OfflineAlbumEntityData map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.OfflineAlbumEntityData(
      albumId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}album_id'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
    );
  }

  @override
  $OfflineAlbumEntityTable createAlias(String alias) {
    return $OfflineAlbumEntityTable(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class OfflineAlbumEntityData extends i0.DataClass
    implements i0.Insertable<i1.OfflineAlbumEntityData> {
  final String albumId;
  final DateTime createdAt;
  const OfflineAlbumEntityData({
    required this.albumId,
    required this.createdAt,
  });
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['album_id'] = i0.Variable<String>(albumId);
    map['created_at'] = i0.Variable<DateTime>(createdAt);
    return map;
  }

  factory OfflineAlbumEntityData.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return OfflineAlbumEntityData(
      albumId: serializer.fromJson<String>(json['albumId']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'albumId': serializer.toJson<String>(albumId),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  i1.OfflineAlbumEntityData copyWith({String? albumId, DateTime? createdAt}) =>
      i1.OfflineAlbumEntityData(
        albumId: albumId ?? this.albumId,
        createdAt: createdAt ?? this.createdAt,
      );
  OfflineAlbumEntityData copyWithCompanion(
    i1.OfflineAlbumEntityCompanion data,
  ) {
    return OfflineAlbumEntityData(
      albumId: data.albumId.present ? data.albumId.value : this.albumId,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('OfflineAlbumEntityData(')
          ..write('albumId: $albumId, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(albumId, createdAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.OfflineAlbumEntityData &&
          other.albumId == this.albumId &&
          other.createdAt == this.createdAt);
}

class OfflineAlbumEntityCompanion
    extends i0.UpdateCompanion<i1.OfflineAlbumEntityData> {
  final i0.Value<String> albumId;
  final i0.Value<DateTime> createdAt;
  const OfflineAlbumEntityCompanion({
    this.albumId = const i0.Value.absent(),
    this.createdAt = const i0.Value.absent(),
  });
  OfflineAlbumEntityCompanion.insert({
    required String albumId,
    this.createdAt = const i0.Value.absent(),
  }) : albumId = i0.Value(albumId);
  static i0.Insertable<i1.OfflineAlbumEntityData> custom({
    i0.Expression<String>? albumId,
    i0.Expression<DateTime>? createdAt,
  }) {
    return i0.RawValuesInsertable({
      if (albumId != null) 'album_id': albumId,
      if (createdAt != null) 'created_at': createdAt,
    });
  }

  i1.OfflineAlbumEntityCompanion copyWith({
    i0.Value<String>? albumId,
    i0.Value<DateTime>? createdAt,
  }) {
    return i1.OfflineAlbumEntityCompanion(
      albumId: albumId ?? this.albumId,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (albumId.present) {
      map['album_id'] = i0.Variable<String>(albumId.value);
    }
    if (createdAt.present) {
      map['created_at'] = i0.Variable<DateTime>(createdAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('OfflineAlbumEntityCompanion(')
          ..write('albumId: $albumId, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }
}
