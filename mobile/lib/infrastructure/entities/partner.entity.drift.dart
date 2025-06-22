// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/partner.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/partner.entity.dart'
    as i2;
import 'package:drift/src/runtime/query_builder/query_builder.dart' as i3;
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart'
    as i4;
import 'package:drift/internal/modular.dart' as i5;

typedef $$PartnerEntityTableCreateCompanionBuilder = i1.PartnerEntityCompanion
    Function({
  required String sharedById,
  required String sharedWithId,
  i0.Value<bool> inTimeline,
});
typedef $$PartnerEntityTableUpdateCompanionBuilder = i1.PartnerEntityCompanion
    Function({
  i0.Value<String> sharedById,
  i0.Value<String> sharedWithId,
  i0.Value<bool> inTimeline,
});

final class $$PartnerEntityTableReferences extends i0.BaseReferences<
    i0.GeneratedDatabase, i1.$PartnerEntityTable, i1.PartnerEntityData> {
  $$PartnerEntityTableReferences(
      super.$_db, super.$_table, super.$_typedResult);

  static i4.$UserEntityTable _sharedByIdTable(i0.GeneratedDatabase db) =>
      i5.ReadDatabaseContainer(db)
          .resultSet<i4.$UserEntityTable>('user_entity')
          .createAlias(i0.$_aliasNameGenerator(
              i5.ReadDatabaseContainer(db)
                  .resultSet<i1.$PartnerEntityTable>('partner_entity')
                  .sharedById,
              i5.ReadDatabaseContainer(db)
                  .resultSet<i4.$UserEntityTable>('user_entity')
                  .id));

  i4.$$UserEntityTableProcessedTableManager get sharedById {
    final $_column = $_itemColumn<String>('shared_by_id')!;

    final manager = i4
        .$$UserEntityTableTableManager(
            $_db,
            i5.ReadDatabaseContainer($_db)
                .resultSet<i4.$UserEntityTable>('user_entity'))
        .filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_sharedByIdTable($_db));
    if (item == null) return manager;
    return i0.ProcessedTableManager(
        manager.$state.copyWith(prefetchedData: [item]));
  }

  static i4.$UserEntityTable _sharedWithIdTable(i0.GeneratedDatabase db) =>
      i5.ReadDatabaseContainer(db)
          .resultSet<i4.$UserEntityTable>('user_entity')
          .createAlias(i0.$_aliasNameGenerator(
              i5.ReadDatabaseContainer(db)
                  .resultSet<i1.$PartnerEntityTable>('partner_entity')
                  .sharedWithId,
              i5.ReadDatabaseContainer(db)
                  .resultSet<i4.$UserEntityTable>('user_entity')
                  .id));

  i4.$$UserEntityTableProcessedTableManager get sharedWithId {
    final $_column = $_itemColumn<String>('shared_with_id')!;

    final manager = i4
        .$$UserEntityTableTableManager(
            $_db,
            i5.ReadDatabaseContainer($_db)
                .resultSet<i4.$UserEntityTable>('user_entity'))
        .filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_sharedWithIdTable($_db));
    if (item == null) return manager;
    return i0.ProcessedTableManager(
        manager.$state.copyWith(prefetchedData: [item]));
  }
}

class $$PartnerEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$PartnerEntityTable> {
  $$PartnerEntityTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnFilters<bool> get inTimeline => $composableBuilder(
      column: $table.inTimeline, builder: (column) => i0.ColumnFilters(column));

