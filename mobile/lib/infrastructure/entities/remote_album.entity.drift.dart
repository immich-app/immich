// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.drift.dart'
    as i1;
import 'dart:typed_data' as i2;
import 'package:immich_mobile/domain/models/album/album.model.dart' as i3;
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.dart'
    as i4;
import 'package:drift/src/runtime/query_builder/query_builder.dart' as i5;
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart'
    as i6;
import 'package:drift/internal/modular.dart' as i7;
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart'
    as i8;

typedef $$RemoteAlbumEntityTableCreateCompanionBuilder
    = i1.RemoteAlbumEntityCompanion Function({
  required i2.Uint8List remoteId,
  required String name,
  required String description,
  i0.Value<DateTime> updatedAt,
  required i2.Uint8List ownerId,
  required i2.Uint8List thumbnailAssetId,
  i0.Value<bool> isActivityEnabled,
  required i3.AssetOrder order,
});
typedef $$RemoteAlbumEntityTableUpdateCompanionBuilder
    = i1.RemoteAlbumEntityCompanion Function({
  i0.Value<i2.Uint8List> remoteId,
  i0.Value<String> name,
  i0.Value<String> description,
  i0.Value<DateTime> updatedAt,
  i0.Value<i2.Uint8List> ownerId,
  i0.Value<i2.Uint8List> thumbnailAssetId,
  i0.Value<bool> isActivityEnabled,
  i0.Value<i3.AssetOrder> order,
});

