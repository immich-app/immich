// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart'
    as i1;
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart' as i2;
import 'dart:typed_data' as i3;
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.dart'
    as i4;
import 'package:drift/src/runtime/query_builder/query_builder.dart' as i5;
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart'
    as i6;
import 'package:drift/internal/modular.dart' as i7;

typedef $$RemoteAssetEntityTableCreateCompanionBuilder
    = i1.RemoteAssetEntityCompanion Function({
  required String name,
  required i2.AssetType type,
  i0.Value<DateTime> createdAt,
  i0.Value<DateTime> updatedAt,
  i0.Value<int?> durationInSeconds,
  required i3.Uint8List remoteId,
  required String checksum,
  i0.Value<bool> isFavorite,
  required i3.Uint8List ownerId,
  i0.Value<DateTime?> localDateTime,
  i0.Value<String?> thumbHash,
  i0.Value<DateTime?> deletedAt,
  required i2.AssetVisibility visibility,
});
typedef $$RemoteAssetEntityTableUpdateCompanionBuilder
    = i1.RemoteAssetEntityCompanion Function({
  i0.Value<String> name,
  i0.Value<i2.AssetType> type,
  i0.Value<DateTime> createdAt,
  i0.Value<DateTime> updatedAt,
  i0.Value<int?> durationInSeconds,
  i0.Value<i3.Uint8List> remoteId,
  i0.Value<String> checksum,
  i0.Value<bool> isFavorite,
  i0.Value<i3.Uint8List> ownerId,
  i0.Value<DateTime?> localDateTime,
  i0.Value<String?> thumbHash,
  i0.Value<DateTime?> deletedAt,
  i0.Value<i2.AssetVisibility> visibility,
});

