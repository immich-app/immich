// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.drift.dart'
    as i1;
import 'package:immich_mobile/domain/models/album/album.model.dart' as i2;
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.dart'
    as i3;
import 'package:drift/src/runtime/query_builder/query_builder.dart' as i4;
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart'
    as i5;
import 'package:drift/internal/modular.dart' as i6;
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart'
    as i7;

typedef $$RemoteAlbumEntityTableCreateCompanionBuilder
    = i1.RemoteAlbumEntityCompanion Function({
  required String id,
  required String name,
  required String description,
  i0.Value<DateTime> createdAt,
  i0.Value<DateTime> updatedAt,
  required String ownerId,
  i0.Value<String?> thumbnailAssetId,
  i0.Value<bool> isActivityEnabled,
  required i2.AssetOrder order,
});
typedef $$RemoteAlbumEntityTableUpdateCompanionBuilder
    = i1.RemoteAlbumEntityCompanion Function({
  i0.Value<String> id,
  i0.Value<String> name,
  i0.Value<String> description,
  i0.Value<DateTime> createdAt,
  i0.Value<DateTime> updatedAt,
  i0.Value<String> ownerId,
  i0.Value<String?> thumbnailAssetId,
  i0.Value<bool> isActivityEnabled,
  i0.Value<i2.AssetOrder> order,
});

