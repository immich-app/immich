// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/shared_space_library.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/shared_space_library.entity.dart'
    as i2;
import 'package:drift/src/runtime/query_builder/query_builder.dart' as i3;
import 'package:immich_mobile/infrastructure/entities/shared_space.entity.drift.dart'
    as i4;
import 'package:drift/internal/modular.dart' as i5;

typedef $$SharedSpaceLibraryEntityTableCreateCompanionBuilder =
    i1.SharedSpaceLibraryEntityCompanion Function({
      required String spaceId,
      required String libraryId,
      i0.Value<String?> addedById,
      i0.Value<DateTime> createdAt,
    });
typedef $$SharedSpaceLibraryEntityTableUpdateCompanionBuilder =
    i1.SharedSpaceLibraryEntityCompanion Function({
      i0.Value<String> spaceId,
      i0.Value<String> libraryId,
      i0.Value<String?> addedById,
      i0.Value<DateTime> createdAt,
    });

final class $$SharedSpaceLibraryEntityTableReferences
    extends
        i0.BaseReferences<
          i0.GeneratedDatabase,
          i1.$SharedSpaceLibraryEntityTable,
          i1.SharedSpaceLibraryEntityData
        > {
  $$SharedSpaceLibraryEntityTableReferences(
    super.$_db,
    super.$_table,
    super.$_typedResult,
  );

  static i4.$SharedSpaceEntityTable _spaceIdTable(i0.GeneratedDatabase db) =>
      i5.ReadDatabaseContainer(db)
          .resultSet<i4.$SharedSpaceEntityTable>('shared_space_entity')
          .createAlias(
            i0.$_aliasNameGenerator(
              i5.ReadDatabaseContainer(db)
                  .resultSet<i1.$SharedSpaceLibraryEntityTable>(
                    'shared_space_library_entity',
                  )
                  .spaceId,
              i5.ReadDatabaseContainer(
                db,
              ).resultSet<i4.$SharedSpaceEntityTable>('shared_space_entity').id,
            ),
          );

  i4.$$SharedSpaceEntityTableProcessedTableManager get spaceId {
    final $_column = $_itemColumn<String>('space_id')!;

    final manager = i4
        .$$SharedSpaceEntityTableTableManager(
          $_db,
          i5.ReadDatabaseContainer(
            $_db,
          ).resultSet<i4.$SharedSpaceEntityTable>('shared_space_entity'),
        )
        .filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_spaceIdTable($_db));
    if (item == null) return manager;
    return i0.ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }
}