final class $$RemoteAlbumEntityTableReferences extends i0.BaseReferences<
    i0.GeneratedDatabase,
    i1.$RemoteAlbumEntityTable,
    i1.RemoteAlbumEntityData> {
  $$RemoteAlbumEntityTableReferences(
      super.$_db, super.$_table, super.$_typedResult);

  static i6.$UserEntityTable _ownerIdTable(i0.GeneratedDatabase db) =>
      i7.ReadDatabaseContainer(db)
          .resultSet<i6.$UserEntityTable>('user_entity')
          .createAlias(i0.$_aliasNameGenerator(
              i7.ReadDatabaseContainer(db)
                  .resultSet<i1.$RemoteAlbumEntityTable>('remote_album_entity')
                  .ownerId,
              i7.ReadDatabaseContainer(db)
                  .resultSet<i6.$UserEntityTable>('user_entity')
                  .id));

  i6.$$UserEntityTableProcessedTableManager get ownerId {
    final $_column = $_itemColumn<i2.Uint8List>('owner_id')!;

    final manager = i6
        .$$UserEntityTableTableManager(
            $_db,
            i7.ReadDatabaseContainer($_db)
                .resultSet<i6.$UserEntityTable>('user_entity'))
        .filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_ownerIdTable($_db));
    if (item == null) return manager;
    return i0.ProcessedTableManager(
        manager.$state.copyWith(prefetchedData: [item]));
  }

  static i8.$RemoteAssetEntityTable _thumbnailAssetIdTable(
          i0.GeneratedDatabase db) =>
      i7.ReadDatabaseContainer(db)
          .resultSet<i8.$RemoteAssetEntityTable>('remote_asset_entity')
          .createAlias(i0.$_aliasNameGenerator(
              i7.ReadDatabaseContainer(db)
                  .resultSet<i1.$RemoteAlbumEntityTable>('remote_album_entity')
                  .thumbnailAssetId,
              i7.ReadDatabaseContainer(db)
                  .resultSet<i8.$RemoteAssetEntityTable>('remote_asset_entity')
                  .remoteId));

  i8.$$RemoteAssetEntityTableProcessedTableManager get thumbnailAssetId {
    final $_column = $_itemColumn<i2.Uint8List>('thumbnail_asset_id')!;

    final manager = i8
        .$$RemoteAssetEntityTableTableManager(
            $_db,
            i7.ReadDatabaseContainer($_db)
                .resultSet<i8.$RemoteAssetEntityTable>('remote_asset_entity'))
        .filter((f) => f.remoteId.sqlEquals($_column));
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
  i0.ColumnFilters<i2.Uint8List> get remoteId => $composableBuilder(
      column: $table.remoteId, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get description => $composableBuilder(
      column: $table.description,
      builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<bool> get isActivityEnabled => $composableBuilder(
      column: $table.isActivityEnabled,
      builder: (column) => i0.ColumnFilters(column));

  i0.ColumnWithTypeConverterFilters<i3.AssetOrder, i3.AssetOrder, int>
      get order => $composableBuilder(
          column: $table.order,
          builder: (column) => i0.ColumnWithTypeConverterFilters(column));

  i6.$$UserEntityTableFilterComposer get ownerId {
    final i6.$$UserEntityTableFilterComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.ownerId,
        referencedTable: i7.ReadDatabaseContainer($db)
            .resultSet<i6.$UserEntityTable>('user_entity'),
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            i6.$$UserEntityTableFilterComposer(
              $db: $db,
              $table: i7.ReadDatabaseContainer($db)
                  .resultSet<i6.$UserEntityTable>('user_entity'),
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }

  i8.$$RemoteAssetEntityTableFilterComposer get thumbnailAssetId {
    final i8.$$RemoteAssetEntityTableFilterComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.thumbnailAssetId,
        referencedTable: i7.ReadDatabaseContainer($db)
            .resultSet<i8.$RemoteAssetEntityTable>('remote_asset_entity'),
        getReferencedColumn: (t) => t.remoteId,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            i8.$$RemoteAssetEntityTableFilterComposer(
              $db: $db,
              $table: i7.ReadDatabaseContainer($db)
                  .resultSet<i8.$RemoteAssetEntityTable>('remote_asset_entity'),
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
  i0.ColumnOrderings<i2.Uint8List> get remoteId => $composableBuilder(
      column: $table.remoteId, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get description => $composableBuilder(
      column: $table.description,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<bool> get isActivityEnabled => $composableBuilder(
      column: $table.isActivityEnabled,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<int> get order => $composableBuilder(
      column: $table.order, builder: (column) => i0.ColumnOrderings(column));

  i6.$$UserEntityTableOrderingComposer get ownerId {
    final i6.$$UserEntityTableOrderingComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.ownerId,
        referencedTable: i7.ReadDatabaseContainer($db)
            .resultSet<i6.$UserEntityTable>('user_entity'),
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            i6.$$UserEntityTableOrderingComposer(
              $db: $db,
              $table: i7.ReadDatabaseContainer($db)
                  .resultSet<i6.$UserEntityTable>('user_entity'),
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }

  i8.$$RemoteAssetEntityTableOrderingComposer get thumbnailAssetId {
    final i8.$$RemoteAssetEntityTableOrderingComposer composer =
        $composerBuilder(
            composer: this,
            getCurrentColumn: (t) => t.thumbnailAssetId,
            referencedTable: i7.ReadDatabaseContainer($db)
                .resultSet<i8.$RemoteAssetEntityTable>('remote_asset_entity'),
            getReferencedColumn: (t) => t.remoteId,
            builder: (joinBuilder,
                    {$addJoinBuilderToRootComposer,
                    $removeJoinBuilderFromRootComposer}) =>
                i8.$$RemoteAssetEntityTableOrderingComposer(
                  $db: $db,
                  $table: i7.ReadDatabaseContainer($db)
                      .resultSet<i8.$RemoteAssetEntityTable>(
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
  i0.GeneratedColumn<i2.Uint8List> get remoteId =>
      $composableBuilder(column: $table.remoteId, builder: (column) => column);

  i0.GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  i0.GeneratedColumn<String> get description => $composableBuilder(
      column: $table.description, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  i0.GeneratedColumn<bool> get isActivityEnabled => $composableBuilder(
      column: $table.isActivityEnabled, builder: (column) => column);

  i0.GeneratedColumnWithTypeConverter<i3.AssetOrder, int> get order =>
      $composableBuilder(column: $table.order, builder: (column) => column);

  i6.$$UserEntityTableAnnotationComposer get ownerId {
    final i6.$$UserEntityTableAnnotationComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.ownerId,
        referencedTable: i7.ReadDatabaseContainer($db)
            .resultSet<i6.$UserEntityTable>('user_entity'),
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            i6.$$UserEntityTableAnnotationComposer(
              $db: $db,
              $table: i7.ReadDatabaseContainer($db)
                  .resultSet<i6.$UserEntityTable>('user_entity'),
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }

  i8.$$RemoteAssetEntityTableAnnotationComposer get thumbnailAssetId {
    final i8.$$RemoteAssetEntityTableAnnotationComposer composer =
        $composerBuilder(
            composer: this,
            getCurrentColumn: (t) => t.thumbnailAssetId,
            referencedTable: i7.ReadDatabaseContainer($db)
                .resultSet<i8.$RemoteAssetEntityTable>('remote_asset_entity'),
            getReferencedColumn: (t) => t.remoteId,
            builder: (joinBuilder,
                    {$addJoinBuilderToRootComposer,
                    $removeJoinBuilderFromRootComposer}) =>
                i8.$$RemoteAssetEntityTableAnnotationComposer(
                  $db: $db,
                  $table: i7.ReadDatabaseContainer($db)
                      .resultSet<i8.$RemoteAssetEntityTable>(
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
            i0.Value<i2.Uint8List> remoteId = const i0.Value.absent(),
            i0.Value<String> name = const i0.Value.absent(),
            i0.Value<String> description = const i0.Value.absent(),
            i0.Value<DateTime> updatedAt = const i0.Value.absent(),
            i0.Value<i2.Uint8List> ownerId = const i0.Value.absent(),
            i0.Value<i2.Uint8List> thumbnailAssetId = const i0.Value.absent(),
            i0.Value<bool> isActivityEnabled = const i0.Value.absent(),
            i0.Value<i3.AssetOrder> order = const i0.Value.absent(),
          }) =>
              i1.RemoteAlbumEntityCompanion(
            remoteId: remoteId,
            name: name,
            description: description,
            updatedAt: updatedAt,
            ownerId: ownerId,
            thumbnailAssetId: thumbnailAssetId,
            isActivityEnabled: isActivityEnabled,
            order: order,
          ),
          createCompanionCallback: ({
            required i2.Uint8List remoteId,
            required String name,
            required String description,
            i0.Value<DateTime> updatedAt = const i0.Value.absent(),
            required i2.Uint8List ownerId,
            required i2.Uint8List thumbnailAssetId,
            i0.Value<bool> isActivityEnabled = const i0.Value.absent(),
            required i3.AssetOrder order,
          }) =>
              i1.RemoteAlbumEntityCompanion.insert(
            remoteId: remoteId,
            name: name,
            description: description,
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
                        .remoteId,
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

class $RemoteAlbumEntityTable extends i4.RemoteAlbumEntity
    with i0.TableInfo<$RemoteAlbumEntityTable, i1.RemoteAlbumEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $RemoteAlbumEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _remoteIdMeta =
      const i0.VerificationMeta('remoteId');
  @override
  late final i0.GeneratedColumn<i2.Uint8List> remoteId =
      i0.GeneratedColumn<i2.Uint8List>('remote_id', aliasedName, false,
          type: i0.DriftSqlType.blob, requiredDuringInsert: true);
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
  static const i0.VerificationMeta _updatedAtMeta =
      const i0.VerificationMeta('updatedAt');
  @override
  late final i0.GeneratedColumn<DateTime> updatedAt =
      i0.GeneratedColumn<DateTime>('updated_at', aliasedName, false,
          type: i0.DriftSqlType.dateTime,
          requiredDuringInsert: false,
          defaultValue: i5.currentDateAndTime);
  static const i0.VerificationMeta _ownerIdMeta =
      const i0.VerificationMeta('ownerId');
  @override
  late final i0.GeneratedColumn<i2.Uint8List> ownerId =
      i0.GeneratedColumn<i2.Uint8List>('owner_id', aliasedName, false,
          type: i0.DriftSqlType.blob,
          requiredDuringInsert: true,
          defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
              'REFERENCES user_entity (id) ON DELETE CASCADE'));
  static const i0.VerificationMeta _thumbnailAssetIdMeta =
      const i0.VerificationMeta('thumbnailAssetId');
  @override
  late final i0.GeneratedColumn<i2.Uint8List> thumbnailAssetId =
      i0.GeneratedColumn<i2.Uint8List>('thumbnail_asset_id', aliasedName, false,
          type: i0.DriftSqlType.blob,
          requiredDuringInsert: true,
          defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
              'REFERENCES remote_asset_entity (remote_id) ON DELETE SET NULL'));
  static const i0.VerificationMeta _isActivityEnabledMeta =
      const i0.VerificationMeta('isActivityEnabled');
  @override
  late final i0.GeneratedColumn<bool> isActivityEnabled =
      i0.GeneratedColumn<bool>('is_activity_enabled', aliasedName, false,
          type: i0.DriftSqlType.bool,
          requiredDuringInsert: false,
          defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
              'CHECK ("is_activity_enabled" IN (0, 1))'),
          defaultValue: const i5.Constant(true));
  @override
  late final i0.GeneratedColumnWithTypeConverter<i3.AssetOrder, int> order =
      i0.GeneratedColumn<int>('order', aliasedName, false,
              type: i0.DriftSqlType.int, requiredDuringInsert: true)
          .withConverter<i3.AssetOrder>(
              i1.$RemoteAlbumEntityTable.$converterorder);
  @override
  List<i0.GeneratedColumn> get $columns => [
        remoteId,
        name,
        description,
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
    if (data.containsKey('remote_id')) {
      context.handle(_remoteIdMeta,
          remoteId.isAcceptableOrUnknown(data['remote_id']!, _remoteIdMeta));
    } else if (isInserting) {
      context.missing(_remoteIdMeta);
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
    } else if (isInserting) {
      context.missing(_thumbnailAssetIdMeta);
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
  Set<i0.GeneratedColumn> get $primaryKey => {remoteId};
  @override
  i1.RemoteAlbumEntityData map(Map<String, dynamic> data,
      {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.RemoteAlbumEntityData(
      remoteId: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.blob, data['${effectivePrefix}remote_id'])!,
      name: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}name'])!,
      description: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}description'])!,
      updatedAt: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
      ownerId: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.blob, data['${effectivePrefix}owner_id'])!,
      thumbnailAssetId: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.blob, data['${effectivePrefix}thumbnail_asset_id'])!,
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

  static i0.JsonTypeConverter2<i3.AssetOrder, int, int> $converterorder =
      const i0.EnumIndexConverter<i3.AssetOrder>(i3.AssetOrder.values);
  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class RemoteAlbumEntityData extends i0.DataClass
    implements i0.Insertable<i1.RemoteAlbumEntityData> {
  final i2.Uint8List remoteId;
  final String name;
  final String description;
  final DateTime updatedAt;
  final i2.Uint8List ownerId;
  final i2.Uint8List thumbnailAssetId;
  final bool isActivityEnabled;
  final i3.AssetOrder order;
  const RemoteAlbumEntityData(
      {required this.remoteId,
      required this.name,
      required this.description,
      required this.updatedAt,
      required this.ownerId,
      required this.thumbnailAssetId,
      required this.isActivityEnabled,
      required this.order});
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['remote_id'] = i0.Variable<i2.Uint8List>(remoteId);
    map['name'] = i0.Variable<String>(name);
    map['description'] = i0.Variable<String>(description);
    map['updated_at'] = i0.Variable<DateTime>(updatedAt);
    map['owner_id'] = i0.Variable<i2.Uint8List>(ownerId);
    map['thumbnail_asset_id'] = i0.Variable<i2.Uint8List>(thumbnailAssetId);
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
      remoteId: serializer.fromJson<i2.Uint8List>(json['remoteId']),
      name: serializer.fromJson<String>(json['name']),
      description: serializer.fromJson<String>(json['description']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      ownerId: serializer.fromJson<i2.Uint8List>(json['ownerId']),
      thumbnailAssetId:
          serializer.fromJson<i2.Uint8List>(json['thumbnailAssetId']),
      isActivityEnabled: serializer.fromJson<bool>(json['isActivityEnabled']),
      order: i1.$RemoteAlbumEntityTable.$converterorder
          .fromJson(serializer.fromJson<int>(json['order'])),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'remoteId': serializer.toJson<i2.Uint8List>(remoteId),
      'name': serializer.toJson<String>(name),
      'description': serializer.toJson<String>(description),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'ownerId': serializer.toJson<i2.Uint8List>(ownerId),
      'thumbnailAssetId': serializer.toJson<i2.Uint8List>(thumbnailAssetId),
      'isActivityEnabled': serializer.toJson<bool>(isActivityEnabled),
      'order': serializer.toJson<int>(
          i1.$RemoteAlbumEntityTable.$converterorder.toJson(order)),
    };
  }

  i1.RemoteAlbumEntityData copyWith(
          {i2.Uint8List? remoteId,
          String? name,
          String? description,
          DateTime? updatedAt,
          i2.Uint8List? ownerId,
          i2.Uint8List? thumbnailAssetId,
          bool? isActivityEnabled,
          i3.AssetOrder? order}) =>
      i1.RemoteAlbumEntityData(
        remoteId: remoteId ?? this.remoteId,
        name: name ?? this.name,
        description: description ?? this.description,
        updatedAt: updatedAt ?? this.updatedAt,
        ownerId: ownerId ?? this.ownerId,
        thumbnailAssetId: thumbnailAssetId ?? this.thumbnailAssetId,
        isActivityEnabled: isActivityEnabled ?? this.isActivityEnabled,
        order: order ?? this.order,
      );
  RemoteAlbumEntityData copyWithCompanion(i1.RemoteAlbumEntityCompanion data) {
    return RemoteAlbumEntityData(
      remoteId: data.remoteId.present ? data.remoteId.value : this.remoteId,
      name: data.name.present ? data.name.value : this.name,
      description:
          data.description.present ? data.description.value : this.description,
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
          ..write('remoteId: $remoteId, ')
          ..write('name: $name, ')
          ..write('description: $description, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('ownerId: $ownerId, ')
          ..write('thumbnailAssetId: $thumbnailAssetId, ')
          ..write('isActivityEnabled: $isActivityEnabled, ')
          ..write('order: $order')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      i0.$driftBlobEquality.hash(remoteId),
      name,
      description,
      updatedAt,
      i0.$driftBlobEquality.hash(ownerId),
      i0.$driftBlobEquality.hash(thumbnailAssetId),
      isActivityEnabled,
      order);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.RemoteAlbumEntityData &&
          i0.$driftBlobEquality.equals(other.remoteId, this.remoteId) &&
          other.name == this.name &&
          other.description == this.description &&
          other.updatedAt == this.updatedAt &&
          i0.$driftBlobEquality.equals(other.ownerId, this.ownerId) &&
          i0.$driftBlobEquality
              .equals(other.thumbnailAssetId, this.thumbnailAssetId) &&
          other.isActivityEnabled == this.isActivityEnabled &&
          other.order == this.order);
}

class RemoteAlbumEntityCompanion
    extends i0.UpdateCompanion<i1.RemoteAlbumEntityData> {
  final i0.Value<i2.Uint8List> remoteId;
  final i0.Value<String> name;
  final i0.Value<String> description;
  final i0.Value<DateTime> updatedAt;
  final i0.Value<i2.Uint8List> ownerId;
  final i0.Value<i2.Uint8List> thumbnailAssetId;
  final i0.Value<bool> isActivityEnabled;
  final i0.Value<i3.AssetOrder> order;
  const RemoteAlbumEntityCompanion({
    this.remoteId = const i0.Value.absent(),
    this.name = const i0.Value.absent(),
    this.description = const i0.Value.absent(),
    this.updatedAt = const i0.Value.absent(),
    this.ownerId = const i0.Value.absent(),
    this.thumbnailAssetId = const i0.Value.absent(),
    this.isActivityEnabled = const i0.Value.absent(),
    this.order = const i0.Value.absent(),
  });
  RemoteAlbumEntityCompanion.insert({
    required i2.Uint8List remoteId,
    required String name,
    required String description,
    this.updatedAt = const i0.Value.absent(),
    required i2.Uint8List ownerId,
    required i2.Uint8List thumbnailAssetId,
    this.isActivityEnabled = const i0.Value.absent(),
    required i3.AssetOrder order,
  })  : remoteId = i0.Value(remoteId),
        name = i0.Value(name),
        description = i0.Value(description),
        ownerId = i0.Value(ownerId),
        thumbnailAssetId = i0.Value(thumbnailAssetId),
        order = i0.Value(order);
  static i0.Insertable<i1.RemoteAlbumEntityData> custom({
    i0.Expression<i2.Uint8List>? remoteId,
    i0.Expression<String>? name,
    i0.Expression<String>? description,
    i0.Expression<DateTime>? updatedAt,
    i0.Expression<i2.Uint8List>? ownerId,
    i0.Expression<i2.Uint8List>? thumbnailAssetId,
    i0.Expression<bool>? isActivityEnabled,
    i0.Expression<int>? order,
  }) {
    return i0.RawValuesInsertable({
      if (remoteId != null) 'remote_id': remoteId,
      if (name != null) 'name': name,
      if (description != null) 'description': description,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (ownerId != null) 'owner_id': ownerId,
      if (thumbnailAssetId != null) 'thumbnail_asset_id': thumbnailAssetId,
      if (isActivityEnabled != null) 'is_activity_enabled': isActivityEnabled,
      if (order != null) 'order': order,
    });
  }

  i1.RemoteAlbumEntityCompanion copyWith(
      {i0.Value<i2.Uint8List>? remoteId,
      i0.Value<String>? name,
      i0.Value<String>? description,
      i0.Value<DateTime>? updatedAt,
      i0.Value<i2.Uint8List>? ownerId,
      i0.Value<i2.Uint8List>? thumbnailAssetId,
      i0.Value<bool>? isActivityEnabled,
      i0.Value<i3.AssetOrder>? order}) {
    return i1.RemoteAlbumEntityCompanion(
      remoteId: remoteId ?? this.remoteId,
      name: name ?? this.name,
      description: description ?? this.description,
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
    if (remoteId.present) {
      map['remote_id'] = i0.Variable<i2.Uint8List>(remoteId.value);
    }
    if (name.present) {
      map['name'] = i0.Variable<String>(name.value);
    }
    if (description.present) {
      map['description'] = i0.Variable<String>(description.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = i0.Variable<DateTime>(updatedAt.value);
    }
    if (ownerId.present) {
      map['owner_id'] = i0.Variable<i2.Uint8List>(ownerId.value);
    }
    if (thumbnailAssetId.present) {
      map['thumbnail_asset_id'] =
          i0.Variable<i2.Uint8List>(thumbnailAssetId.value);
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
          ..write('remoteId: $remoteId, ')
          ..write('name: $name, ')
          ..write('description: $description, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('ownerId: $ownerId, ')
          ..write('thumbnailAssetId: $thumbnailAssetId, ')
          ..write('isActivityEnabled: $isActivityEnabled, ')
          ..write('order: $order')
          ..write(')'))
        .toString();
  }
}
