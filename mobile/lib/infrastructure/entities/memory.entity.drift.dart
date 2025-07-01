// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/memory.entity.drift.dart'
    as i1;
import 'package:immich_mobile/domain/models/memory.model.dart' as i2;
import 'package:immich_mobile/infrastructure/entities/memory.entity.dart' as i3;
import 'package:drift/src/runtime/query_builder/query_builder.dart' as i4;
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart'
    as i5;
import 'package:drift/internal/modular.dart' as i6;

typedef $$MemoryEntityTableCreateCompanionBuilder = i1.MemoryEntityCompanion
    Function({
  required String id,
  i0.Value<DateTime> createdAt,
  i0.Value<DateTime> updatedAt,
  i0.Value<DateTime?> deletedAt,
  required String ownerId,
  required i2.MemoryTypeEnum type,
  required String data,
  i0.Value<bool> isSaved,
  required DateTime memoryAt,
  i0.Value<DateTime?> seenAt,
  i0.Value<DateTime?> showAt,
  i0.Value<DateTime?> hideAt,
});
typedef $$MemoryEntityTableUpdateCompanionBuilder = i1.MemoryEntityCompanion
    Function({
  i0.Value<String> id,
  i0.Value<DateTime> createdAt,
  i0.Value<DateTime> updatedAt,
  i0.Value<DateTime?> deletedAt,
  i0.Value<String> ownerId,
  i0.Value<i2.MemoryTypeEnum> type,
  i0.Value<String> data,
  i0.Value<bool> isSaved,
  i0.Value<DateTime> memoryAt,
  i0.Value<DateTime?> seenAt,
  i0.Value<DateTime?> showAt,
  i0.Value<DateTime?> hideAt,
});

final class $$MemoryEntityTableReferences extends i0.BaseReferences<
    i0.GeneratedDatabase, i1.$MemoryEntityTable, i1.MemoryEntityData> {
  $$MemoryEntityTableReferences(super.$_db, super.$_table, super.$_typedResult);

  static i5.$UserEntityTable _ownerIdTable(i0.GeneratedDatabase db) =>
      i6.ReadDatabaseContainer(db)
          .resultSet<i5.$UserEntityTable>('user_entity')
          .createAlias(i0.$_aliasNameGenerator(
              i6.ReadDatabaseContainer(db)
                  .resultSet<i1.$MemoryEntityTable>('memory_entity')
                  .ownerId,
              i6.ReadDatabaseContainer(db)
                  .resultSet<i5.$UserEntityTable>('user_entity')
                  .id));

  i5.$$UserEntityTableProcessedTableManager get ownerId {
    final $_column = $_itemColumn<String>('owner_id')!;

    final manager = i5
        .$$UserEntityTableTableManager(
            $_db,
            i6.ReadDatabaseContainer($_db)
                .resultSet<i5.$UserEntityTable>('user_entity'))
        .filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_ownerIdTable($_db));
    if (item == null) return manager;
    return i0.ProcessedTableManager(
        manager.$state.copyWith(prefetchedData: [item]));
  }
}