final class $$RemoteAlbumEntityTableReferences extends i0.BaseReferences<
    i0.GeneratedDatabase,
    i1.$RemoteAlbumEntityTable,
    i1.RemoteAlbumEntityData> {
  $$RemoteAlbumEntityTableReferences(
      super.$_db, super.$_table, super.$_typedResult);

  static i5.$UserEntityTable _ownerIdTable(i0.GeneratedDatabase db) =>
      i6.ReadDatabaseContainer(db)
          .resultSet<i5.$UserEntityTable>('user_entity')
          .createAlias(i0.$_aliasNameGenerator(
              i6.ReadDatabaseContainer(db)
                  .resultSet<i1.$RemoteAlbumEntityTable>('remote_album_entity')
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

  static i7.$RemoteAssetEntityTable _thumbnailAssetIdTable(
          i0.GeneratedDatabase db) =>
      i6.ReadDatabaseContainer(db)
          .resultSet<i7.$RemoteAssetEntityTable>('remote_asset_entity')
          .createAlias(i0.$_aliasNameGenerator(
              i6.ReadDatabaseContainer(db)
                  .resultSet<i1.$RemoteAlbumEntityTable>('remote_album_entity')
                  .thumbnailAssetId,
              i6.ReadDatabaseContainer(db)
                  .resultSet<i7.$RemoteAssetEntityTable>('remote_asset_entity')
                  .id));

  i7.$$RemoteAssetEntityTableProcessedTableManager? get thumbnailAssetId {
    final $_column = $_itemColumn<String>('thumbnail_asset_id');
    if ($_column == null) return null;
    final manager = i7
        .$$RemoteAssetEntityTableTableManager(
            $_db,
            i6.ReadDatabaseContainer($_db)
                .resultSet<i7.$RemoteAssetEntityTable>('remote_asset_entity'))
        .filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_thumbnailAssetIdTable($_db));
    if (item == null) return manager;
    return i0.ProcessedTableManager(
        manager.$state.copyWith(prefetchedData: [item]));
  }
}

class $$RemoteAlbumEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$RemoteAlbumEntityTable> {
  $$RemoteAlbumEntityTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get description => $composableBuilder(
      column: $table.description,
      builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<bool> get isActivityEnabled => $composableBuilder(
      column: $table.isActivityEnabled,
      builder: (column) => i0.ColumnFilters(column));

  i0.ColumnWithTypeConverterFilters<i2.AssetOrder, i2.AssetOrder, int>
      get order => $composableBuilder(
          column: $table.order,
          builder: (column) => i0.ColumnWithTypeConverterFilters(column));

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

  i7.$$RemoteAssetEntityTableFilterComposer get thumbnailAssetId {
    final i7.$$RemoteAssetEntityTableFilterComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.thumbnailAssetId,
        referencedTable: i6.ReadDatabaseContainer($db)
            .resultSet<i7.$RemoteAssetEntityTable>('remote_asset_entity'),
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            i7.$$RemoteAssetEntityTableFilterComposer(
              $db: $db,
              $table: i6.ReadDatabaseContainer($db)
                  .resultSet<i7.$RemoteAssetEntityTable>('remote_asset_entity'),
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$RemoteAlbumEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$RemoteAlbumEntityTable> {
  $$RemoteAlbumEntityTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get description => $composableBuilder(
      column: $table.description,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<bool> get isActivityEnabled => $composableBuilder(
      column: $table.isActivityEnabled,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<int> get order => $composableBuilder(
      column: $table.order, builder: (column) => i0.ColumnOrderings(column));

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

  i7.$$RemoteAssetEntityTableOrderingComposer get thumbnailAssetId {
    final i7.$$RemoteAssetEntityTableOrderingComposer composer =
        $composerBuilder(
            composer: this,
            getCurrentColumn: (t) => t.thumbnailAssetId,
            referencedTable: i6.ReadDatabaseContainer($db)
                .resultSet<i7.$RemoteAssetEntityTable>('remote_asset_entity'),
            getReferencedColumn: (t) => t.id,
            builder: (joinBuilder,
                    {$addJoinBuilderToRootComposer,
                    $removeJoinBuilderFromRootComposer}) =>
                i7.$$RemoteAssetEntityTableOrderingComposer(
                  $db: $db,
                  $table: i6.ReadDatabaseContainer($db)
                      .resultSet<i7.$RemoteAssetEntityTable>(
                          'remote_asset_entity'),
                  $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                  joinBuilder: joinBuilder,
                  $removeJoinBuilderFromRootComposer:
                      $removeJoinBuilderFromRootComposer,
                ));
    return composer;
  }
}

class $$RemoteAlbumEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$RemoteAlbumEntityTable> {
  $$RemoteAlbumEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  i0.GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  i0.GeneratedColumn<String> get description => $composableBuilder(
      column: $table.description, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  i0.GeneratedColumn<bool> get isActivityEnabled => $composableBuilder(
      column: $table.isActivityEnabled, builder: (column) => column);

  i0.GeneratedColumnWithTypeConverter<i2.AssetOrder, int> get order =>
      $composableBuilder(column: $table.order, builder: (column) => column);

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

  i7.$$RemoteAssetEntityTableAnnotationComposer get thumbnailAssetId {
    final i7.$$RemoteAssetEntityTableAnnotationComposer composer =
        $composerBuilder(
            composer: this,
            getCurrentColumn: (t) => t.thumbnailAssetId,
            referencedTable: i6.ReadDatabaseContainer($db)
                .resultSet<i7.$RemoteAssetEntityTable>('remote_asset_entity'),
            getReferencedColumn: (t) => t.id,
            builder: (joinBuilder,
                    {$addJoinBuilderToRootComposer,
                    $removeJoinBuilderFromRootComposer}) =>
                i7.$$RemoteAssetEntityTableAnnotationComposer(
                  $db: $db,
                  $table: i6.ReadDatabaseContainer($db)
                      .resultSet<i7.$RemoteAssetEntityTable>(
                          'remote_asset_entity'),
                  $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                  joinBuilder: joinBuilder,
                  $removeJoinBuilderFromRootComposer:
                      $removeJoinBuilderFromRootComposer,
                ));
    return composer;
  }
}

class $$RemoteAlbumEntityTableTableManager extends i0.RootTableManager<
    i0.GeneratedDatabase,
    i1.$RemoteAlbumEntityTable,
    i1.RemoteAlbumEntityData,
    i1.$$RemoteAlbumEntityTableFilterComposer,
    i1.$$RemoteAlbumEntityTableOrderingComposer,
    i1.$$RemoteAlbumEntityTableAnnotationComposer,
    $$RemoteAlbumEntityTableCreateCompanionBuilder,
    $$RemoteAlbumEntityTableUpdateCompanionBuilder,
    (i1.RemoteAlbumEntityData, i1.$$RemoteAlbumEntityTableReferences),
    i1.RemoteAlbumEntityData,
    i0.PrefetchHooks Function({bool ownerId, bool thumbnailAssetId})> {
  $$RemoteAlbumEntityTableTableManager(
      i0.GeneratedDatabase db, i1.$RemoteAlbumEntityTable table)
      : super(i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$RemoteAlbumEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () => i1
              .$$RemoteAlbumEntityTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              i1.$$RemoteAlbumEntityTableAnnotationComposer(
                  $db: db, $table: table),
          updateCompanionCallback: ({
            i0.Value<String> id = const i0.Value.absent(),
            i0.Value<String> name = const i0.Value.absent(),
            i0.Value<String> description = const i0.Value.absent(),
            i0.Value<DateTime> createdAt = const i0.Value.absent(),
            i0.Value<DateTime> updatedAt = const i0.Value.absent(),
            i0.Value<String> ownerId = const i0.Value.absent(),
            i0.Value<String?> thumbnailAssetId = const i0.Value.absent(),
            i0.Value<bool> isActivityEnabled = const i0.Value.absent(),
            i0.Value<i2.AssetOrder> order = const i0.Value.absent(),
          }) =>
              i1.RemoteAlbumEntityCompanion(
            id: id,
            name: name,
            description: description,
            createdAt: createdAt,
            updatedAt: updatedAt,
            ownerId: ownerId,
            thumbnailAssetId: thumbnailAssetId,
            isActivityEnabled: isActivityEnabled,
            order: order,
          ),
          createCompanionCallback: ({
            required String id,
            required String name,
            required String description,
            i0.Value<DateTime> createdAt = const i0.Value.absent(),
            i0.Value<DateTime> updatedAt = const i0.Value.absent(),
            required String ownerId,
            i0.Value<String?> thumbnailAssetId = const i0.Value.absent(),
            i0.Value<bool> isActivityEnabled = const i0.Value.absent(),
            required i2.AssetOrder order,
          }) =>
              i1.RemoteAlbumEntityCompanion.insert(
            id: id,
            name: name,
            description: description,
            createdAt: createdAt,
            updatedAt: updatedAt,
            ownerId: ownerId,
            thumbnailAssetId: thumbnailAssetId,
            isActivityEnabled: isActivityEnabled,
            order: order,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (
                    e.readTable(table),
                    i1.$$RemoteAlbumEntityTableReferences(db, table, e)
                  ))
              .toList(),
          prefetchHooksCallback: ({ownerId = false, thumbnailAssetId = false}) {
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
                        i1.$$RemoteAlbumEntityTableReferences._ownerIdTable(db),
                    referencedColumn: i1.$$RemoteAlbumEntityTableReferences
                        ._ownerIdTable(db)
                        .id,
                  ) as T;
                }
                if (thumbnailAssetId) {
                  state = state.withJoin(
                    currentTable: table,
                    currentColumn: table.thumbnailAssetId,
                    referencedTable: i1.$$RemoteAlbumEntityTableReferences
                        ._thumbnailAssetIdTable(db),
                    referencedColumn: i1.$$RemoteAlbumEntityTableReferences
                        ._thumbnailAssetIdTable(db)
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

typedef $$RemoteAlbumEntityTableProcessedTableManager
    = i0.ProcessedTableManager<
        i0.GeneratedDatabase,
        i1.$RemoteAlbumEntityTable,
        i1.RemoteAlbumEntityData,
        i1.$$RemoteAlbumEntityTableFilterComposer,
        i1.$$RemoteAlbumEntityTableOrderingComposer,
        i1.$$RemoteAlbumEntityTableAnnotationComposer,
        $$RemoteAlbumEntityTableCreateCompanionBuilder,
        $$RemoteAlbumEntityTableUpdateCompanionBuilder,
        (i1.RemoteAlbumEntityData, i1.$$RemoteAlbumEntityTableReferences),
        i1.RemoteAlbumEntityData,
        i0.PrefetchHooks Function({bool ownerId, bool thumbnailAssetId})>;

class $RemoteAlbumEntityTable extends i3.RemoteAlbumEntity
    with i0.TableInfo<$RemoteAlbumEntityTable, i1.RemoteAlbumEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $RemoteAlbumEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _idMeta = const i0.VerificationMeta('id');
  @override
  late final i0.GeneratedColumn<String> id = i0.GeneratedColumn<String>(
      'id', aliasedName, false,
      type: i0.DriftSqlType.string, requiredDuringInsert: true);
  static const i0.VerificationMeta _nameMeta =
      const i0.VerificationMeta('name');
  @override
  late final i0.GeneratedColumn<String> name = i0.GeneratedColumn<String>(
      'name', aliasedName, false,
      type: i0.DriftSqlType.string, requiredDuringInsert: true);
  static const i0.VerificationMeta _descriptionMeta =
      const i0.VerificationMeta('description');
  @override
  late final i0.GeneratedColumn<String> description =
      i0.GeneratedColumn<String>('description', aliasedName, false,
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
  static const i0.VerificationMeta _ownerIdMeta =
      const i0.VerificationMeta('ownerId');
  @override
  late final i0.GeneratedColumn<String> ownerId = i0.GeneratedColumn<String>(
      'owner_id', aliasedName, false,
      type: i0.DriftSqlType.string,
      requiredDuringInsert: true,
      defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
          'REFERENCES user_entity (id) ON DELETE CASCADE'));
  static const i0.VerificationMeta _thumbnailAssetIdMeta =
      const i0.VerificationMeta('thumbnailAssetId');
  @override
  late final i0.GeneratedColumn<String> thumbnailAssetId =
      i0.GeneratedColumn<String>('thumbnail_asset_id', aliasedName, true,
          type: i0.DriftSqlType.string,
          requiredDuringInsert: false,
          defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
              'REFERENCES remote_asset_entity (id) ON DELETE SET NULL'));
  static const i0.VerificationMeta _isActivityEnabledMeta =
      const i0.VerificationMeta('isActivityEnabled');
  @override
  late final i0.GeneratedColumn<bool> isActivityEnabled =
      i0.GeneratedColumn<bool>('is_activity_enabled', aliasedName, false,
          type: i0.DriftSqlType.bool,
          requiredDuringInsert: false,
          defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
              'CHECK ("is_activity_enabled" IN (0, 1))'),
          defaultValue: const i4.Constant(true));
  @override
  late final i0.GeneratedColumnWithTypeConverter<i2.AssetOrder, int> order =
      i0.GeneratedColumn<int>('order', aliasedName, false,
              type: i0.DriftSqlType.int, requiredDuringInsert: true)
          .withConverter<i2.AssetOrder>(
              i1.$RemoteAlbumEntityTable.$converterorder);
  @override
  List<i0.GeneratedColumn> get $columns => [
        id,
        name,
        description,
        createdAt,
        updatedAt,
        ownerId,
        thumbnailAssetId,
        isActivityEnabled,
        order
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'remote_album_entity';
  @override
  i0.VerificationContext validateIntegrity(
      i0.Insertable<i1.RemoteAlbumEntityData> instance,
      {bool isInserting = false}) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
          _nameMeta, name.isAcceptableOrUnknown(data['name']!, _nameMeta));
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('description')) {
      context.handle(
          _descriptionMeta,
          description.isAcceptableOrUnknown(
              data['description']!, _descriptionMeta));
    } else if (isInserting) {
      context.missing(_descriptionMeta);
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    if (data.containsKey('owner_id')) {
      context.handle(_ownerIdMeta,
          ownerId.isAcceptableOrUnknown(data['owner_id']!, _ownerIdMeta));
    } else if (isInserting) {
      context.missing(_ownerIdMeta);
    }
    if (data.containsKey('thumbnail_asset_id')) {
      context.handle(
          _thumbnailAssetIdMeta,
          thumbnailAssetId.isAcceptableOrUnknown(
              data['thumbnail_asset_id']!, _thumbnailAssetIdMeta));
    }
    if (data.containsKey('is_activity_enabled')) {
      context.handle(
          _isActivityEnabledMeta,
          isActivityEnabled.isAcceptableOrUnknown(
              data['is_activity_enabled']!, _isActivityEnabledMeta));
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {id};
  @override
  i1.RemoteAlbumEntityData map(Map<String, dynamic> data,
      {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.RemoteAlbumEntityData(
      id: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}id'])!,
      name: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}name'])!,
      description: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}description'])!,
      createdAt: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      updatedAt: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
      ownerId: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}owner_id'])!,
      thumbnailAssetId: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.string, data['${effectivePrefix}thumbnail_asset_id']),
      isActivityEnabled: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.bool, data['${effectivePrefix}is_activity_enabled'])!,
      order: i1.$RemoteAlbumEntityTable.$converterorder.fromSql(attachedDatabase
          .typeMapping
          .read(i0.DriftSqlType.int, data['${effectivePrefix}order'])!),
    );
  }

  @override
  $RemoteAlbumEntityTable createAlias(String alias) {
    return $RemoteAlbumEntityTable(attachedDatabase, alias);
  }

  static i0.JsonTypeConverter2<i2.AssetOrder, int, int> $converterorder =
      const i0.EnumIndexConverter<i2.AssetOrder>(i2.AssetOrder.values);
  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class RemoteAlbumEntityData extends i0.DataClass
    implements i0.Insertable<i1.RemoteAlbumEntityData> {
  final String id;
  final String name;
  final String description;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String ownerId;
  final String? thumbnailAssetId;
  final bool isActivityEnabled;
  final i2.AssetOrder order;
  const RemoteAlbumEntityData(
      {required this.id,
      required this.name,
      required this.description,
      required this.createdAt,
      required this.updatedAt,
      required this.ownerId,
      this.thumbnailAssetId,
      required this.isActivityEnabled,
      required this.order});
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['id'] = i0.Variable<String>(id);
    map['name'] = i0.Variable<String>(name);
    map['description'] = i0.Variable<String>(description);
    map['created_at'] = i0.Variable<DateTime>(createdAt);
    map['updated_at'] = i0.Variable<DateTime>(updatedAt);
    map['owner_id'] = i0.Variable<String>(ownerId);
    if (!nullToAbsent || thumbnailAssetId != null) {
      map['thumbnail_asset_id'] = i0.Variable<String>(thumbnailAssetId);
    }
    map['is_activity_enabled'] = i0.Variable<bool>(isActivityEnabled);
    {
      map['order'] = i0.Variable<int>(
          i1.$RemoteAlbumEntityTable.$converterorder.toSql(order));
    }
    return map;
  }

  factory RemoteAlbumEntityData.fromJson(Map<String, dynamic> json,
      {i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return RemoteAlbumEntityData(
      id: serializer.fromJson<String>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      description: serializer.fromJson<String>(json['description']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      ownerId: serializer.fromJson<String>(json['ownerId']),
      thumbnailAssetId: serializer.fromJson<String?>(json['thumbnailAssetId']),
      isActivityEnabled: serializer.fromJson<bool>(json['isActivityEnabled']),
      order: i1.$RemoteAlbumEntityTable.$converterorder
          .fromJson(serializer.fromJson<int>(json['order'])),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'name': serializer.toJson<String>(name),
      'description': serializer.toJson<String>(description),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'ownerId': serializer.toJson<String>(ownerId),
      'thumbnailAssetId': serializer.toJson<String?>(thumbnailAssetId),
      'isActivityEnabled': serializer.toJson<bool>(isActivityEnabled),
      'order': serializer.toJson<int>(
          i1.$RemoteAlbumEntityTable.$converterorder.toJson(order)),
    };
  }

  i1.RemoteAlbumEntityData copyWith(
          {String? id,
          String? name,
          String? description,
          DateTime? createdAt,
          DateTime? updatedAt,
          String? ownerId,
          i0.Value<String?> thumbnailAssetId = const i0.Value.absent(),
          bool? isActivityEnabled,
          i2.AssetOrder? order}) =>
      i1.RemoteAlbumEntityData(
        id: id ?? this.id,
        name: name ?? this.name,
        description: description ?? this.description,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
        ownerId: ownerId ?? this.ownerId,
        thumbnailAssetId: thumbnailAssetId.present
            ? thumbnailAssetId.value
            : this.thumbnailAssetId,
        isActivityEnabled: isActivityEnabled ?? this.isActivityEnabled,
        order: order ?? this.order,
      );
  RemoteAlbumEntityData copyWithCompanion(i1.RemoteAlbumEntityCompanion data) {
    return RemoteAlbumEntityData(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      description:
          data.description.present ? data.description.value : this.description,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      ownerId: data.ownerId.present ? data.ownerId.value : this.ownerId,
      thumbnailAssetId: data.thumbnailAssetId.present
          ? data.thumbnailAssetId.value
          : this.thumbnailAssetId,
      isActivityEnabled: data.isActivityEnabled.present
          ? data.isActivityEnabled.value
          : this.isActivityEnabled,
      order: data.order.present ? data.order.value : this.order,
    );
  }

  @override
  String toString() {
    return (StringBuffer('RemoteAlbumEntityData(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('description: $description, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('ownerId: $ownerId, ')
          ..write('thumbnailAssetId: $thumbnailAssetId, ')
          ..write('isActivityEnabled: $isActivityEnabled, ')
          ..write('order: $order')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, name, description, createdAt, updatedAt,
      ownerId, thumbnailAssetId, isActivityEnabled, order);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.RemoteAlbumEntityData &&
          other.id == this.id &&
          other.name == this.name &&
          other.description == this.description &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt &&
          other.ownerId == this.ownerId &&
          other.thumbnailAssetId == this.thumbnailAssetId &&
          other.isActivityEnabled == this.isActivityEnabled &&
          other.order == this.order);
}

class RemoteAlbumEntityCompanion
    extends i0.UpdateCompanion<i1.RemoteAlbumEntityData> {
  final i0.Value<String> id;
  final i0.Value<String> name;
  final i0.Value<String> description;
  final i0.Value<DateTime> createdAt;
  final i0.Value<DateTime> updatedAt;
  final i0.Value<String> ownerId;
  final i0.Value<String?> thumbnailAssetId;
  final i0.Value<bool> isActivityEnabled;
  final i0.Value<i2.AssetOrder> order;
  const RemoteAlbumEntityCompanion({
    this.id = const i0.Value.absent(),
    this.name = const i0.Value.absent(),
    this.description = const i0.Value.absent(),
    this.createdAt = const i0.Value.absent(),
    this.updatedAt = const i0.Value.absent(),
    this.ownerId = const i0.Value.absent(),
    this.thumbnailAssetId = const i0.Value.absent(),
    this.isActivityEnabled = const i0.Value.absent(),
    this.order = const i0.Value.absent(),
  });
  RemoteAlbumEntityCompanion.insert({
    required String id,
    required String name,
    required String description,
    this.createdAt = const i0.Value.absent(),
    this.updatedAt = const i0.Value.absent(),
    required String ownerId,
    this.thumbnailAssetId = const i0.Value.absent(),
    this.isActivityEnabled = const i0.Value.absent(),
    required i2.AssetOrder order,
  })  : id = i0.Value(id),
        name = i0.Value(name),
        description = i0.Value(description),
        ownerId = i0.Value(ownerId),
        order = i0.Value(order);
  static i0.Insertable<i1.RemoteAlbumEntityData> custom({
    i0.Expression<String>? id,
    i0.Expression<String>? name,
    i0.Expression<String>? description,
    i0.Expression<DateTime>? createdAt,
    i0.Expression<DateTime>? updatedAt,
    i0.Expression<String>? ownerId,
    i0.Expression<String>? thumbnailAssetId,
    i0.Expression<bool>? isActivityEnabled,
    i0.Expression<int>? order,
  }) {
    return i0.RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (description != null) 'description': description,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (ownerId != null) 'owner_id': ownerId,
      if (thumbnailAssetId != null) 'thumbnail_asset_id': thumbnailAssetId,
      if (isActivityEnabled != null) 'is_activity_enabled': isActivityEnabled,
      if (order != null) 'order': order,
    });
  }

  i1.RemoteAlbumEntityCompanion copyWith(
      {i0.Value<String>? id,
      i0.Value<String>? name,
      i0.Value<String>? description,
      i0.Value<DateTime>? createdAt,
      i0.Value<DateTime>? updatedAt,
      i0.Value<String>? ownerId,
      i0.Value<String?>? thumbnailAssetId,
      i0.Value<bool>? isActivityEnabled,
      i0.Value<i2.AssetOrder>? order}) {
    return i1.RemoteAlbumEntityCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      ownerId: ownerId ?? this.ownerId,
      thumbnailAssetId: thumbnailAssetId ?? this.thumbnailAssetId,
      isActivityEnabled: isActivityEnabled ?? this.isActivityEnabled,
      order: order ?? this.order,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (id.present) {
      map['id'] = i0.Variable<String>(id.value);
    }
    if (name.present) {
      map['name'] = i0.Variable<String>(name.value);
    }
    if (description.present) {
      map['description'] = i0.Variable<String>(description.value);
    }
    if (createdAt.present) {
      map['created_at'] = i0.Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = i0.Variable<DateTime>(updatedAt.value);
    }
    if (ownerId.present) {
      map['owner_id'] = i0.Variable<String>(ownerId.value);
    }
    if (thumbnailAssetId.present) {
      map['thumbnail_asset_id'] = i0.Variable<String>(thumbnailAssetId.value);
    }
    if (isActivityEnabled.present) {
      map['is_activity_enabled'] = i0.Variable<bool>(isActivityEnabled.value);
    }
    if (order.present) {
      map['order'] = i0.Variable<int>(
          i1.$RemoteAlbumEntityTable.$converterorder.toSql(order.value));
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('RemoteAlbumEntityCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('description: $description, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('ownerId: $ownerId, ')
          ..write('thumbnailAssetId: $thumbnailAssetId, ')
          ..write('isActivityEnabled: $isActivityEnabled, ')
          ..write('order: $order')
          ..write(')'))
        .toString();
  }
}