  i4.$$UserEntityTableFilterComposer get sharedById {
    final i4.$$UserEntityTableFilterComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.sharedById,
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

  i4.$$UserEntityTableFilterComposer get sharedWithId {
    final i4.$$UserEntityTableFilterComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.sharedWithId,
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
}

class $$PartnerEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$PartnerEntityTable> {
  $$PartnerEntityTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnOrderings<bool> get inTimeline => $composableBuilder(
      column: $table.inTimeline,
      builder: (column) => i0.ColumnOrderings(column));

  i4.$$UserEntityTableOrderingComposer get sharedById {
    final i4.$$UserEntityTableOrderingComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.sharedById,
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

  i4.$$UserEntityTableOrderingComposer get sharedWithId {
    final i4.$$UserEntityTableOrderingComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.sharedWithId,
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
}

class $$PartnerEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$PartnerEntityTable> {
  $$PartnerEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<bool> get inTimeline => $composableBuilder(
      column: $table.inTimeline, builder: (column) => column);

  i4.$$UserEntityTableAnnotationComposer get sharedById {
    final i4.$$UserEntityTableAnnotationComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.sharedById,
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

  i4.$$UserEntityTableAnnotationComposer get sharedWithId {
    final i4.$$UserEntityTableAnnotationComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.sharedWithId,
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
}

class $$PartnerEntityTableTableManager extends i0.RootTableManager<
    i0.GeneratedDatabase,
    i1.$PartnerEntityTable,
    i1.PartnerEntityData,
    i1.$$PartnerEntityTableFilterComposer,
    i1.$$PartnerEntityTableOrderingComposer,
    i1.$$PartnerEntityTableAnnotationComposer,
    $$PartnerEntityTableCreateCompanionBuilder,
    $$PartnerEntityTableUpdateCompanionBuilder,
    (i1.PartnerEntityData, i1.$$PartnerEntityTableReferences),
    i1.PartnerEntityData,
    i0.PrefetchHooks Function({bool sharedById, bool sharedWithId})> {
  $$PartnerEntityTableTableManager(
      i0.GeneratedDatabase db, i1.$PartnerEntityTable table)
      : super(i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$PartnerEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              i1.$$PartnerEntityTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              i1.$$PartnerEntityTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            i0.Value<String> sharedById = const i0.Value.absent(),
            i0.Value<String> sharedWithId = const i0.Value.absent(),
            i0.Value<bool> inTimeline = const i0.Value.absent(),
          }) =>
              i1.PartnerEntityCompanion(
            sharedById: sharedById,
            sharedWithId: sharedWithId,
            inTimeline: inTimeline,
          ),
          createCompanionCallback: ({
            required String sharedById,
            required String sharedWithId,
            i0.Value<bool> inTimeline = const i0.Value.absent(),
          }) =>
              i1.PartnerEntityCompanion.insert(
            sharedById: sharedById,
            sharedWithId: sharedWithId,
            inTimeline: inTimeline,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (
                    e.readTable(table),
                    i1.$$PartnerEntityTableReferences(db, table, e)
                  ))
              .toList(),
          prefetchHooksCallback: ({sharedById = false, sharedWithId = false}) {
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
                if (sharedById) {
                  state = state.withJoin(
                    currentTable: table,
                    currentColumn: table.sharedById,
                    referencedTable:
                        i1.$$PartnerEntityTableReferences._sharedByIdTable(db),
                    referencedColumn: i1.$$PartnerEntityTableReferences
                        ._sharedByIdTable(db)
                        .id,
                  ) as T;
                }
                if (sharedWithId) {
                  state = state.withJoin(
                    currentTable: table,
                    currentColumn: table.sharedWithId,
                    referencedTable: i1.$$PartnerEntityTableReferences
                        ._sharedWithIdTable(db),
                    referencedColumn: i1.$$PartnerEntityTableReferences
                        ._sharedWithIdTable(db)
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

typedef $$PartnerEntityTableProcessedTableManager = i0.ProcessedTableManager<
    i0.GeneratedDatabase,
    i1.$PartnerEntityTable,
    i1.PartnerEntityData,
    i1.$$PartnerEntityTableFilterComposer,
    i1.$$PartnerEntityTableOrderingComposer,
    i1.$$PartnerEntityTableAnnotationComposer,
    $$PartnerEntityTableCreateCompanionBuilder,
    $$PartnerEntityTableUpdateCompanionBuilder,
    (i1.PartnerEntityData, i1.$$PartnerEntityTableReferences),
    i1.PartnerEntityData,
    i0.PrefetchHooks Function({bool sharedById, bool sharedWithId})>;

class $PartnerEntityTable extends i2.PartnerEntity
    with i0.TableInfo<$PartnerEntityTable, i1.PartnerEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $PartnerEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _sharedByIdMeta =
      const i0.VerificationMeta('sharedById');
  @override
  late final i0.GeneratedColumn<String> sharedById = i0.GeneratedColumn<String>(
      'shared_by_id', aliasedName, false,
      type: i0.DriftSqlType.string,
      requiredDuringInsert: true,
      defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
          'REFERENCES user_entity (id) ON DELETE CASCADE'));
  static const i0.VerificationMeta _sharedWithIdMeta =
      const i0.VerificationMeta('sharedWithId');
  @override
  late final i0.GeneratedColumn<String> sharedWithId =
      i0.GeneratedColumn<String>('shared_with_id', aliasedName, false,
          type: i0.DriftSqlType.string,
          requiredDuringInsert: true,
          defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
              'REFERENCES user_entity (id) ON DELETE CASCADE'));
  static const i0.VerificationMeta _inTimelineMeta =
      const i0.VerificationMeta('inTimeline');
  @override
  late final i0.GeneratedColumn<bool> inTimeline = i0.GeneratedColumn<bool>(
      'in_timeline', aliasedName, false,
      type: i0.DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
          'CHECK ("in_timeline" IN (0, 1))'),
      defaultValue: const i3.Constant(false));
  @override
  List<i0.GeneratedColumn> get $columns =>
      [sharedById, sharedWithId, inTimeline];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'partner_entity';
  @override
  i0.VerificationContext validateIntegrity(
      i0.Insertable<i1.PartnerEntityData> instance,
      {bool isInserting = false}) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('shared_by_id')) {
      context.handle(
          _sharedByIdMeta,
          sharedById.isAcceptableOrUnknown(
              data['shared_by_id']!, _sharedByIdMeta));
    } else if (isInserting) {
      context.missing(_sharedByIdMeta);
    }
    if (data.containsKey('shared_with_id')) {
      context.handle(
          _sharedWithIdMeta,
          sharedWithId.isAcceptableOrUnknown(
              data['shared_with_id']!, _sharedWithIdMeta));
    } else if (isInserting) {
      context.missing(_sharedWithIdMeta);
    }
    if (data.containsKey('in_timeline')) {
      context.handle(
          _inTimelineMeta,
          inTimeline.isAcceptableOrUnknown(
              data['in_timeline']!, _inTimelineMeta));
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {sharedById, sharedWithId};
  @override
  i1.PartnerEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.PartnerEntityData(
      sharedById: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.string, data['${effectivePrefix}shared_by_id'])!,
      sharedWithId: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.string, data['${effectivePrefix}shared_with_id'])!,
      inTimeline: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.bool, data['${effectivePrefix}in_timeline'])!,
    );
  }

  @override
  $PartnerEntityTable createAlias(String alias) {
    return $PartnerEntityTable(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class PartnerEntityData extends i0.DataClass
    implements i0.Insertable<i1.PartnerEntityData> {
  final String sharedById;
  final String sharedWithId;
  final bool inTimeline;
  const PartnerEntityData(
      {required this.sharedById,
      required this.sharedWithId,
      required this.inTimeline});
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['shared_by_id'] = i0.Variable<String>(sharedById);
    map['shared_with_id'] = i0.Variable<String>(sharedWithId);
    map['in_timeline'] = i0.Variable<bool>(inTimeline);
    return map;
  }

  factory PartnerEntityData.fromJson(Map<String, dynamic> json,
      {i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return PartnerEntityData(
      sharedById: serializer.fromJson<String>(json['sharedById']),
      sharedWithId: serializer.fromJson<String>(json['sharedWithId']),
      inTimeline: serializer.fromJson<bool>(json['inTimeline']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'sharedById': serializer.toJson<String>(sharedById),
      'sharedWithId': serializer.toJson<String>(sharedWithId),
      'inTimeline': serializer.toJson<bool>(inTimeline),
    };
  }

  i1.PartnerEntityData copyWith(
          {String? sharedById, String? sharedWithId, bool? inTimeline}) =>
      i1.PartnerEntityData(
        sharedById: sharedById ?? this.sharedById,
        sharedWithId: sharedWithId ?? this.sharedWithId,
        inTimeline: inTimeline ?? this.inTimeline,
      );
  PartnerEntityData copyWithCompanion(i1.PartnerEntityCompanion data) {
    return PartnerEntityData(
      sharedById:
          data.sharedById.present ? data.sharedById.value : this.sharedById,
      sharedWithId: data.sharedWithId.present
          ? data.sharedWithId.value
          : this.sharedWithId,
      inTimeline:
          data.inTimeline.present ? data.inTimeline.value : this.inTimeline,
    );
  }

  @override
  String toString() {
    return (StringBuffer('PartnerEntityData(')
          ..write('sharedById: $sharedById, ')
          ..write('sharedWithId: $sharedWithId, ')
          ..write('inTimeline: $inTimeline')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(sharedById, sharedWithId, inTimeline);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.PartnerEntityData &&
          other.sharedById == this.sharedById &&
          other.sharedWithId == this.sharedWithId &&
          other.inTimeline == this.inTimeline);
}

class PartnerEntityCompanion extends i0.UpdateCompanion<i1.PartnerEntityData> {
  final i0.Value<String> sharedById;
  final i0.Value<String> sharedWithId;
  final i0.Value<bool> inTimeline;
  const PartnerEntityCompanion({
    this.sharedById = const i0.Value.absent(),
    this.sharedWithId = const i0.Value.absent(),
    this.inTimeline = const i0.Value.absent(),
  });
  PartnerEntityCompanion.insert({
    required String sharedById,
    required String sharedWithId,
    this.inTimeline = const i0.Value.absent(),
  })  : sharedById = i0.Value(sharedById),
        sharedWithId = i0.Value(sharedWithId);
  static i0.Insertable<i1.PartnerEntityData> custom({
    i0.Expression<String>? sharedById,
    i0.Expression<String>? sharedWithId,
    i0.Expression<bool>? inTimeline,
  }) {
    return i0.RawValuesInsertable({
      if (sharedById != null) 'shared_by_id': sharedById,
      if (sharedWithId != null) 'shared_with_id': sharedWithId,
      if (inTimeline != null) 'in_timeline': inTimeline,
    });
  }

  i1.PartnerEntityCompanion copyWith(
      {i0.Value<String>? sharedById,
      i0.Value<String>? sharedWithId,
      i0.Value<bool>? inTimeline}) {
    return i1.PartnerEntityCompanion(
      sharedById: sharedById ?? this.sharedById,
      sharedWithId: sharedWithId ?? this.sharedWithId,
      inTimeline: inTimeline ?? this.inTimeline,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (sharedById.present) {
      map['shared_by_id'] = i0.Variable<String>(sharedById.value);
    }
    if (sharedWithId.present) {
      map['shared_with_id'] = i0.Variable<String>(sharedWithId.value);
    }
    if (inTimeline.present) {
      map['in_timeline'] = i0.Variable<bool>(inTimeline.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('PartnerEntityCompanion(')
          ..write('sharedById: $sharedById, ')
          ..write('sharedWithId: $sharedWithId, ')
          ..write('inTimeline: $inTimeline')
          ..write(')'))
        .toString();
  }
}