final class $$RemoteAssetEntityTableReferences extends i0.BaseReferences<
    i0.GeneratedDatabase,
    i1.$RemoteAssetEntityTable,
    i1.RemoteAssetEntityData> {
  $$RemoteAssetEntityTableReferences(
      super.$_db, super.$_table, super.$_typedResult);

  static i6.$UserEntityTable _ownerIdTable(i0.GeneratedDatabase db) =>
      i7.ReadDatabaseContainer(db)
          .resultSet<i6.$UserEntityTable>('user_entity')
          .createAlias(i0.$_aliasNameGenerator(
              i7.ReadDatabaseContainer(db)
                  .resultSet<i1.$RemoteAssetEntityTable>('remote_asset_entity')
                  .ownerId,
              i7.ReadDatabaseContainer(db)
                  .resultSet<i6.$UserEntityTable>('user_entity')
                  .id));

  i6.$$UserEntityTableProcessedTableManager get ownerId {
    final $_column = $_itemColumn<i3.Uint8List>('owner_id')!;

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
}

class $$RemoteAssetEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$RemoteAssetEntityTable> {
  $$RemoteAssetEntityTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnFilters<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnWithTypeConverterFilters<i2.AssetType, i2.AssetType, int> get type =>
      $composableBuilder(
          column: $table.type,
          builder: (column) => i0.ColumnWithTypeConverterFilters(column));

  i0.ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<int> get durationInSeconds => $composableBuilder(
      column: $table.durationInSeconds,
      builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<i3.Uint8List> get remoteId => $composableBuilder(
      column: $table.remoteId, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get checksum => $composableBuilder(
      column: $table.checksum, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<bool> get isFavorite => $composableBuilder(
      column: $table.isFavorite, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<DateTime> get localDateTime => $composableBuilder(
      column: $table.localDateTime,
      builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get thumbHash => $composableBuilder(
      column: $table.thumbHash, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<DateTime> get deletedAt => $composableBuilder(
      column: $table.deletedAt, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnWithTypeConverterFilters<i2.AssetVisibility, i2.AssetVisibility, int>
      get visibility => $composableBuilder(
          column: $table.visibility,
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
}

class $$RemoteAssetEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$RemoteAssetEntityTable> {
  $$RemoteAssetEntityTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnOrderings<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<int> get type => $composableBuilder(
      column: $table.type, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<int> get durationInSeconds => $composableBuilder(
      column: $table.durationInSeconds,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<i3.Uint8List> get remoteId => $composableBuilder(
      column: $table.remoteId, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get checksum => $composableBuilder(
      column: $table.checksum, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<bool> get isFavorite => $composableBuilder(
      column: $table.isFavorite,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<DateTime> get localDateTime => $composableBuilder(
      column: $table.localDateTime,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get thumbHash => $composableBuilder(
      column: $table.thumbHash,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<DateTime> get deletedAt => $composableBuilder(
      column: $table.deletedAt,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<int> get visibility => $composableBuilder(
      column: $table.visibility,
      builder: (column) => i0.ColumnOrderings(column));

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
}

class $$RemoteAssetEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$RemoteAssetEntityTable> {
  $$RemoteAssetEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  i0.GeneratedColumnWithTypeConverter<i2.AssetType, int> get type =>
      $composableBuilder(column: $table.type, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  i0.GeneratedColumn<int> get durationInSeconds => $composableBuilder(
      column: $table.durationInSeconds, builder: (column) => column);

  i0.GeneratedColumn<i3.Uint8List> get remoteId =>
      $composableBuilder(column: $table.remoteId, builder: (column) => column);

  i0.GeneratedColumn<String> get checksum =>
      $composableBuilder(column: $table.checksum, builder: (column) => column);

  i0.GeneratedColumn<bool> get isFavorite => $composableBuilder(
      column: $table.isFavorite, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get localDateTime => $composableBuilder(
      column: $table.localDateTime, builder: (column) => column);

  i0.GeneratedColumn<String> get thumbHash =>
      $composableBuilder(column: $table.thumbHash, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get deletedAt =>
      $composableBuilder(column: $table.deletedAt, builder: (column) => column);

  i0.GeneratedColumnWithTypeConverter<i2.AssetVisibility, int> get visibility =>
      $composableBuilder(
          column: $table.visibility, builder: (column) => column);

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
}

class $$RemoteAssetEntityTableTableManager extends i0.RootTableManager<
    i0.GeneratedDatabase,
    i1.$RemoteAssetEntityTable,
    i1.RemoteAssetEntityData,
    i1.$$RemoteAssetEntityTableFilterComposer,
    i1.$$RemoteAssetEntityTableOrderingComposer,
    i1.$$RemoteAssetEntityTableAnnotationComposer,
    $$RemoteAssetEntityTableCreateCompanionBuilder,
    $$RemoteAssetEntityTableUpdateCompanionBuilder,
    (i1.RemoteAssetEntityData, i1.$$RemoteAssetEntityTableReferences),
    i1.RemoteAssetEntityData,
    i0.PrefetchHooks Function({bool ownerId})> {
  $$RemoteAssetEntityTableTableManager(
      i0.GeneratedDatabase db, i1.$RemoteAssetEntityTable table)
      : super(i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$RemoteAssetEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () => i1
              .$$RemoteAssetEntityTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              i1.$$RemoteAssetEntityTableAnnotationComposer(
                  $db: db, $table: table),
          updateCompanionCallback: ({
            i0.Value<String> name = const i0.Value.absent(),
            i0.Value<i2.AssetType> type = const i0.Value.absent(),
            i0.Value<DateTime> createdAt = const i0.Value.absent(),
            i0.Value<DateTime> updatedAt = const i0.Value.absent(),
            i0.Value<int?> durationInSeconds = const i0.Value.absent(),
            i0.Value<i3.Uint8List> remoteId = const i0.Value.absent(),
            i0.Value<String> checksum = const i0.Value.absent(),
            i0.Value<bool> isFavorite = const i0.Value.absent(),
            i0.Value<i3.Uint8List> ownerId = const i0.Value.absent(),
            i0.Value<DateTime?> localDateTime = const i0.Value.absent(),
            i0.Value<String?> thumbHash = const i0.Value.absent(),
            i0.Value<DateTime?> deletedAt = const i0.Value.absent(),
            i0.Value<i2.AssetVisibility> visibility = const i0.Value.absent(),
          }) =>
              i1.RemoteAssetEntityCompanion(
            name: name,
            type: type,
            createdAt: createdAt,
            updatedAt: updatedAt,
            durationInSeconds: durationInSeconds,
            remoteId: remoteId,
            checksum: checksum,
            isFavorite: isFavorite,
            ownerId: ownerId,
            localDateTime: localDateTime,
            thumbHash: thumbHash,
            deletedAt: deletedAt,
            visibility: visibility,
          ),
          createCompanionCallback: ({
            required String name,
            required i2.AssetType type,
            i0.Value<DateTime> createdAt = const i0.Value.absent(),
            i0.Value<DateTime> updatedAt = const i0.Value.absent(),
            i0.Value<int?> durationInSeconds = const i0.Value.absent(),
            required i3.Uint8List remoteId,
            required String checksum,
            i0.Value<bool> isFavorite = const i0.Value.absent(),
            required i3.Uint8List ownerId,
            i0.Value<DateTime?> localDateTime = const i0.Value.absent(),
            i0.Value<String?> thumbHash = const i0.Value.absent(),
            i0.Value<DateTime?> deletedAt = const i0.Value.absent(),
            required i2.AssetVisibility visibility,
          }) =>
              i1.RemoteAssetEntityCompanion.insert(
            name: name,
            type: type,
            createdAt: createdAt,
            updatedAt: updatedAt,
            durationInSeconds: durationInSeconds,
            remoteId: remoteId,
            checksum: checksum,
            isFavorite: isFavorite,
            ownerId: ownerId,
            localDateTime: localDateTime,
            thumbHash: thumbHash,
            deletedAt: deletedAt,
            visibility: visibility,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (
                    e.readTable(table),
                    i1.$$RemoteAssetEntityTableReferences(db, table, e)
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
                        i1.$$RemoteAssetEntityTableReferences._ownerIdTable(db),
                    referencedColumn: i1.$$RemoteAssetEntityTableReferences
                        ._ownerIdTable(db)
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

typedef $$RemoteAssetEntityTableProcessedTableManager
    = i0.ProcessedTableManager<
        i0.GeneratedDatabase,
        i1.$RemoteAssetEntityTable,
        i1.RemoteAssetEntityData,
        i1.$$RemoteAssetEntityTableFilterComposer,
        i1.$$RemoteAssetEntityTableOrderingComposer,
        i1.$$RemoteAssetEntityTableAnnotationComposer,
        $$RemoteAssetEntityTableCreateCompanionBuilder,
        $$RemoteAssetEntityTableUpdateCompanionBuilder,
        (i1.RemoteAssetEntityData, i1.$$RemoteAssetEntityTableReferences),
        i1.RemoteAssetEntityData,
        i0.PrefetchHooks Function({bool ownerId})>;
i0.Index get uQRemoteAssetOwnerChecksum => i0.Index(
    'UQ_remote_asset_owner_checksum',
    'CREATE UNIQUE INDEX UQ_remote_asset_owner_checksum ON remote_asset_entity (checksum, owner_id)');

class $RemoteAssetEntityTable extends i4.RemoteAssetEntity
    with i0.TableInfo<$RemoteAssetEntityTable, i1.RemoteAssetEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $RemoteAssetEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _nameMeta =
      const i0.VerificationMeta('name');
  @override
  late final i0.GeneratedColumn<String> name = i0.GeneratedColumn<String>(
      'name', aliasedName, false,
      type: i0.DriftSqlType.string, requiredDuringInsert: true);
  @override
  late final i0.GeneratedColumnWithTypeConverter<i2.AssetType, int> type =
      i0.GeneratedColumn<int>('type', aliasedName, false,
              type: i0.DriftSqlType.int, requiredDuringInsert: true)
          .withConverter<i2.AssetType>(
              i1.$RemoteAssetEntityTable.$convertertype);
  static const i0.VerificationMeta _createdAtMeta =
      const i0.VerificationMeta('createdAt');
  @override
  late final i0.GeneratedColumn<DateTime> createdAt =
      i0.GeneratedColumn<DateTime>('created_at', aliasedName, false,
          type: i0.DriftSqlType.dateTime,
          requiredDuringInsert: false,
          defaultValue: i5.currentDateAndTime);
  static const i0.VerificationMeta _updatedAtMeta =
      const i0.VerificationMeta('updatedAt');
  @override
  late final i0.GeneratedColumn<DateTime> updatedAt =
      i0.GeneratedColumn<DateTime>('updated_at', aliasedName, false,
          type: i0.DriftSqlType.dateTime,
          requiredDuringInsert: false,
          defaultValue: i5.currentDateAndTime);
  static const i0.VerificationMeta _durationInSecondsMeta =
      const i0.VerificationMeta('durationInSeconds');
  @override
  late final i0.GeneratedColumn<int> durationInSeconds =
      i0.GeneratedColumn<int>('duration_in_seconds', aliasedName, true,
          type: i0.DriftSqlType.int, requiredDuringInsert: false);
  static const i0.VerificationMeta _remoteIdMeta =
      const i0.VerificationMeta('remoteId');
  @override
  late final i0.GeneratedColumn<i3.Uint8List> remoteId =
      i0.GeneratedColumn<i3.Uint8List>('remote_id', aliasedName, false,
          type: i0.DriftSqlType.blob, requiredDuringInsert: true);
  static const i0.VerificationMeta _checksumMeta =
      const i0.VerificationMeta('checksum');
  @override
  late final i0.GeneratedColumn<String> checksum = i0.GeneratedColumn<String>(
      'checksum', aliasedName, false,
      type: i0.DriftSqlType.string, requiredDuringInsert: true);
  static const i0.VerificationMeta _isFavoriteMeta =
      const i0.VerificationMeta('isFavorite');
  @override
  late final i0.GeneratedColumn<bool> isFavorite = i0.GeneratedColumn<bool>(
      'is_favorite', aliasedName, false,
      type: i0.DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
          'CHECK ("is_favorite" IN (0, 1))'),
      defaultValue: const i5.Constant(false));
  static const i0.VerificationMeta _ownerIdMeta =
      const i0.VerificationMeta('ownerId');
  @override
  late final i0.GeneratedColumn<i3.Uint8List> ownerId =
      i0.GeneratedColumn<i3.Uint8List>('owner_id', aliasedName, false,
          type: i0.DriftSqlType.blob,
          requiredDuringInsert: true,
          defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
              'REFERENCES user_entity (id) ON DELETE CASCADE'));
  static const i0.VerificationMeta _localDateTimeMeta =
      const i0.VerificationMeta('localDateTime');
  @override
  late final i0.GeneratedColumn<DateTime> localDateTime =
      i0.GeneratedColumn<DateTime>('local_date_time', aliasedName, true,
          type: i0.DriftSqlType.dateTime, requiredDuringInsert: false);
  static const i0.VerificationMeta _thumbHashMeta =
      const i0.VerificationMeta('thumbHash');
  @override
  late final i0.GeneratedColumn<String> thumbHash = i0.GeneratedColumn<String>(
      'thumb_hash', aliasedName, true,
      type: i0.DriftSqlType.string, requiredDuringInsert: false);
  static const i0.VerificationMeta _deletedAtMeta =
      const i0.VerificationMeta('deletedAt');
  @override
  late final i0.GeneratedColumn<DateTime> deletedAt =
      i0.GeneratedColumn<DateTime>('deleted_at', aliasedName, true,
          type: i0.DriftSqlType.dateTime, requiredDuringInsert: false);
  @override
  late final i0.GeneratedColumnWithTypeConverter<i2.AssetVisibility, int>
      visibility = i0.GeneratedColumn<int>('visibility', aliasedName, false,
              type: i0.DriftSqlType.int, requiredDuringInsert: true)
          .withConverter<i2.AssetVisibility>(
              i1.$RemoteAssetEntityTable.$convertervisibility);
  @override
  List<i0.GeneratedColumn> get $columns => [
        name,
        type,
        createdAt,
        updatedAt,
        durationInSeconds,
        remoteId,
        checksum,
        isFavorite,
        ownerId,
        localDateTime,
        thumbHash,
        deletedAt,
        visibility
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'remote_asset_entity';
  @override
  i0.VerificationContext validateIntegrity(
      i0.Insertable<i1.RemoteAssetEntityData> instance,
      {bool isInserting = false}) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('name')) {
      context.handle(
          _nameMeta, name.isAcceptableOrUnknown(data['name']!, _nameMeta));
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    if (data.containsKey('duration_in_seconds')) {
      context.handle(
          _durationInSecondsMeta,
          durationInSeconds.isAcceptableOrUnknown(
              data['duration_in_seconds']!, _durationInSecondsMeta));
    }
    if (data.containsKey('remote_id')) {
      context.handle(_remoteIdMeta,
          remoteId.isAcceptableOrUnknown(data['remote_id']!, _remoteIdMeta));
    } else if (isInserting) {
      context.missing(_remoteIdMeta);
    }
    if (data.containsKey('checksum')) {
      context.handle(_checksumMeta,
          checksum.isAcceptableOrUnknown(data['checksum']!, _checksumMeta));
    } else if (isInserting) {
      context.missing(_checksumMeta);
    }
    if (data.containsKey('is_favorite')) {
      context.handle(
          _isFavoriteMeta,
          isFavorite.isAcceptableOrUnknown(
              data['is_favorite']!, _isFavoriteMeta));
    }
    if (data.containsKey('owner_id')) {
      context.handle(_ownerIdMeta,
          ownerId.isAcceptableOrUnknown(data['owner_id']!, _ownerIdMeta));
    } else if (isInserting) {
      context.missing(_ownerIdMeta);
    }
    if (data.containsKey('local_date_time')) {
      context.handle(
          _localDateTimeMeta,
          localDateTime.isAcceptableOrUnknown(
              data['local_date_time']!, _localDateTimeMeta));
    }
    if (data.containsKey('thumb_hash')) {
      context.handle(_thumbHashMeta,
          thumbHash.isAcceptableOrUnknown(data['thumb_hash']!, _thumbHashMeta));
    }
    if (data.containsKey('deleted_at')) {
      context.handle(_deletedAtMeta,
          deletedAt.isAcceptableOrUnknown(data['deleted_at']!, _deletedAtMeta));
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {remoteId};
  @override
  i1.RemoteAssetEntityData map(Map<String, dynamic> data,
      {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.RemoteAssetEntityData(
      name: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}name'])!,
      type: i1.$RemoteAssetEntityTable.$convertertype.fromSql(attachedDatabase
          .typeMapping
          .read(i0.DriftSqlType.int, data['${effectivePrefix}type'])!),
      createdAt: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      updatedAt: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
      durationInSeconds: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.int, data['${effectivePrefix}duration_in_seconds']),
      remoteId: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.blob, data['${effectivePrefix}remote_id'])!,
      checksum: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}checksum'])!,
      isFavorite: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.bool, data['${effectivePrefix}is_favorite'])!,
      ownerId: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.blob, data['${effectivePrefix}owner_id'])!,
      localDateTime: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.dateTime, data['${effectivePrefix}local_date_time']),
      thumbHash: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}thumb_hash']),
      deletedAt: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.dateTime, data['${effectivePrefix}deleted_at']),
      visibility: i1.$RemoteAssetEntityTable.$convertervisibility.fromSql(
          attachedDatabase.typeMapping.read(
              i0.DriftSqlType.int, data['${effectivePrefix}visibility'])!),
    );
  }

  @override
  $RemoteAssetEntityTable createAlias(String alias) {
    return $RemoteAssetEntityTable(attachedDatabase, alias);
  }

  static i0.JsonTypeConverter2<i2.AssetType, int, int> $convertertype =
      const i0.EnumIndexConverter<i2.AssetType>(i2.AssetType.values);
  static i0.JsonTypeConverter2<i2.AssetVisibility, int, int>
      $convertervisibility = const i0.EnumIndexConverter<i2.AssetVisibility>(
          i2.AssetVisibility.values);
  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class RemoteAssetEntityData extends i0.DataClass
    implements i0.Insertable<i1.RemoteAssetEntityData> {
  final String name;
  final i2.AssetType type;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int? durationInSeconds;
  final i3.Uint8List remoteId;
  final String checksum;
  final bool isFavorite;
  final i3.Uint8List ownerId;
  final DateTime? localDateTime;
  final String? thumbHash;
  final DateTime? deletedAt;
  final i2.AssetVisibility visibility;
  const RemoteAssetEntityData(
      {required this.name,
      required this.type,
      required this.createdAt,
      required this.updatedAt,
      this.durationInSeconds,
      required this.remoteId,
      required this.checksum,
      required this.isFavorite,
      required this.ownerId,
      this.localDateTime,
      this.thumbHash,
      this.deletedAt,
      required this.visibility});
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['name'] = i0.Variable<String>(name);
    {
      map['type'] = i0.Variable<int>(
          i1.$RemoteAssetEntityTable.$convertertype.toSql(type));
    }
    map['created_at'] = i0.Variable<DateTime>(createdAt);
    map['updated_at'] = i0.Variable<DateTime>(updatedAt);
    if (!nullToAbsent || durationInSeconds != null) {
      map['duration_in_seconds'] = i0.Variable<int>(durationInSeconds);
    }
    map['remote_id'] = i0.Variable<i3.Uint8List>(remoteId);
    map['checksum'] = i0.Variable<String>(checksum);
    map['is_favorite'] = i0.Variable<bool>(isFavorite);
    map['owner_id'] = i0.Variable<i3.Uint8List>(ownerId);
    if (!nullToAbsent || localDateTime != null) {
      map['local_date_time'] = i0.Variable<DateTime>(localDateTime);
    }
    if (!nullToAbsent || thumbHash != null) {
      map['thumb_hash'] = i0.Variable<String>(thumbHash);
    }
    if (!nullToAbsent || deletedAt != null) {
      map['deleted_at'] = i0.Variable<DateTime>(deletedAt);
    }
    {
      map['visibility'] = i0.Variable<int>(
          i1.$RemoteAssetEntityTable.$convertervisibility.toSql(visibility));
    }
    return map;
  }

  factory RemoteAssetEntityData.fromJson(Map<String, dynamic> json,
      {i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return RemoteAssetEntityData(
      name: serializer.fromJson<String>(json['name']),
      type: i1.$RemoteAssetEntityTable.$convertertype
          .fromJson(serializer.fromJson<int>(json['type'])),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      durationInSeconds: serializer.fromJson<int?>(json['durationInSeconds']),
      remoteId: serializer.fromJson<i3.Uint8List>(json['remoteId']),
      checksum: serializer.fromJson<String>(json['checksum']),
      isFavorite: serializer.fromJson<bool>(json['isFavorite']),
      ownerId: serializer.fromJson<i3.Uint8List>(json['ownerId']),
      localDateTime: serializer.fromJson<DateTime?>(json['localDateTime']),
      thumbHash: serializer.fromJson<String?>(json['thumbHash']),
      deletedAt: serializer.fromJson<DateTime?>(json['deletedAt']),
      visibility: i1.$RemoteAssetEntityTable.$convertervisibility
          .fromJson(serializer.fromJson<int>(json['visibility'])),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'name': serializer.toJson<String>(name),
      'type': serializer
          .toJson<int>(i1.$RemoteAssetEntityTable.$convertertype.toJson(type)),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'durationInSeconds': serializer.toJson<int?>(durationInSeconds),
      'remoteId': serializer.toJson<i3.Uint8List>(remoteId),
      'checksum': serializer.toJson<String>(checksum),
      'isFavorite': serializer.toJson<bool>(isFavorite),
      'ownerId': serializer.toJson<i3.Uint8List>(ownerId),
      'localDateTime': serializer.toJson<DateTime?>(localDateTime),
      'thumbHash': serializer.toJson<String?>(thumbHash),
      'deletedAt': serializer.toJson<DateTime?>(deletedAt),
      'visibility': serializer.toJson<int>(
          i1.$RemoteAssetEntityTable.$convertervisibility.toJson(visibility)),
    };
  }

  i1.RemoteAssetEntityData copyWith(
          {String? name,
          i2.AssetType? type,
          DateTime? createdAt,
          DateTime? updatedAt,
          i0.Value<int?> durationInSeconds = const i0.Value.absent(),
          i3.Uint8List? remoteId,
          String? checksum,
          bool? isFavorite,
          i3.Uint8List? ownerId,
          i0.Value<DateTime?> localDateTime = const i0.Value.absent(),
          i0.Value<String?> thumbHash = const i0.Value.absent(),
          i0.Value<DateTime?> deletedAt = const i0.Value.absent(),
          i2.AssetVisibility? visibility}) =>
      i1.RemoteAssetEntityData(
        name: name ?? this.name,
        type: type ?? this.type,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
        durationInSeconds: durationInSeconds.present
            ? durationInSeconds.value
            : this.durationInSeconds,
        remoteId: remoteId ?? this.remoteId,
        checksum: checksum ?? this.checksum,
        isFavorite: isFavorite ?? this.isFavorite,
        ownerId: ownerId ?? this.ownerId,
        localDateTime:
            localDateTime.present ? localDateTime.value : this.localDateTime,
        thumbHash: thumbHash.present ? thumbHash.value : this.thumbHash,
        deletedAt: deletedAt.present ? deletedAt.value : this.deletedAt,
        visibility: visibility ?? this.visibility,
      );
  RemoteAssetEntityData copyWithCompanion(i1.RemoteAssetEntityCompanion data) {
    return RemoteAssetEntityData(
      name: data.name.present ? data.name.value : this.name,
      type: data.type.present ? data.type.value : this.type,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      durationInSeconds: data.durationInSeconds.present
          ? data.durationInSeconds.value
          : this.durationInSeconds,
      remoteId: data.remoteId.present ? data.remoteId.value : this.remoteId,
      checksum: data.checksum.present ? data.checksum.value : this.checksum,
      isFavorite:
          data.isFavorite.present ? data.isFavorite.value : this.isFavorite,
      ownerId: data.ownerId.present ? data.ownerId.value : this.ownerId,
      localDateTime: data.localDateTime.present
          ? data.localDateTime.value
          : this.localDateTime,
      thumbHash: data.thumbHash.present ? data.thumbHash.value : this.thumbHash,
      deletedAt: data.deletedAt.present ? data.deletedAt.value : this.deletedAt,
      visibility:
          data.visibility.present ? data.visibility.value : this.visibility,
    );
  }

  @override
  String toString() {
    return (StringBuffer('RemoteAssetEntityData(')
          ..write('name: $name, ')
          ..write('type: $type, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('durationInSeconds: $durationInSeconds, ')
          ..write('remoteId: $remoteId, ')
          ..write('checksum: $checksum, ')
          ..write('isFavorite: $isFavorite, ')
          ..write('ownerId: $ownerId, ')
          ..write('localDateTime: $localDateTime, ')
          ..write('thumbHash: $thumbHash, ')
          ..write('deletedAt: $deletedAt, ')
          ..write('visibility: $visibility')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      name,
      type,
      createdAt,
      updatedAt,
      durationInSeconds,
      i0.$driftBlobEquality.hash(remoteId),
      checksum,
      isFavorite,
      i0.$driftBlobEquality.hash(ownerId),
      localDateTime,
      thumbHash,
      deletedAt,
      visibility);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.RemoteAssetEntityData &&
          other.name == this.name &&
          other.type == this.type &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt &&
          other.durationInSeconds == this.durationInSeconds &&
          i0.$driftBlobEquality.equals(other.remoteId, this.remoteId) &&
          other.checksum == this.checksum &&
          other.isFavorite == this.isFavorite &&
          i0.$driftBlobEquality.equals(other.ownerId, this.ownerId) &&
          other.localDateTime == this.localDateTime &&
          other.thumbHash == this.thumbHash &&
          other.deletedAt == this.deletedAt &&
          other.visibility == this.visibility);
}

class RemoteAssetEntityCompanion
    extends i0.UpdateCompanion<i1.RemoteAssetEntityData> {
  final i0.Value<String> name;
  final i0.Value<i2.AssetType> type;
  final i0.Value<DateTime> createdAt;
  final i0.Value<DateTime> updatedAt;
  final i0.Value<int?> durationInSeconds;
  final i0.Value<i3.Uint8List> remoteId;
  final i0.Value<String> checksum;
  final i0.Value<bool> isFavorite;
  final i0.Value<i3.Uint8List> ownerId;
  final i0.Value<DateTime?> localDateTime;
  final i0.Value<String?> thumbHash;
  final i0.Value<DateTime?> deletedAt;
  final i0.Value<i2.AssetVisibility> visibility;
  const RemoteAssetEntityCompanion({
    this.name = const i0.Value.absent(),
    this.type = const i0.Value.absent(),
    this.createdAt = const i0.Value.absent(),
    this.updatedAt = const i0.Value.absent(),
    this.durationInSeconds = const i0.Value.absent(),
    this.remoteId = const i0.Value.absent(),
    this.checksum = const i0.Value.absent(),
    this.isFavorite = const i0.Value.absent(),
    this.ownerId = const i0.Value.absent(),
    this.localDateTime = const i0.Value.absent(),
    this.thumbHash = const i0.Value.absent(),
    this.deletedAt = const i0.Value.absent(),
    this.visibility = const i0.Value.absent(),
  });
  RemoteAssetEntityCompanion.insert({
    required String name,
    required i2.AssetType type,
    this.createdAt = const i0.Value.absent(),
    this.updatedAt = const i0.Value.absent(),
    this.durationInSeconds = const i0.Value.absent(),
    required i3.Uint8List remoteId,
    required String checksum,
    this.isFavorite = const i0.Value.absent(),
    required i3.Uint8List ownerId,
    this.localDateTime = const i0.Value.absent(),
    this.thumbHash = const i0.Value.absent(),
    this.deletedAt = const i0.Value.absent(),
    required i2.AssetVisibility visibility,
  })  : name = i0.Value(name),
        type = i0.Value(type),
        remoteId = i0.Value(remoteId),
        checksum = i0.Value(checksum),
        ownerId = i0.Value(ownerId),
        visibility = i0.Value(visibility);
  static i0.Insertable<i1.RemoteAssetEntityData> custom({
    i0.Expression<String>? name,
    i0.Expression<int>? type,
    i0.Expression<DateTime>? createdAt,
    i0.Expression<DateTime>? updatedAt,
    i0.Expression<int>? durationInSeconds,
    i0.Expression<i3.Uint8List>? remoteId,
    i0.Expression<String>? checksum,
    i0.Expression<bool>? isFavorite,
    i0.Expression<i3.Uint8List>? ownerId,
    i0.Expression<DateTime>? localDateTime,
    i0.Expression<String>? thumbHash,
    i0.Expression<DateTime>? deletedAt,
    i0.Expression<int>? visibility,
  }) {
    return i0.RawValuesInsertable({
      if (name != null) 'name': name,
      if (type != null) 'type': type,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (durationInSeconds != null) 'duration_in_seconds': durationInSeconds,
      if (remoteId != null) 'remote_id': remoteId,
      if (checksum != null) 'checksum': checksum,
      if (isFavorite != null) 'is_favorite': isFavorite,
      if (ownerId != null) 'owner_id': ownerId,
      if (localDateTime != null) 'local_date_time': localDateTime,
      if (thumbHash != null) 'thumb_hash': thumbHash,
      if (deletedAt != null) 'deleted_at': deletedAt,
      if (visibility != null) 'visibility': visibility,
    });
  }

  i1.RemoteAssetEntityCompanion copyWith(
      {i0.Value<String>? name,
      i0.Value<i2.AssetType>? type,
      i0.Value<DateTime>? createdAt,
      i0.Value<DateTime>? updatedAt,
      i0.Value<int?>? durationInSeconds,
      i0.Value<i3.Uint8List>? remoteId,
      i0.Value<String>? checksum,
      i0.Value<bool>? isFavorite,
      i0.Value<i3.Uint8List>? ownerId,
      i0.Value<DateTime?>? localDateTime,
      i0.Value<String?>? thumbHash,
      i0.Value<DateTime?>? deletedAt,
      i0.Value<i2.AssetVisibility>? visibility}) {
    return i1.RemoteAssetEntityCompanion(
      name: name ?? this.name,
      type: type ?? this.type,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      durationInSeconds: durationInSeconds ?? this.durationInSeconds,
      remoteId: remoteId ?? this.remoteId,
      checksum: checksum ?? this.checksum,
      isFavorite: isFavorite ?? this.isFavorite,
      ownerId: ownerId ?? this.ownerId,
      localDateTime: localDateTime ?? this.localDateTime,
      thumbHash: thumbHash ?? this.thumbHash,
      deletedAt: deletedAt ?? this.deletedAt,
      visibility: visibility ?? this.visibility,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (name.present) {
      map['name'] = i0.Variable<String>(name.value);
    }
    if (type.present) {
      map['type'] = i0.Variable<int>(
          i1.$RemoteAssetEntityTable.$convertertype.toSql(type.value));
    }
    if (createdAt.present) {
      map['created_at'] = i0.Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = i0.Variable<DateTime>(updatedAt.value);
    }
    if (durationInSeconds.present) {
      map['duration_in_seconds'] = i0.Variable<int>(durationInSeconds.value);
    }
    if (remoteId.present) {
      map['remote_id'] = i0.Variable<i3.Uint8List>(remoteId.value);
    }
    if (checksum.present) {
      map['checksum'] = i0.Variable<String>(checksum.value);
    }
    if (isFavorite.present) {
      map['is_favorite'] = i0.Variable<bool>(isFavorite.value);
    }
    if (ownerId.present) {
      map['owner_id'] = i0.Variable<i3.Uint8List>(ownerId.value);
    }
    if (localDateTime.present) {
      map['local_date_time'] = i0.Variable<DateTime>(localDateTime.value);
    }
    if (thumbHash.present) {
      map['thumb_hash'] = i0.Variable<String>(thumbHash.value);
    }
    if (deletedAt.present) {
      map['deleted_at'] = i0.Variable<DateTime>(deletedAt.value);
    }
    if (visibility.present) {
      map['visibility'] = i0.Variable<int>(i1
          .$RemoteAssetEntityTable.$convertervisibility
          .toSql(visibility.value));
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('RemoteAssetEntityCompanion(')
          ..write('name: $name, ')
          ..write('type: $type, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('durationInSeconds: $durationInSeconds, ')
          ..write('remoteId: $remoteId, ')
          ..write('checksum: $checksum, ')
          ..write('isFavorite: $isFavorite, ')
          ..write('ownerId: $ownerId, ')
          ..write('localDateTime: $localDateTime, ')
          ..write('thumbHash: $thumbHash, ')
          ..write('deletedAt: $deletedAt, ')
          ..write('visibility: $visibility')
          ..write(')'))
        .toString();
  }
}