class $$SharedSpaceLibraryEntityTableFilterComposer
    extends
        i0.Composer<i0.GeneratedDatabase, i1.$SharedSpaceLibraryEntityTable> {
  $$SharedSpaceLibraryEntityTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnFilters<String> get libraryId => $composableBuilder(
    column: $table.libraryId,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<String> get addedById => $composableBuilder(
    column: $table.addedById,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => i0.ColumnFilters(column),
  );

  i4.$$SharedSpaceEntityTableFilterComposer get spaceId {
    final i4.$$SharedSpaceEntityTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.spaceId,
      referencedTable: i5.ReadDatabaseContainer(
        $db,
      ).resultSet<i4.$SharedSpaceEntityTable>('shared_space_entity'),
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => i4.$$SharedSpaceEntityTableFilterComposer(
            $db: $db,
            $table: i5.ReadDatabaseContainer(
              $db,
            ).resultSet<i4.$SharedSpaceEntityTable>('shared_space_entity'),
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$SharedSpaceLibraryEntityTableOrderingComposer
    extends
        i0.Composer<i0.GeneratedDatabase, i1.$SharedSpaceLibraryEntityTable> {
  $$SharedSpaceLibraryEntityTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnOrderings<String> get libraryId => $composableBuilder(
    column: $table.libraryId,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get addedById => $composableBuilder(
    column: $table.addedById,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i4.$$SharedSpaceEntityTableOrderingComposer get spaceId {
    final i4.$$SharedSpaceEntityTableOrderingComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.spaceId,
          referencedTable: i5.ReadDatabaseContainer(
            $db,
          ).resultSet<i4.$SharedSpaceEntityTable>('shared_space_entity'),
          getReferencedColumn: (t) => t.id,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => i4.$$SharedSpaceEntityTableOrderingComposer(
                $db: $db,
                $table: i5.ReadDatabaseContainer(
                  $db,
                ).resultSet<i4.$SharedSpaceEntityTable>('shared_space_entity'),
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return composer;
  }
}

class $$SharedSpaceLibraryEntityTableAnnotationComposer
    extends
        i0.Composer<i0.GeneratedDatabase, i1.$SharedSpaceLibraryEntityTable> {
  $$SharedSpaceLibraryEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<String> get libraryId =>
      $composableBuilder(column: $table.libraryId, builder: (column) => column);

  i0.GeneratedColumn<String> get addedById =>
      $composableBuilder(column: $table.addedById, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  i4.$$SharedSpaceEntityTableAnnotationComposer get spaceId {
    final i4.$$SharedSpaceEntityTableAnnotationComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.spaceId,
          referencedTable: i5.ReadDatabaseContainer(
            $db,
          ).resultSet<i4.$SharedSpaceEntityTable>('shared_space_entity'),
          getReferencedColumn: (t) => t.id,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => i4.$$SharedSpaceEntityTableAnnotationComposer(
                $db: $db,
                $table: i5.ReadDatabaseContainer(
                  $db,
                ).resultSet<i4.$SharedSpaceEntityTable>('shared_space_entity'),
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return composer;
  }
}

class $$SharedSpaceLibraryEntityTableTableManager
    extends
        i0.RootTableManager<
          i0.GeneratedDatabase,
          i1.$SharedSpaceLibraryEntityTable,
          i1.SharedSpaceLibraryEntityData,
          i1.$$SharedSpaceLibraryEntityTableFilterComposer,
          i1.$$SharedSpaceLibraryEntityTableOrderingComposer,
          i1.$$SharedSpaceLibraryEntityTableAnnotationComposer,
          $$SharedSpaceLibraryEntityTableCreateCompanionBuilder,
          $$SharedSpaceLibraryEntityTableUpdateCompanionBuilder,
          (
            i1.SharedSpaceLibraryEntityData,
            i1.$$SharedSpaceLibraryEntityTableReferences,
          ),
          i1.SharedSpaceLibraryEntityData,
          i0.PrefetchHooks Function({bool spaceId})
        > {
  $$SharedSpaceLibraryEntityTableTableManager(
    i0.GeneratedDatabase db,
    i1.$SharedSpaceLibraryEntityTable table,
  ) : super(
        i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$SharedSpaceLibraryEntityTableFilterComposer(
                $db: db,
                $table: table,
              ),
          createOrderingComposer: () =>
              i1.$$SharedSpaceLibraryEntityTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              i1.$$SharedSpaceLibraryEntityTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                i0.Value<String> spaceId = const i0.Value.absent(),
                i0.Value<String> libraryId = const i0.Value.absent(),
                i0.Value<String?> addedById = const i0.Value.absent(),
                i0.Value<DateTime> createdAt = const i0.Value.absent(),
              }) => i1.SharedSpaceLibraryEntityCompanion(
                spaceId: spaceId,
                libraryId: libraryId,
                addedById: addedById,
                createdAt: createdAt,
              ),
          createCompanionCallback:
              ({
                required String spaceId,
                required String libraryId,
                i0.Value<String?> addedById = const i0.Value.absent(),
                i0.Value<DateTime> createdAt = const i0.Value.absent(),
              }) => i1.SharedSpaceLibraryEntityCompanion.insert(
                spaceId: spaceId,
                libraryId: libraryId,
                addedById: addedById,
                createdAt: createdAt,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable(table),
                  i1.$$SharedSpaceLibraryEntityTableReferences(db, table, e),
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
                                    .$$SharedSpaceLibraryEntityTableReferences
                                    ._spaceIdTable(db),
                                referencedColumn: i1
                                    .$$SharedSpaceLibraryEntityTableReferences
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

typedef $$SharedSpaceLibraryEntityTableProcessedTableManager =
    i0.ProcessedTableManager<
      i0.GeneratedDatabase,
      i1.$SharedSpaceLibraryEntityTable,
      i1.SharedSpaceLibraryEntityData,
      i1.$$SharedSpaceLibraryEntityTableFilterComposer,
      i1.$$SharedSpaceLibraryEntityTableOrderingComposer,
      i1.$$SharedSpaceLibraryEntityTableAnnotationComposer,
      $$SharedSpaceLibraryEntityTableCreateCompanionBuilder,
      $$SharedSpaceLibraryEntityTableUpdateCompanionBuilder,
      (
        i1.SharedSpaceLibraryEntityData,
        i1.$$SharedSpaceLibraryEntityTableReferences,
      ),
      i1.SharedSpaceLibraryEntityData,
      i0.PrefetchHooks Function({bool spaceId})
    >;
i0.Index get idxSharedSpaceLibrarySpaceId => i0.Index(
  'idx_shared_space_library_space_id',
  'CREATE INDEX IF NOT EXISTS idx_shared_space_library_space_id ON shared_space_library_entity (space_id)',
);

class $SharedSpaceLibraryEntityTable extends i2.SharedSpaceLibraryEntity
    with
        i0.TableInfo<
          $SharedSpaceLibraryEntityTable,
          i1.SharedSpaceLibraryEntityData
        > {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SharedSpaceLibraryEntityTable(this.attachedDatabase, [this._alias]);
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
  static const i0.VerificationMeta _libraryIdMeta = const i0.VerificationMeta(
    'libraryId',
  );
  @override
  late final i0.GeneratedColumn<String> libraryId = i0.GeneratedColumn<String>(
    'library_id',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _addedByIdMeta = const i0.VerificationMeta(
    'addedById',
  );
  @override
  late final i0.GeneratedColumn<String> addedById = i0.GeneratedColumn<String>(
    'added_by_id',
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
        false,
        type: i0.DriftSqlType.dateTime,
        requiredDuringInsert: false,
        defaultValue: i3.currentDateAndTime,
      );
  @override
  List<i0.GeneratedColumn> get $columns => [
    spaceId,
    libraryId,
    addedById,
    createdAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'shared_space_library_entity';
  @override
  i0.VerificationContext validateIntegrity(
    i0.Insertable<i1.SharedSpaceLibraryEntityData> instance, {
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
    if (data.containsKey('library_id')) {
      context.handle(
        _libraryIdMeta,
        libraryId.isAcceptableOrUnknown(data['library_id']!, _libraryIdMeta),
      );
    } else if (isInserting) {
      context.missing(_libraryIdMeta);
    }
    if (data.containsKey('added_by_id')) {
      context.handle(
        _addedByIdMeta,
        addedById.isAcceptableOrUnknown(data['added_by_id']!, _addedByIdMeta),
      );
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
  Set<i0.GeneratedColumn> get $primaryKey => {spaceId, libraryId};
  @override
  i1.SharedSpaceLibraryEntityData map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.SharedSpaceLibraryEntityData(
      spaceId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}space_id'],
      )!,
      libraryId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}library_id'],
      )!,
      addedById: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}added_by_id'],
      ),
      createdAt: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
    );
  }

  @override
  $SharedSpaceLibraryEntityTable createAlias(String alias) {
    return $SharedSpaceLibraryEntityTable(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class SharedSpaceLibraryEntityData extends i0.DataClass
    implements i0.Insertable<i1.SharedSpaceLibraryEntityData> {
  final String spaceId;
  final String libraryId;
  final String? addedById;
  final DateTime createdAt;
  const SharedSpaceLibraryEntityData({
    required this.spaceId,
    required this.libraryId,
    this.addedById,
    required this.createdAt,
  });
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['space_id'] = i0.Variable<String>(spaceId);
    map['library_id'] = i0.Variable<String>(libraryId);
    if (!nullToAbsent || addedById != null) {
      map['added_by_id'] = i0.Variable<String>(addedById);
    }
    map['created_at'] = i0.Variable<DateTime>(createdAt);
    return map;
  }

  factory SharedSpaceLibraryEntityData.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return SharedSpaceLibraryEntityData(
      spaceId: serializer.fromJson<String>(json['spaceId']),
      libraryId: serializer.fromJson<String>(json['libraryId']),
      addedById: serializer.fromJson<String?>(json['addedById']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'spaceId': serializer.toJson<String>(spaceId),
      'libraryId': serializer.toJson<String>(libraryId),
      'addedById': serializer.toJson<String?>(addedById),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  i1.SharedSpaceLibraryEntityData copyWith({
    String? spaceId,
    String? libraryId,
    i0.Value<String?> addedById = const i0.Value.absent(),
    DateTime? createdAt,
  }) => i1.SharedSpaceLibraryEntityData(
    spaceId: spaceId ?? this.spaceId,
    libraryId: libraryId ?? this.libraryId,
    addedById: addedById.present ? addedById.value : this.addedById,
    createdAt: createdAt ?? this.createdAt,
  );
  SharedSpaceLibraryEntityData copyWithCompanion(
    i1.SharedSpaceLibraryEntityCompanion data,
  ) {
    return SharedSpaceLibraryEntityData(
      spaceId: data.spaceId.present ? data.spaceId.value : this.spaceId,
      libraryId: data.libraryId.present ? data.libraryId.value : this.libraryId,
      addedById: data.addedById.present ? data.addedById.value : this.addedById,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SharedSpaceLibraryEntityData(')
          ..write('spaceId: $spaceId, ')
          ..write('libraryId: $libraryId, ')
          ..write('addedById: $addedById, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(spaceId, libraryId, addedById, createdAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.SharedSpaceLibraryEntityData &&
          other.spaceId == this.spaceId &&
          other.libraryId == this.libraryId &&
          other.addedById == this.addedById &&
          other.createdAt == this.createdAt);
}

class SharedSpaceLibraryEntityCompanion
    extends i0.UpdateCompanion<i1.SharedSpaceLibraryEntityData> {
  final i0.Value<String> spaceId;
  final i0.Value<String> libraryId;
  final i0.Value<String?> addedById;
  final i0.Value<DateTime> createdAt;
  const SharedSpaceLibraryEntityCompanion({
    this.spaceId = const i0.Value.absent(),
    this.libraryId = const i0.Value.absent(),
    this.addedById = const i0.Value.absent(),
    this.createdAt = const i0.Value.absent(),
  });
  SharedSpaceLibraryEntityCompanion.insert({
    required String spaceId,
    required String libraryId,
    this.addedById = const i0.Value.absent(),
    this.createdAt = const i0.Value.absent(),
  }) : spaceId = i0.Value(spaceId),
       libraryId = i0.Value(libraryId);
  static i0.Insertable<i1.SharedSpaceLibraryEntityData> custom({
    i0.Expression<String>? spaceId,
    i0.Expression<String>? libraryId,
    i0.Expression<String>? addedById,
    i0.Expression<DateTime>? createdAt,
  }) {
    return i0.RawValuesInsertable({
      if (spaceId != null) 'space_id': spaceId,
      if (libraryId != null) 'library_id': libraryId,
      if (addedById != null) 'added_by_id': addedById,
      if (createdAt != null) 'created_at': createdAt,
    });
  }

  i1.SharedSpaceLibraryEntityCompanion copyWith({
    i0.Value<String>? spaceId,
    i0.Value<String>? libraryId,
    i0.Value<String?>? addedById,
    i0.Value<DateTime>? createdAt,
  }) {
    return i1.SharedSpaceLibraryEntityCompanion(
      spaceId: spaceId ?? this.spaceId,
      libraryId: libraryId ?? this.libraryId,
      addedById: addedById ?? this.addedById,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (spaceId.present) {
      map['space_id'] = i0.Variable<String>(spaceId.value);
    }
    if (libraryId.present) {
      map['library_id'] = i0.Variable<String>(libraryId.value);
    }
    if (addedById.present) {
      map['added_by_id'] = i0.Variable<String>(addedById.value);
    }
    if (createdAt.present) {
      map['created_at'] = i0.Variable<DateTime>(createdAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SharedSpaceLibraryEntityCompanion(')
          ..write('spaceId: $spaceId, ')
          ..write('libraryId: $libraryId, ')
          ..write('addedById: $addedById, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }
}

i0.Index get idxSharedSpaceLibraryLibrarySpace => i0.Index(
  'idx_shared_space_library_library_space',
  'CREATE INDEX IF NOT EXISTS idx_shared_space_library_library_space ON shared_space_library_entity (library_id, space_id)',
);