class $$MemoryEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$MemoryEntityTable> {
  $$MemoryEntityTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<DateTime> get deletedAt => $composableBuilder(
      column: $table.deletedAt, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnWithTypeConverterFilters<i2.MemoryTypeEnum, i2.MemoryTypeEnum, int>
      get type => $composableBuilder(
          column: $table.type,
          builder: (column) => i0.ColumnWithTypeConverterFilters(column));

  i0.ColumnFilters<String> get data => $composableBuilder(
      column: $table.data, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<bool> get isSaved => $composableBuilder(
      column: $table.isSaved, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<DateTime> get memoryAt => $composableBuilder(
      column: $table.memoryAt, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<DateTime> get seenAt => $composableBuilder(
      column: $table.seenAt, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<DateTime> get showAt => $composableBuilder(
      column: $table.showAt, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<DateTime> get hideAt => $composableBuilder(
      column: $table.hideAt, builder: (column) => i0.ColumnFilters(column));

  i5.$$UserEntityTableFilterComposer get ownerId {
    final i5.$$UserEntityTableFilterComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.ownerId,
        referencedTable: i6.ReadDatabaseContainer($db)
            .resultSet<i5.$UserEntityTable>('user_entity'),
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            i5.$$UserEntityTableFilterComposer(
              $db: $db,
              $table: i6.ReadDatabaseContainer($db)
                  .resultSet<i5.$UserEntityTable>('user_entity'),
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$MemoryEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$MemoryEntityTable> {
  $$MemoryEntityTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<DateTime> get deletedAt => $composableBuilder(
      column: $table.deletedAt,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<int> get type => $composableBuilder(
      column: $table.type, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get data => $composableBuilder(
      column: $table.data, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<bool> get isSaved => $composableBuilder(
      column: $table.isSaved, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<DateTime> get memoryAt => $composableBuilder(
      column: $table.memoryAt, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<DateTime> get seenAt => $composableBuilder(
      column: $table.seenAt, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<DateTime> get showAt => $composableBuilder(
      column: $table.showAt, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<DateTime> get hideAt => $composableBuilder(
      column: $table.hideAt, builder: (column) => i0.ColumnOrderings(column));

  i5.$$UserEntityTableOrderingComposer get ownerId {
    final i5.$$UserEntityTableOrderingComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.ownerId,
        referencedTable: i6.ReadDatabaseContainer($db)
            .resultSet<i5.$UserEntityTable>('user_entity'),
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            i5.$$UserEntityTableOrderingComposer(
              $db: $db,
              $table: i6.ReadDatabaseContainer($db)
                  .resultSet<i5.$UserEntityTable>('user_entity'),
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$MemoryEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$MemoryEntityTable> {
  $$MemoryEntityTableAnnotationComposer({
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

  i0.GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get deletedAt =>
      $composableBuilder(column: $table.deletedAt, builder: (column) => column);

  i0.GeneratedColumnWithTypeConverter<i2.MemoryTypeEnum, int> get type =>
      $composableBuilder(column: $table.type, builder: (column) => column);

  i0.GeneratedColumn<String> get data =>
      $composableBuilder(column: $table.data, builder: (column) => column);

  i0.GeneratedColumn<bool> get isSaved =>
      $composableBuilder(column: $table.isSaved, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get memoryAt =>
      $composableBuilder(column: $table.memoryAt, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get seenAt =>
      $composableBuilder(column: $table.seenAt, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get showAt =>
      $composableBuilder(column: $table.showAt, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get hideAt =>
      $composableBuilder(column: $table.hideAt, builder: (column) => column);

  i5.$$UserEntityTableAnnotationComposer get ownerId {
    final i5.$$UserEntityTableAnnotationComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.ownerId,
        referencedTable: i6.ReadDatabaseContainer($db)
            .resultSet<i5.$UserEntityTable>('user_entity'),
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            i5.$$UserEntityTableAnnotationComposer(
              $db: $db,
              $table: i6.ReadDatabaseContainer($db)
                  .resultSet<i5.$UserEntityTable>('user_entity'),
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$MemoryEntityTableTableManager extends i0.RootTableManager<
    i0.GeneratedDatabase,
    i1.$MemoryEntityTable,
    i1.MemoryEntityData,
    i1.$$MemoryEntityTableFilterComposer,
    i1.$$MemoryEntityTableOrderingComposer,
    i1.$$MemoryEntityTableAnnotationComposer,
    $$MemoryEntityTableCreateCompanionBuilder,
    $$MemoryEntityTableUpdateCompanionBuilder,
    (i1.MemoryEntityData, i1.$$MemoryEntityTableReferences),
    i1.MemoryEntityData,
    i0.PrefetchHooks Function({bool ownerId})> {
  $$MemoryEntityTableTableManager(
      i0.GeneratedDatabase db, i1.$MemoryEntityTable table)
      : super(i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$MemoryEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              i1.$$MemoryEntityTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              i1.$$MemoryEntityTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            i0.Value<String> id = const i0.Value.absent(),
            i0.Value<DateTime> createdAt = const i0.Value.absent(),
            i0.Value<DateTime> updatedAt = const i0.Value.absent(),
            i0.Value<DateTime?> deletedAt = const i0.Value.absent(),
            i0.Value<String> ownerId = const i0.Value.absent(),
            i0.Value<i2.MemoryTypeEnum> type = const i0.Value.absent(),
            i0.Value<String> data = const i0.Value.absent(),
            i0.Value<bool> isSaved = const i0.Value.absent(),
            i0.Value<DateTime> memoryAt = const i0.Value.absent(),
            i0.Value<DateTime?> seenAt = const i0.Value.absent(),
            i0.Value<DateTime?> showAt = const i0.Value.absent(),
            i0.Value<DateTime?> hideAt = const i0.Value.absent(),
          }) =>
              i1.MemoryEntityCompanion(
            id: id,
            createdAt: createdAt,
            updatedAt: updatedAt,
            deletedAt: deletedAt,
            ownerId: ownerId,
            type: type,
            data: data,
            isSaved: isSaved,
            memoryAt: memoryAt,
            seenAt: seenAt,
            showAt: showAt,
            hideAt: hideAt,
          ),
          createCompanionCallback: ({
            required String id,
            i0.Value<DateTime> createdAt = const i0.Value.absent(),
            i0.Value<DateTime> updatedAt = const i0.Value.absent(),
            i0.Value<DateTime?> deletedAt = const i0.Value.absent(),
            required String ownerId,
            required i2.MemoryTypeEnum type,
            required String data,
            i0.Value<bool> isSaved = const i0.Value.absent(),
            required DateTime memoryAt,
            i0.Value<DateTime?> seenAt = const i0.Value.absent(),
            i0.Value<DateTime?> showAt = const i0.Value.absent(),
            i0.Value<DateTime?> hideAt = const i0.Value.absent(),
          }) =>
              i1.MemoryEntityCompanion.insert(
            id: id,
            createdAt: createdAt,
            updatedAt: updatedAt,
            deletedAt: deletedAt,
            ownerId: ownerId,
            type: type,
            data: data,
            isSaved: isSaved,
            memoryAt: memoryAt,
            seenAt: seenAt,
            showAt: showAt,
            hideAt: hideAt,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (
                    e.readTable(table),
                    i1.$$MemoryEntityTableReferences(db, table, e)
                  ))
              .toList(),
          prefetchHooksCallback: ({ownerId = false}) {
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
                if (ownerId) {
                  state = state.withJoin(
                    currentTable: table,
                    currentColumn: table.ownerId,
                    referencedTable:
                        i1.$$MemoryEntityTableReferences._ownerIdTable(db),
                    referencedColumn:
                        i1.$$MemoryEntityTableReferences._ownerIdTable(db).id,
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

typedef $$MemoryEntityTableProcessedTableManager = i0.ProcessedTableManager<
    i0.GeneratedDatabase,
    i1.$MemoryEntityTable,
    i1.MemoryEntityData,
    i1.$$MemoryEntityTableFilterComposer,
    i1.$$MemoryEntityTableOrderingComposer,
    i1.$$MemoryEntityTableAnnotationComposer,
    $$MemoryEntityTableCreateCompanionBuilder,
    $$MemoryEntityTableUpdateCompanionBuilder,
    (i1.MemoryEntityData, i1.$$MemoryEntityTableReferences),
    i1.MemoryEntityData,
    i0.PrefetchHooks Function({bool ownerId})>;

class $MemoryEntityTable extends i3.MemoryEntity
    with i0.TableInfo<$MemoryEntityTable, i1.MemoryEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $MemoryEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _idMeta = const i0.VerificationMeta('id');
  @override
  late final i0.GeneratedColumn<String> id = i0.GeneratedColumn<String>(
      'id', aliasedName, false,
      type: i0.DriftSqlType.string, requiredDuringInsert: true);
  static const i0.VerificationMeta _createdAtMeta =
      const i0.VerificationMeta('createdAt');
  @override
  late final i0.GeneratedColumn<DateTime> createdAt =
      i0.GeneratedColumn<DateTime>('created_at', aliasedName, false,
          type: i0.DriftSqlType.dateTime,
          requiredDuringInsert: false,
          defaultValue: i4.currentDateAndTime);
  static const i0.VerificationMeta _updatedAtMeta =
      const i0.VerificationMeta('updatedAt');
  @override
  late final i0.GeneratedColumn<DateTime> updatedAt =
      i0.GeneratedColumn<DateTime>('updated_at', aliasedName, false,
          type: i0.DriftSqlType.dateTime,
          requiredDuringInsert: false,
          defaultValue: i4.currentDateAndTime);
  static const i0.VerificationMeta _deletedAtMeta =
      const i0.VerificationMeta('deletedAt');
  @override
  late final i0.GeneratedColumn<DateTime> deletedAt =
      i0.GeneratedColumn<DateTime>('deleted_at', aliasedName, true,
          type: i0.DriftSqlType.dateTime, requiredDuringInsert: false);
  static const i0.VerificationMeta _ownerIdMeta =
      const i0.VerificationMeta('ownerId');
  @override
  late final i0.GeneratedColumn<String> ownerId = i0.GeneratedColumn<String>(
      'owner_id', aliasedName, false,
      type: i0.DriftSqlType.string,
      requiredDuringInsert: true,
      defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
          'REFERENCES user_entity (id) ON DELETE CASCADE'));
  @override
  late final i0.GeneratedColumnWithTypeConverter<i2.MemoryTypeEnum, int> type =
      i0.GeneratedColumn<int>('type', aliasedName, false,
              type: i0.DriftSqlType.int, requiredDuringInsert: true)
          .withConverter<i2.MemoryTypeEnum>(
              i1.$MemoryEntityTable.$convertertype);
  static const i0.VerificationMeta _dataMeta =
      const i0.VerificationMeta('data');
  @override
  late final i0.GeneratedColumn<String> data = i0.GeneratedColumn<String>(
      'data', aliasedName, false,
      type: i0.DriftSqlType.string, requiredDuringInsert: true);
  static const i0.VerificationMeta _isSavedMeta =
      const i0.VerificationMeta('isSaved');
  @override
  late final i0.GeneratedColumn<bool> isSaved = i0.GeneratedColumn<bool>(
      'is_saved', aliasedName, false,
      type: i0.DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints:
          i0.GeneratedColumn.constraintIsAlways('CHECK ("is_saved" IN (0, 1))'),
      defaultValue: const i4.Constant(false));
  static const i0.VerificationMeta _memoryAtMeta =
      const i0.VerificationMeta('memoryAt');
  @override
  late final i0.GeneratedColumn<DateTime> memoryAt =
      i0.GeneratedColumn<DateTime>('memory_at', aliasedName, false,
          type: i0.DriftSqlType.dateTime, requiredDuringInsert: true);
  static const i0.VerificationMeta _seenAtMeta =
      const i0.VerificationMeta('seenAt');
  @override
  late final i0.GeneratedColumn<DateTime> seenAt = i0.GeneratedColumn<DateTime>(
      'seen_at', aliasedName, true,
      type: i0.DriftSqlType.dateTime, requiredDuringInsert: false);
  static const i0.VerificationMeta _showAtMeta =
      const i0.VerificationMeta('showAt');
  @override
  late final i0.GeneratedColumn<DateTime> showAt = i0.GeneratedColumn<DateTime>(
      'show_at', aliasedName, true,
      type: i0.DriftSqlType.dateTime, requiredDuringInsert: false);
  static const i0.VerificationMeta _hideAtMeta =
      const i0.VerificationMeta('hideAt');
  @override
  late final i0.GeneratedColumn<DateTime> hideAt = i0.GeneratedColumn<DateTime>(
      'hide_at', aliasedName, true,
      type: i0.DriftSqlType.dateTime, requiredDuringInsert: false);
  @override
  List<i0.GeneratedColumn> get $columns => [
        id,
        createdAt,
        updatedAt,
        deletedAt,
        ownerId,
        type,
        data,
        isSaved,
        memoryAt,
        seenAt,
        showAt,
        hideAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'memory_entity';
  @override
  i0.VerificationContext validateIntegrity(
      i0.Insertable<i1.MemoryEntityData> instance,
      {bool isInserting = false}) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    if (data.containsKey('deleted_at')) {
      context.handle(_deletedAtMeta,
          deletedAt.isAcceptableOrUnknown(data['deleted_at']!, _deletedAtMeta));
    }
    if (data.containsKey('owner_id')) {
      context.handle(_ownerIdMeta,
          ownerId.isAcceptableOrUnknown(data['owner_id']!, _ownerIdMeta));
    } else if (isInserting) {
      context.missing(_ownerIdMeta);
    }
    if (data.containsKey('data')) {
      context.handle(
          _dataMeta, this.data.isAcceptableOrUnknown(data['data']!, _dataMeta));
    } else if (isInserting) {
      context.missing(_dataMeta);
    }
    if (data.containsKey('is_saved')) {
      context.handle(_isSavedMeta,
          isSaved.isAcceptableOrUnknown(data['is_saved']!, _isSavedMeta));
    }
    if (data.containsKey('memory_at')) {
      context.handle(_memoryAtMeta,
          memoryAt.isAcceptableOrUnknown(data['memory_at']!, _memoryAtMeta));
    } else if (isInserting) {
      context.missing(_memoryAtMeta);
    }
    if (data.containsKey('seen_at')) {
      context.handle(_seenAtMeta,
          seenAt.isAcceptableOrUnknown(data['seen_at']!, _seenAtMeta));
    }
    if (data.containsKey('show_at')) {
      context.handle(_showAtMeta,
          showAt.isAcceptableOrUnknown(data['show_at']!, _showAtMeta));
    }
    if (data.containsKey('hide_at')) {
      context.handle(_hideAtMeta,
          hideAt.isAcceptableOrUnknown(data['hide_at']!, _hideAtMeta));
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {id};
  @override
  i1.MemoryEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.MemoryEntityData(
      id: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}id'])!,
      createdAt: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      updatedAt: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
      deletedAt: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.dateTime, data['${effectivePrefix}deleted_at']),
      ownerId: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}owner_id'])!,
      type: i1.$MemoryEntityTable.$convertertype.fromSql(attachedDatabase
          .typeMapping
          .read(i0.DriftSqlType.int, data['${effectivePrefix}type'])!),
      data: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}data'])!,
      isSaved: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.bool, data['${effectivePrefix}is_saved'])!,
      memoryAt: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.dateTime, data['${effectivePrefix}memory_at'])!,
      seenAt: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.dateTime, data['${effectivePrefix}seen_at']),
      showAt: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.dateTime, data['${effectivePrefix}show_at']),
      hideAt: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.dateTime, data['${effectivePrefix}hide_at']),
    );
  }

  @override
  $MemoryEntityTable createAlias(String alias) {
    return $MemoryEntityTable(attachedDatabase, alias);
  }

  static i0.JsonTypeConverter2<i2.MemoryTypeEnum, int, int> $convertertype =
      const i0.EnumIndexConverter<i2.MemoryTypeEnum>(i2.MemoryTypeEnum.values);
  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class MemoryEntityData extends i0.DataClass
    implements i0.Insertable<i1.MemoryEntityData> {
  final String id;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? deletedAt;
  final String ownerId;
  final i2.MemoryTypeEnum type;
  final String data;
  final bool isSaved;
  final DateTime memoryAt;
  final DateTime? seenAt;
  final DateTime? showAt;
  final DateTime? hideAt;
  const MemoryEntityData(
      {required this.id,
      required this.createdAt,
      required this.updatedAt,
      this.deletedAt,
      required this.ownerId,
      required this.type,
      required this.data,
      required this.isSaved,
      required this.memoryAt,
      this.seenAt,
      this.showAt,
      this.hideAt});
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['id'] = i0.Variable<String>(id);
    map['created_at'] = i0.Variable<DateTime>(createdAt);
    map['updated_at'] = i0.Variable<DateTime>(updatedAt);
    if (!nullToAbsent || deletedAt != null) {
      map['deleted_at'] = i0.Variable<DateTime>(deletedAt);
    }
    map['owner_id'] = i0.Variable<String>(ownerId);
    {
      map['type'] =
          i0.Variable<int>(i1.$MemoryEntityTable.$convertertype.toSql(type));
    }
    map['data'] = i0.Variable<String>(data);
    map['is_saved'] = i0.Variable<bool>(isSaved);
    map['memory_at'] = i0.Variable<DateTime>(memoryAt);
    if (!nullToAbsent || seenAt != null) {
      map['seen_at'] = i0.Variable<DateTime>(seenAt);
    }
    if (!nullToAbsent || showAt != null) {
      map['show_at'] = i0.Variable<DateTime>(showAt);
    }
    if (!nullToAbsent || hideAt != null) {
      map['hide_at'] = i0.Variable<DateTime>(hideAt);
    }
    return map;
  }

  factory MemoryEntityData.fromJson(Map<String, dynamic> json,
      {i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return MemoryEntityData(
      id: serializer.fromJson<String>(json['id']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      deletedAt: serializer.fromJson<DateTime?>(json['deletedAt']),
      ownerId: serializer.fromJson<String>(json['ownerId']),
      type: i1.$MemoryEntityTable.$convertertype
          .fromJson(serializer.fromJson<int>(json['type'])),
      data: serializer.fromJson<String>(json['data']),
      isSaved: serializer.fromJson<bool>(json['isSaved']),
      memoryAt: serializer.fromJson<DateTime>(json['memoryAt']),
      seenAt: serializer.fromJson<DateTime?>(json['seenAt']),
      showAt: serializer.fromJson<DateTime?>(json['showAt']),
      hideAt: serializer.fromJson<DateTime?>(json['hideAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'deletedAt': serializer.toJson<DateTime?>(deletedAt),
      'ownerId': serializer.toJson<String>(ownerId),
      'type': serializer
          .toJson<int>(i1.$MemoryEntityTable.$convertertype.toJson(type)),
      'data': serializer.toJson<String>(data),
      'isSaved': serializer.toJson<bool>(isSaved),
      'memoryAt': serializer.toJson<DateTime>(memoryAt),
      'seenAt': serializer.toJson<DateTime?>(seenAt),
      'showAt': serializer.toJson<DateTime?>(showAt),
      'hideAt': serializer.toJson<DateTime?>(hideAt),
    };
  }

  i1.MemoryEntityData copyWith(
          {String? id,
          DateTime? createdAt,
          DateTime? updatedAt,
          i0.Value<DateTime?> deletedAt = const i0.Value.absent(),
          String? ownerId,
          i2.MemoryTypeEnum? type,
          String? data,
          bool? isSaved,
          DateTime? memoryAt,
          i0.Value<DateTime?> seenAt = const i0.Value.absent(),
          i0.Value<DateTime?> showAt = const i0.Value.absent(),
          i0.Value<DateTime?> hideAt = const i0.Value.absent()}) =>
      i1.MemoryEntityData(
        id: id ?? this.id,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
        deletedAt: deletedAt.present ? deletedAt.value : this.deletedAt,
        ownerId: ownerId ?? this.ownerId,
        type: type ?? this.type,
        data: data ?? this.data,
        isSaved: isSaved ?? this.isSaved,
        memoryAt: memoryAt ?? this.memoryAt,
        seenAt: seenAt.present ? seenAt.value : this.seenAt,
        showAt: showAt.present ? showAt.value : this.showAt,
        hideAt: hideAt.present ? hideAt.value : this.hideAt,
      );
  MemoryEntityData copyWithCompanion(i1.MemoryEntityCompanion data) {
    return MemoryEntityData(
      id: data.id.present ? data.id.value : this.id,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      deletedAt: data.deletedAt.present ? data.deletedAt.value : this.deletedAt,
      ownerId: data.ownerId.present ? data.ownerId.value : this.ownerId,
      type: data.type.present ? data.type.value : this.type,
      data: data.data.present ? data.data.value : this.data,
      isSaved: data.isSaved.present ? data.isSaved.value : this.isSaved,
      memoryAt: data.memoryAt.present ? data.memoryAt.value : this.memoryAt,
      seenAt: data.seenAt.present ? data.seenAt.value : this.seenAt,
      showAt: data.showAt.present ? data.showAt.value : this.showAt,
      hideAt: data.hideAt.present ? data.hideAt.value : this.hideAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('MemoryEntityData(')
          ..write('id: $id, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('deletedAt: $deletedAt, ')
          ..write('ownerId: $ownerId, ')
          ..write('type: $type, ')
          ..write('data: $data, ')
          ..write('isSaved: $isSaved, ')
          ..write('memoryAt: $memoryAt, ')
          ..write('seenAt: $seenAt, ')
          ..write('showAt: $showAt, ')
          ..write('hideAt: $hideAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, createdAt, updatedAt, deletedAt, ownerId,
      type, data, isSaved, memoryAt, seenAt, showAt, hideAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.MemoryEntityData &&
          other.id == this.id &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt &&
          other.deletedAt == this.deletedAt &&
          other.ownerId == this.ownerId &&
          other.type == this.type &&
          other.data == this.data &&
          other.isSaved == this.isSaved &&
          other.memoryAt == this.memoryAt &&
          other.seenAt == this.seenAt &&
          other.showAt == this.showAt &&
          other.hideAt == this.hideAt);
}

class MemoryEntityCompanion extends i0.UpdateCompanion<i1.MemoryEntityData> {
  final i0.Value<String> id;
  final i0.Value<DateTime> createdAt;
  final i0.Value<DateTime> updatedAt;
  final i0.Value<DateTime?> deletedAt;
  final i0.Value<String> ownerId;
  final i0.Value<i2.MemoryTypeEnum> type;
  final i0.Value<String> data;
  final i0.Value<bool> isSaved;
  final i0.Value<DateTime> memoryAt;
  final i0.Value<DateTime?> seenAt;
  final i0.Value<DateTime?> showAt;
  final i0.Value<DateTime?> hideAt;
  const MemoryEntityCompanion({
    this.id = const i0.Value.absent(),
    this.createdAt = const i0.Value.absent(),
    this.updatedAt = const i0.Value.absent(),
    this.deletedAt = const i0.Value.absent(),
    this.ownerId = const i0.Value.absent(),
    this.type = const i0.Value.absent(),
    this.data = const i0.Value.absent(),
    this.isSaved = const i0.Value.absent(),
    this.memoryAt = const i0.Value.absent(),
    this.seenAt = const i0.Value.absent(),
    this.showAt = const i0.Value.absent(),
    this.hideAt = const i0.Value.absent(),
  });
  MemoryEntityCompanion.insert({
    required String id,
    this.createdAt = const i0.Value.absent(),
    this.updatedAt = const i0.Value.absent(),
    this.deletedAt = const i0.Value.absent(),
    required String ownerId,
    required i2.MemoryTypeEnum type,
    required String data,
    this.isSaved = const i0.Value.absent(),
    required DateTime memoryAt,
    this.seenAt = const i0.Value.absent(),
    this.showAt = const i0.Value.absent(),
    this.hideAt = const i0.Value.absent(),
  })  : id = i0.Value(id),
        ownerId = i0.Value(ownerId),
        type = i0.Value(type),
        data = i0.Value(data),
        memoryAt = i0.Value(memoryAt);
  static i0.Insertable<i1.MemoryEntityData> custom({
    i0.Expression<String>? id,
    i0.Expression<DateTime>? createdAt,
    i0.Expression<DateTime>? updatedAt,
    i0.Expression<DateTime>? deletedAt,
    i0.Expression<String>? ownerId,
    i0.Expression<int>? type,
    i0.Expression<String>? data,
    i0.Expression<bool>? isSaved,
    i0.Expression<DateTime>? memoryAt,
    i0.Expression<DateTime>? seenAt,
    i0.Expression<DateTime>? showAt,
    i0.Expression<DateTime>? hideAt,
  }) {
    return i0.RawValuesInsertable({
      if (id != null) 'id': id,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (deletedAt != null) 'deleted_at': deletedAt,
      if (ownerId != null) 'owner_id': ownerId,
      if (type != null) 'type': type,
      if (data != null) 'data': data,
      if (isSaved != null) 'is_saved': isSaved,
      if (memoryAt != null) 'memory_at': memoryAt,
      if (seenAt != null) 'seen_at': seenAt,
      if (showAt != null) 'show_at': showAt,
      if (hideAt != null) 'hide_at': hideAt,
    });
  }

  i1.MemoryEntityCompanion copyWith(
      {i0.Value<String>? id,
      i0.Value<DateTime>? createdAt,
      i0.Value<DateTime>? updatedAt,
      i0.Value<DateTime?>? deletedAt,
      i0.Value<String>? ownerId,
      i0.Value<i2.MemoryTypeEnum>? type,
      i0.Value<String>? data,
      i0.Value<bool>? isSaved,
      i0.Value<DateTime>? memoryAt,
      i0.Value<DateTime?>? seenAt,
      i0.Value<DateTime?>? showAt,
      i0.Value<DateTime?>? hideAt}) {
    return i1.MemoryEntityCompanion(
      id: id ?? this.id,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      deletedAt: deletedAt ?? this.deletedAt,
      ownerId: ownerId ?? this.ownerId,
      type: type ?? this.type,
      data: data ?? this.data,
      isSaved: isSaved ?? this.isSaved,
      memoryAt: memoryAt ?? this.memoryAt,
      seenAt: seenAt ?? this.seenAt,
      showAt: showAt ?? this.showAt,
      hideAt: hideAt ?? this.hideAt,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (id.present) {
      map['id'] = i0.Variable<String>(id.value);
    }
    if (createdAt.present) {
      map['created_at'] = i0.Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = i0.Variable<DateTime>(updatedAt.value);
    }
    if (deletedAt.present) {
      map['deleted_at'] = i0.Variable<DateTime>(deletedAt.value);
    }
    if (ownerId.present) {
      map['owner_id'] = i0.Variable<String>(ownerId.value);
    }
    if (type.present) {
      map['type'] = i0.Variable<int>(
          i1.$MemoryEntityTable.$convertertype.toSql(type.value));
    }
    if (data.present) {
      map['data'] = i0.Variable<String>(data.value);
    }
    if (isSaved.present) {
      map['is_saved'] = i0.Variable<bool>(isSaved.value);
    }
    if (memoryAt.present) {
      map['memory_at'] = i0.Variable<DateTime>(memoryAt.value);
    }
    if (seenAt.present) {
      map['seen_at'] = i0.Variable<DateTime>(seenAt.value);
    }
    if (showAt.present) {
      map['show_at'] = i0.Variable<DateTime>(showAt.value);
    }
    if (hideAt.present) {
      map['hide_at'] = i0.Variable<DateTime>(hideAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('MemoryEntityCompanion(')
          ..write('id: $id, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('deletedAt: $deletedAt, ')
          ..write('ownerId: $ownerId, ')
          ..write('type: $type, ')
          ..write('data: $data, ')
          ..write('isSaved: $isSaved, ')
          ..write('memoryAt: $memoryAt, ')
          ..write('seenAt: $seenAt, ')
          ..write('showAt: $showAt, ')
          ..write('hideAt: $hideAt')
          ..write(')'))
        .toString();
  }
}
