// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/trashed_local_asset.entity.drift.dart'
    as i1;
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart' as i2;
import 'package:immich_mobile/infrastructure/entities/trashed_local_asset.entity.dart'
    as i3;
import 'package:drift/src/runtime/query_builder/query_builder.dart' as i4;

typedef $$TrashedLocalAssetEntityTableCreateCompanionBuilder =
    i1.TrashedLocalAssetEntityCompanion Function({
      required String id,
      i0.Value<String?> checksum,
      i0.Value<bool> isFavorite,
      i0.Value<int> orientation,
      i0.Value<String?> iCloudId,
      i0.Value<DateTime?> adjustmentTime,
      i0.Value<double?> latitude,
      i0.Value<double?> longitude,
      i0.Value<i2.AssetPlaybackStyle> playbackStyle,
      required String name,
      required i2.AssetType type,
      i0.Value<DateTime> createdAt,
      i0.Value<DateTime> updatedAt,
      i0.Value<int?> width,
      i0.Value<int?> height,
      i0.Value<int?> durationMs,
      required String albumId,
      required i3.TrashOrigin source,
    });
typedef $$TrashedLocalAssetEntityTableUpdateCompanionBuilder =
    i1.TrashedLocalAssetEntityCompanion Function({
      i0.Value<String> id,
      i0.Value<String?> checksum,
      i0.Value<bool> isFavorite,
      i0.Value<int> orientation,
      i0.Value<String?> iCloudId,
      i0.Value<DateTime?> adjustmentTime,
      i0.Value<double?> latitude,
      i0.Value<double?> longitude,
      i0.Value<i2.AssetPlaybackStyle> playbackStyle,
      i0.Value<String> name,
      i0.Value<i2.AssetType> type,
      i0.Value<DateTime> createdAt,
      i0.Value<DateTime> updatedAt,
      i0.Value<int?> width,
      i0.Value<int?> height,
      i0.Value<int?> durationMs,
      i0.Value<String> albumId,
      i0.Value<i3.TrashOrigin> source,
    });

class $$TrashedLocalAssetEntityTableFilterComposer
    extends
        i0.Composer<i0.GeneratedDatabase, i1.$TrashedLocalAssetEntityTable> {
  $$TrashedLocalAssetEntityTableFilterComposer({
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

  i0.ColumnFilters<String> get checksum => $composableBuilder(
    column: $table.checksum,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<bool> get isFavorite => $composableBuilder(
    column: $table.isFavorite,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get orientation => $composableBuilder(
    column: $table.orientation,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<String> get iCloudId => $composableBuilder(
    column: $table.iCloudId,
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

  i0.ColumnWithTypeConverterFilters<
    i2.AssetPlaybackStyle,
    i2.AssetPlaybackStyle,
    int
  >
  get playbackStyle => $composableBuilder(
    column: $table.playbackStyle,
    builder: (column) => i0.ColumnWithTypeConverterFilters(column),
  );

  i0.ColumnFilters<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnWithTypeConverterFilters<i2.AssetType, i2.AssetType, int> get type =>
      $composableBuilder(
        column: $table.type,
        builder: (column) => i0.ColumnWithTypeConverterFilters(column),
      );

  i0.ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get width => $composableBuilder(
    column: $table.width,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get height => $composableBuilder(
    column: $table.height,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get durationMs => $composableBuilder(
    column: $table.durationMs,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<String> get albumId => $composableBuilder(
    column: $table.albumId,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnWithTypeConverterFilters<i3.TrashOrigin, i3.TrashOrigin, int>
  get source => $composableBuilder(
    column: $table.source,
    builder: (column) => i0.ColumnWithTypeConverterFilters(column),
  );
}

class $$TrashedLocalAssetEntityTableOrderingComposer
    extends
        i0.Composer<i0.GeneratedDatabase, i1.$TrashedLocalAssetEntityTable> {
  $$TrashedLocalAssetEntityTableOrderingComposer({
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

  i0.ColumnOrderings<String> get checksum => $composableBuilder(
    column: $table.checksum,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<bool> get isFavorite => $composableBuilder(
    column: $table.isFavorite,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get orientation => $composableBuilder(
    column: $table.orientation,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get iCloudId => $composableBuilder(
    column: $table.iCloudId,
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

  i0.ColumnOrderings<int> get playbackStyle => $composableBuilder(
    column: $table.playbackStyle,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get type => $composableBuilder(
    column: $table.type,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get width => $composableBuilder(
    column: $table.width,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get height => $composableBuilder(
    column: $table.height,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get durationMs => $composableBuilder(
    column: $table.durationMs,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get albumId => $composableBuilder(
    column: $table.albumId,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get source => $composableBuilder(
    column: $table.source,
    builder: (column) => i0.ColumnOrderings(column),
  );
}

class $$TrashedLocalAssetEntityTableAnnotationComposer
    extends
        i0.Composer<i0.GeneratedDatabase, i1.$TrashedLocalAssetEntityTable> {
  $$TrashedLocalAssetEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  i0.GeneratedColumn<String> get checksum =>
      $composableBuilder(column: $table.checksum, builder: (column) => column);

  i0.GeneratedColumn<bool> get isFavorite => $composableBuilder(
    column: $table.isFavorite,
    builder: (column) => column,
  );

  i0.GeneratedColumn<int> get orientation => $composableBuilder(
    column: $table.orientation,
    builder: (column) => column,
  );

  i0.GeneratedColumn<String> get iCloudId =>
      $composableBuilder(column: $table.iCloudId, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get adjustmentTime => $composableBuilder(
    column: $table.adjustmentTime,
    builder: (column) => column,
  );

  i0.GeneratedColumn<double> get latitude =>
      $composableBuilder(column: $table.latitude, builder: (column) => column);

  i0.GeneratedColumn<double> get longitude =>
      $composableBuilder(column: $table.longitude, builder: (column) => column);

  i0.GeneratedColumnWithTypeConverter<i2.AssetPlaybackStyle, int>
  get playbackStyle => $composableBuilder(
    column: $table.playbackStyle,
    builder: (column) => column,
  );

  i0.GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  i0.GeneratedColumnWithTypeConverter<i2.AssetType, int> get type =>
      $composableBuilder(column: $table.type, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  i0.GeneratedColumn<int> get width =>
      $composableBuilder(column: $table.width, builder: (column) => column);

  i0.GeneratedColumn<int> get height =>
      $composableBuilder(column: $table.height, builder: (column) => column);

  i0.GeneratedColumn<int> get durationMs => $composableBuilder(
    column: $table.durationMs,
    builder: (column) => column,
  );

  i0.GeneratedColumn<String> get albumId =>
      $composableBuilder(column: $table.albumId, builder: (column) => column);

  i0.GeneratedColumnWithTypeConverter<i3.TrashOrigin, int> get source =>
      $composableBuilder(column: $table.source, builder: (column) => column);
}

class $$TrashedLocalAssetEntityTableTableManager
    extends
        i0.RootTableManager<
          i0.GeneratedDatabase,
          i1.$TrashedLocalAssetEntityTable,
          i1.TrashedLocalAssetEntityData,
          i1.$$TrashedLocalAssetEntityTableFilterComposer,
          i1.$$TrashedLocalAssetEntityTableOrderingComposer,
          i1.$$TrashedLocalAssetEntityTableAnnotationComposer,
          $$TrashedLocalAssetEntityTableCreateCompanionBuilder,
          $$TrashedLocalAssetEntityTableUpdateCompanionBuilder,
          (
            i1.TrashedLocalAssetEntityData,
            i0.BaseReferences<
              i0.GeneratedDatabase,
              i1.$TrashedLocalAssetEntityTable,
              i1.TrashedLocalAssetEntityData
            >,
          ),
          i1.TrashedLocalAssetEntityData,
          i0.PrefetchHooks Function()
        > {
  $$TrashedLocalAssetEntityTableTableManager(
    i0.GeneratedDatabase db,
    i1.$TrashedLocalAssetEntityTable table,
  ) : super(
        i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$TrashedLocalAssetEntityTableFilterComposer(
                $db: db,
                $table: table,
              ),
          createOrderingComposer: () =>
              i1.$$TrashedLocalAssetEntityTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              i1.$$TrashedLocalAssetEntityTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                i0.Value<String> id = const i0.Value.absent(),
                i0.Value<String?> checksum = const i0.Value.absent(),
                i0.Value<bool> isFavorite = const i0.Value.absent(),
                i0.Value<int> orientation = const i0.Value.absent(),
                i0.Value<String?> iCloudId = const i0.Value.absent(),
                i0.Value<DateTime?> adjustmentTime = const i0.Value.absent(),
                i0.Value<double?> latitude = const i0.Value.absent(),
                i0.Value<double?> longitude = const i0.Value.absent(),
                i0.Value<i2.AssetPlaybackStyle> playbackStyle =
                    const i0.Value.absent(),
                i0.Value<String> name = const i0.Value.absent(),
                i0.Value<i2.AssetType> type = const i0.Value.absent(),
                i0.Value<DateTime> createdAt = const i0.Value.absent(),
                i0.Value<DateTime> updatedAt = const i0.Value.absent(),
                i0.Value<int?> width = const i0.Value.absent(),
                i0.Value<int?> height = const i0.Value.absent(),
                i0.Value<int?> durationMs = const i0.Value.absent(),
                i0.Value<String> albumId = const i0.Value.absent(),
                i0.Value<i3.TrashOrigin> source = const i0.Value.absent(),
              }) => i1.TrashedLocalAssetEntityCompanion(
                id: id,
                checksum: checksum,
                isFavorite: isFavorite,
                orientation: orientation,
                iCloudId: iCloudId,
                adjustmentTime: adjustmentTime,
                latitude: latitude,
                longitude: longitude,
                playbackStyle: playbackStyle,
                name: name,
                type: type,
                createdAt: createdAt,
                updatedAt: updatedAt,
                width: width,
                height: height,
                durationMs: durationMs,
                albumId: albumId,
                source: source,
              ),
          createCompanionCallback:
              ({
                required String id,
                i0.Value<String?> checksum = const i0.Value.absent(),
                i0.Value<bool> isFavorite = const i0.Value.absent(),
                i0.Value<int> orientation = const i0.Value.absent(),
                i0.Value<String?> iCloudId = const i0.Value.absent(),
                i0.Value<DateTime?> adjustmentTime = const i0.Value.absent(),
                i0.Value<double?> latitude = const i0.Value.absent(),
                i0.Value<double?> longitude = const i0.Value.absent(),
                i0.Value<i2.AssetPlaybackStyle> playbackStyle =
                    const i0.Value.absent(),
                required String name,
                required i2.AssetType type,
                i0.Value<DateTime> createdAt = const i0.Value.absent(),
                i0.Value<DateTime> updatedAt = const i0.Value.absent(),
                i0.Value<int?> width = const i0.Value.absent(),
                i0.Value<int?> height = const i0.Value.absent(),
                i0.Value<int?> durationMs = const i0.Value.absent(),
                required String albumId,
                required i3.TrashOrigin source,
              }) => i1.TrashedLocalAssetEntityCompanion.insert(
                id: id,
                checksum: checksum,
                isFavorite: isFavorite,
                orientation: orientation,
                iCloudId: iCloudId,
                adjustmentTime: adjustmentTime,
                latitude: latitude,
                longitude: longitude,
                playbackStyle: playbackStyle,
                name: name,
                type: type,
                createdAt: createdAt,
                updatedAt: updatedAt,
                width: width,
                height: height,
                durationMs: durationMs,
                albumId: albumId,
                source: source,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), i0.BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$TrashedLocalAssetEntityTableProcessedTableManager =
    i0.ProcessedTableManager<
      i0.GeneratedDatabase,
      i1.$TrashedLocalAssetEntityTable,
      i1.TrashedLocalAssetEntityData,
      i1.$$TrashedLocalAssetEntityTableFilterComposer,
      i1.$$TrashedLocalAssetEntityTableOrderingComposer,
      i1.$$TrashedLocalAssetEntityTableAnnotationComposer,
      $$TrashedLocalAssetEntityTableCreateCompanionBuilder,
      $$TrashedLocalAssetEntityTableUpdateCompanionBuilder,
      (
        i1.TrashedLocalAssetEntityData,
        i0.BaseReferences<
          i0.GeneratedDatabase,
          i1.$TrashedLocalAssetEntityTable,
          i1.TrashedLocalAssetEntityData
        >,
      ),
      i1.TrashedLocalAssetEntityData,
      i0.PrefetchHooks Function()
    >;
i0.Index get idxTrashedLocalAssetChecksum => i0.Index(
  'idx_trashed_local_asset_checksum',
  'CREATE INDEX IF NOT EXISTS idx_trashed_local_asset_checksum ON trashed_local_asset_entity (checksum)',
);

class $TrashedLocalAssetEntityTable extends i3.TrashedLocalAssetEntity
    with
        i0.TableInfo<
          $TrashedLocalAssetEntityTable,
          i1.TrashedLocalAssetEntityData
        > {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $TrashedLocalAssetEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _idMeta = const i0.VerificationMeta('id');
  @override
  late final i0.GeneratedColumn<String> id = i0.GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _checksumMeta = const i0.VerificationMeta(
    'checksum',
  );
  @override
  late final i0.GeneratedColumn<String> checksum = i0.GeneratedColumn<String>(
    'checksum',
    aliasedName,
    true,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const i0.VerificationMeta _isFavoriteMeta = const i0.VerificationMeta(
    'isFavorite',
  );
  @override
  late final i0.GeneratedColumn<bool> isFavorite = i0.GeneratedColumn<bool>(
    'is_favorite',
    aliasedName,
    false,
    type: i0.DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
      'CHECK ("is_favorite" IN (0, 1))',
    ),
    defaultValue: const i4.Constant(false),
  );
  static const i0.VerificationMeta _orientationMeta = const i0.VerificationMeta(
    'orientation',
  );
  @override
  late final i0.GeneratedColumn<int> orientation = i0.GeneratedColumn<int>(
    'orientation',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const i4.Constant(0),
  );
  static const i0.VerificationMeta _iCloudIdMeta = const i0.VerificationMeta(
    'iCloudId',
  );
  @override
  late final i0.GeneratedColumn<String> iCloudId = i0.GeneratedColumn<String>(
    'i_cloud_id',
    aliasedName,
    true,
    type: i0.DriftSqlType.string,
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
  late final i0.GeneratedColumnWithTypeConverter<i2.AssetPlaybackStyle, int>
  playbackStyle =
      i0.GeneratedColumn<int>(
        'playback_style',
        aliasedName,
        false,
        type: i0.DriftSqlType.int,
        requiredDuringInsert: false,
        defaultValue: const i4.Constant(0),
      ).withConverter<i2.AssetPlaybackStyle>(
        i1.$TrashedLocalAssetEntityTable.$converterplaybackStyle,
      );
  static const i0.VerificationMeta _nameMeta = const i0.VerificationMeta(
    'name',
  );
  @override
  late final i0.GeneratedColumn<String> name = i0.GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  late final i0.GeneratedColumnWithTypeConverter<i2.AssetType, int> type =
      i0.GeneratedColumn<int>(
        'type',
        aliasedName,
        false,
        type: i0.DriftSqlType.int,
        requiredDuringInsert: true,
      ).withConverter<i2.AssetType>(
        i1.$TrashedLocalAssetEntityTable.$convertertype,
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
        defaultValue: i4.currentDateAndTime,
      );
  static const i0.VerificationMeta _updatedAtMeta = const i0.VerificationMeta(
    'updatedAt',
  );
  @override
  late final i0.GeneratedColumn<DateTime> updatedAt =
      i0.GeneratedColumn<DateTime>(
        'updated_at',
        aliasedName,
        false,
        type: i0.DriftSqlType.dateTime,
        requiredDuringInsert: false,
        defaultValue: i4.currentDateAndTime,
      );
  static const i0.VerificationMeta _widthMeta = const i0.VerificationMeta(
    'width',
  );
  @override
  late final i0.GeneratedColumn<int> width = i0.GeneratedColumn<int>(
    'width',
    aliasedName,
    true,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: false,
  );
  static const i0.VerificationMeta _heightMeta = const i0.VerificationMeta(
    'height',
  );
  @override
  late final i0.GeneratedColumn<int> height = i0.GeneratedColumn<int>(
    'height',
    aliasedName,
    true,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: false,
  );
  static const i0.VerificationMeta _durationMsMeta = const i0.VerificationMeta(
    'durationMs',
  );
  @override
  late final i0.GeneratedColumn<int> durationMs = i0.GeneratedColumn<int>(
    'duration_ms',
    aliasedName,
    true,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: false,
  );
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
  );
  @override
  late final i0.GeneratedColumnWithTypeConverter<i3.TrashOrigin, int> source =
      i0.GeneratedColumn<int>(
        'source',
        aliasedName,
        false,
        type: i0.DriftSqlType.int,
        requiredDuringInsert: true,
      ).withConverter<i3.TrashOrigin>(
        i1.$TrashedLocalAssetEntityTable.$convertersource,
      );
  @override
  List<i0.GeneratedColumn> get $columns => [
    id,
    checksum,
    isFavorite,
    orientation,
    iCloudId,
    adjustmentTime,
    latitude,
    longitude,
    playbackStyle,
    name,
    type,
    createdAt,
    updatedAt,
    width,
    height,
    durationMs,
    albumId,
    source,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'trashed_local_asset_entity';
  @override
  i0.VerificationContext validateIntegrity(
    i0.Insertable<i1.TrashedLocalAssetEntityData> instance, {
    bool isInserting = false,
  }) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('checksum')) {
      context.handle(
        _checksumMeta,
        checksum.isAcceptableOrUnknown(data['checksum']!, _checksumMeta),
      );
    }
    if (data.containsKey('is_favorite')) {
      context.handle(
        _isFavoriteMeta,
        isFavorite.isAcceptableOrUnknown(data['is_favorite']!, _isFavoriteMeta),
      );
    }
    if (data.containsKey('orientation')) {
      context.handle(
        _orientationMeta,
        orientation.isAcceptableOrUnknown(
          data['orientation']!,
          _orientationMeta,
        ),
      );
    }
    if (data.containsKey('i_cloud_id')) {
      context.handle(
        _iCloudIdMeta,
        iCloudId.isAcceptableOrUnknown(data['i_cloud_id']!, _iCloudIdMeta),
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
    if (data.containsKey('name')) {
      context.handle(
        _nameMeta,
        name.isAcceptableOrUnknown(data['name']!, _nameMeta),
      );
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    }
    if (data.containsKey('width')) {
      context.handle(
        _widthMeta,
        width.isAcceptableOrUnknown(data['width']!, _widthMeta),
      );
    }
    if (data.containsKey('height')) {
      context.handle(
        _heightMeta,
        height.isAcceptableOrUnknown(data['height']!, _heightMeta),
      );
    }
    if (data.containsKey('duration_ms')) {
      context.handle(
        _durationMsMeta,
        durationMs.isAcceptableOrUnknown(data['duration_ms']!, _durationMsMeta),
      );
    }
    if (data.containsKey('album_id')) {
      context.handle(
        _albumIdMeta,
        albumId.isAcceptableOrUnknown(data['album_id']!, _albumIdMeta),
      );
    } else if (isInserting) {
      context.missing(_albumIdMeta);
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {id, albumId};
  @override
  i1.TrashedLocalAssetEntityData map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.TrashedLocalAssetEntityData(
      id: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      checksum: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}checksum'],
      ),
      isFavorite: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.bool,
        data['${effectivePrefix}is_favorite'],
      )!,
      orientation: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}orientation'],
      )!,
      iCloudId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}i_cloud_id'],
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
      playbackStyle: i1.$TrashedLocalAssetEntityTable.$converterplaybackStyle
          .fromSql(
            attachedDatabase.typeMapping.read(
              i0.DriftSqlType.int,
              data['${effectivePrefix}playback_style'],
            )!,
          ),
      name: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      type: i1.$TrashedLocalAssetEntityTable.$convertertype.fromSql(
        attachedDatabase.typeMapping.read(
          i0.DriftSqlType.int,
          data['${effectivePrefix}type'],
        )!,
      ),
      createdAt: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
      width: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}width'],
      ),
      height: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}height'],
      ),
      durationMs: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}duration_ms'],
      ),
      albumId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}album_id'],
      )!,
      source: i1.$TrashedLocalAssetEntityTable.$convertersource.fromSql(
        attachedDatabase.typeMapping.read(
          i0.DriftSqlType.int,
          data['${effectivePrefix}source'],
        )!,
      ),
    );
  }

  @override
  $TrashedLocalAssetEntityTable createAlias(String alias) {
    return $TrashedLocalAssetEntityTable(attachedDatabase, alias);
  }

  static i0.JsonTypeConverter2<i2.AssetPlaybackStyle, int, int>
  $converterplaybackStyle = const i0.EnumIndexConverter<i2.AssetPlaybackStyle>(
    i2.AssetPlaybackStyle.values,
  );
  static i0.JsonTypeConverter2<i2.AssetType, int, int> $convertertype =
      const i0.EnumIndexConverter<i2.AssetType>(i2.AssetType.values);
  static i0.JsonTypeConverter2<i3.TrashOrigin, int, int> $convertersource =
      const i0.EnumIndexConverter<i3.TrashOrigin>(i3.TrashOrigin.values);
  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class TrashedLocalAssetEntityData extends i0.DataClass
    implements i0.Insertable<i1.TrashedLocalAssetEntityData> {
  final String id;
  final String? checksum;
  final bool isFavorite;
  final int orientation;
  final String? iCloudId;
  final DateTime? adjustmentTime;
  final double? latitude;
  final double? longitude;
  final i2.AssetPlaybackStyle playbackStyle;
  final String name;
  final i2.AssetType type;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int? width;
  final int? height;
  final int? durationMs;
  final String albumId;
  final i3.TrashOrigin source;
  const TrashedLocalAssetEntityData({
    required this.id,
    this.checksum,
    required this.isFavorite,
    required this.orientation,
    this.iCloudId,
    this.adjustmentTime,
    this.latitude,
    this.longitude,
    required this.playbackStyle,
    required this.name,
    required this.type,
    required this.createdAt,
    required this.updatedAt,
    this.width,
    this.height,
    this.durationMs,
    required this.albumId,
    required this.source,
  });
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['id'] = i0.Variable<String>(id);
    if (!nullToAbsent || checksum != null) {
      map['checksum'] = i0.Variable<String>(checksum);
    }
    map['is_favorite'] = i0.Variable<bool>(isFavorite);
    map['orientation'] = i0.Variable<int>(orientation);
    if (!nullToAbsent || iCloudId != null) {
      map['i_cloud_id'] = i0.Variable<String>(iCloudId);
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
    {
      map['playback_style'] = i0.Variable<int>(
        i1.$TrashedLocalAssetEntityTable.$converterplaybackStyle.toSql(
          playbackStyle,
        ),
      );
    }
    map['name'] = i0.Variable<String>(name);
    {
      map['type'] = i0.Variable<int>(
        i1.$TrashedLocalAssetEntityTable.$convertertype.toSql(type),
      );
    }
    map['created_at'] = i0.Variable<DateTime>(createdAt);
    map['updated_at'] = i0.Variable<DateTime>(updatedAt);
    if (!nullToAbsent || width != null) {
      map['width'] = i0.Variable<int>(width);
    }
    if (!nullToAbsent || height != null) {
      map['height'] = i0.Variable<int>(height);
    }
    if (!nullToAbsent || durationMs != null) {
      map['duration_ms'] = i0.Variable<int>(durationMs);
    }
    map['album_id'] = i0.Variable<String>(albumId);
    {
      map['source'] = i0.Variable<int>(
        i1.$TrashedLocalAssetEntityTable.$convertersource.toSql(source),
      );
    }
    return map;
  }

  factory TrashedLocalAssetEntityData.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return TrashedLocalAssetEntityData(
      id: serializer.fromJson<String>(json['id']),
      checksum: serializer.fromJson<String?>(json['checksum']),
      isFavorite: serializer.fromJson<bool>(json['isFavorite']),
      orientation: serializer.fromJson<int>(json['orientation']),
      iCloudId: serializer.fromJson<String?>(json['iCloudId']),
      adjustmentTime: serializer.fromJson<DateTime?>(json['adjustmentTime']),
      latitude: serializer.fromJson<double?>(json['latitude']),
      longitude: serializer.fromJson<double?>(json['longitude']),
      playbackStyle: i1.$TrashedLocalAssetEntityTable.$converterplaybackStyle
          .fromJson(serializer.fromJson<int>(json['playbackStyle'])),
      name: serializer.fromJson<String>(json['name']),
      type: i1.$TrashedLocalAssetEntityTable.$convertertype.fromJson(
        serializer.fromJson<int>(json['type']),
      ),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      width: serializer.fromJson<int?>(json['width']),
      height: serializer.fromJson<int?>(json['height']),
      durationMs: serializer.fromJson<int?>(json['durationMs']),
      albumId: serializer.fromJson<String>(json['albumId']),
      source: i1.$TrashedLocalAssetEntityTable.$convertersource.fromJson(
        serializer.fromJson<int>(json['source']),
      ),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'checksum': serializer.toJson<String?>(checksum),
      'isFavorite': serializer.toJson<bool>(isFavorite),
      'orientation': serializer.toJson<int>(orientation),
      'iCloudId': serializer.toJson<String?>(iCloudId),
      'adjustmentTime': serializer.toJson<DateTime?>(adjustmentTime),
      'latitude': serializer.toJson<double?>(latitude),
      'longitude': serializer.toJson<double?>(longitude),
      'playbackStyle': serializer.toJson<int>(
        i1.$TrashedLocalAssetEntityTable.$converterplaybackStyle.toJson(
          playbackStyle,
        ),
      ),
      'name': serializer.toJson<String>(name),
      'type': serializer.toJson<int>(
        i1.$TrashedLocalAssetEntityTable.$convertertype.toJson(type),
      ),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'width': serializer.toJson<int?>(width),
      'height': serializer.toJson<int?>(height),
      'durationMs': serializer.toJson<int?>(durationMs),
      'albumId': serializer.toJson<String>(albumId),
      'source': serializer.toJson<int>(
        i1.$TrashedLocalAssetEntityTable.$convertersource.toJson(source),
      ),
    };
  }

  i1.TrashedLocalAssetEntityData copyWith({
    String? id,
    i0.Value<String?> checksum = const i0.Value.absent(),
    bool? isFavorite,
    int? orientation,
    i0.Value<String?> iCloudId = const i0.Value.absent(),
    i0.Value<DateTime?> adjustmentTime = const i0.Value.absent(),
    i0.Value<double?> latitude = const i0.Value.absent(),
    i0.Value<double?> longitude = const i0.Value.absent(),
    i2.AssetPlaybackStyle? playbackStyle,
    String? name,
    i2.AssetType? type,
    DateTime? createdAt,
    DateTime? updatedAt,
    i0.Value<int?> width = const i0.Value.absent(),
    i0.Value<int?> height = const i0.Value.absent(),
    i0.Value<int?> durationMs = const i0.Value.absent(),
    String? albumId,
    i3.TrashOrigin? source,
  }) => i1.TrashedLocalAssetEntityData(
    id: id ?? this.id,
    checksum: checksum.present ? checksum.value : this.checksum,
    isFavorite: isFavorite ?? this.isFavorite,
    orientation: orientation ?? this.orientation,
    iCloudId: iCloudId.present ? iCloudId.value : this.iCloudId,
    adjustmentTime: adjustmentTime.present
        ? adjustmentTime.value
        : this.adjustmentTime,
    latitude: latitude.present ? latitude.value : this.latitude,
    longitude: longitude.present ? longitude.value : this.longitude,
    playbackStyle: playbackStyle ?? this.playbackStyle,
    name: name ?? this.name,
    type: type ?? this.type,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
    width: width.present ? width.value : this.width,
    height: height.present ? height.value : this.height,
    durationMs: durationMs.present ? durationMs.value : this.durationMs,
    albumId: albumId ?? this.albumId,
    source: source ?? this.source,
  );
  TrashedLocalAssetEntityData copyWithCompanion(
    i1.TrashedLocalAssetEntityCompanion data,
  ) {
    return TrashedLocalAssetEntityData(
      id: data.id.present ? data.id.value : this.id,
      checksum: data.checksum.present ? data.checksum.value : this.checksum,
      isFavorite: data.isFavorite.present
          ? data.isFavorite.value
          : this.isFavorite,
      orientation: data.orientation.present
          ? data.orientation.value
          : this.orientation,
      iCloudId: data.iCloudId.present ? data.iCloudId.value : this.iCloudId,
      adjustmentTime: data.adjustmentTime.present
          ? data.adjustmentTime.value
          : this.adjustmentTime,
      latitude: data.latitude.present ? data.latitude.value : this.latitude,
      longitude: data.longitude.present ? data.longitude.value : this.longitude,
      playbackStyle: data.playbackStyle.present
          ? data.playbackStyle.value
          : this.playbackStyle,
      name: data.name.present ? data.name.value : this.name,
      type: data.type.present ? data.type.value : this.type,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      width: data.width.present ? data.width.value : this.width,
      height: data.height.present ? data.height.value : this.height,
      durationMs: data.durationMs.present
          ? data.durationMs.value
          : this.durationMs,
      albumId: data.albumId.present ? data.albumId.value : this.albumId,
      source: data.source.present ? data.source.value : this.source,
    );
  }

  @override
  String toString() {
    return (StringBuffer('TrashedLocalAssetEntityData(')
          ..write('id: $id, ')
          ..write('checksum: $checksum, ')
          ..write('isFavorite: $isFavorite, ')
          ..write('orientation: $orientation, ')
          ..write('iCloudId: $iCloudId, ')
          ..write('adjustmentTime: $adjustmentTime, ')
          ..write('latitude: $latitude, ')
          ..write('longitude: $longitude, ')
          ..write('playbackStyle: $playbackStyle, ')
          ..write('name: $name, ')
          ..write('type: $type, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('width: $width, ')
          ..write('height: $height, ')
          ..write('durationMs: $durationMs, ')
          ..write('albumId: $albumId, ')
          ..write('source: $source')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    checksum,
    isFavorite,
    orientation,
    iCloudId,
    adjustmentTime,
    latitude,
    longitude,
    playbackStyle,
    name,
    type,
    createdAt,
    updatedAt,
    width,
    height,
    durationMs,
    albumId,
    source,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.TrashedLocalAssetEntityData &&
          other.id == this.id &&
          other.checksum == this.checksum &&
          other.isFavorite == this.isFavorite &&
          other.orientation == this.orientation &&
          other.iCloudId == this.iCloudId &&
          other.adjustmentTime == this.adjustmentTime &&
          other.latitude == this.latitude &&
          other.longitude == this.longitude &&
          other.playbackStyle == this.playbackStyle &&
          other.name == this.name &&
          other.type == this.type &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt &&
          other.width == this.width &&
          other.height == this.height &&
          other.durationMs == this.durationMs &&
          other.albumId == this.albumId &&
          other.source == this.source);
}

class TrashedLocalAssetEntityCompanion
    extends i0.UpdateCompanion<i1.TrashedLocalAssetEntityData> {
  final i0.Value<String> id;
  final i0.Value<String?> checksum;
  final i0.Value<bool> isFavorite;
  final i0.Value<int> orientation;
  final i0.Value<String?> iCloudId;
  final i0.Value<DateTime?> adjustmentTime;
  final i0.Value<double?> latitude;
  final i0.Value<double?> longitude;
  final i0.Value<i2.AssetPlaybackStyle> playbackStyle;
  final i0.Value<String> name;
  final i0.Value<i2.AssetType> type;
  final i0.Value<DateTime> createdAt;
  final i0.Value<DateTime> updatedAt;
  final i0.Value<int?> width;
  final i0.Value<int?> height;
  final i0.Value<int?> durationMs;
  final i0.Value<String> albumId;
  final i0.Value<i3.TrashOrigin> source;
  const TrashedLocalAssetEntityCompanion({
    this.id = const i0.Value.absent(),
    this.checksum = const i0.Value.absent(),
    this.isFavorite = const i0.Value.absent(),
    this.orientation = const i0.Value.absent(),
    this.iCloudId = const i0.Value.absent(),
    this.adjustmentTime = const i0.Value.absent(),
    this.latitude = const i0.Value.absent(),
    this.longitude = const i0.Value.absent(),
    this.playbackStyle = const i0.Value.absent(),
    this.name = const i0.Value.absent(),
    this.type = const i0.Value.absent(),
    this.createdAt = const i0.Value.absent(),
    this.updatedAt = const i0.Value.absent(),
    this.width = const i0.Value.absent(),
    this.height = const i0.Value.absent(),
    this.durationMs = const i0.Value.absent(),
    this.albumId = const i0.Value.absent(),
    this.source = const i0.Value.absent(),
  });
  TrashedLocalAssetEntityCompanion.insert({
    required String id,
    this.checksum = const i0.Value.absent(),
    this.isFavorite = const i0.Value.absent(),
    this.orientation = const i0.Value.absent(),
    this.iCloudId = const i0.Value.absent(),
    this.adjustmentTime = const i0.Value.absent(),
    this.latitude = const i0.Value.absent(),
    this.longitude = const i0.Value.absent(),
    this.playbackStyle = const i0.Value.absent(),
    required String name,
    required i2.AssetType type,
    this.createdAt = const i0.Value.absent(),
    this.updatedAt = const i0.Value.absent(),
    this.width = const i0.Value.absent(),
    this.height = const i0.Value.absent(),
    this.durationMs = const i0.Value.absent(),
    required String albumId,
    required i3.TrashOrigin source,
  }) : id = i0.Value(id),
       name = i0.Value(name),
       type = i0.Value(type),
       albumId = i0.Value(albumId),
       source = i0.Value(source);
  static i0.Insertable<i1.TrashedLocalAssetEntityData> custom({
    i0.Expression<String>? id,
    i0.Expression<String>? checksum,
    i0.Expression<bool>? isFavorite,
    i0.Expression<int>? orientation,
    i0.Expression<String>? iCloudId,
    i0.Expression<DateTime>? adjustmentTime,
    i0.Expression<double>? latitude,
    i0.Expression<double>? longitude,
    i0.Expression<int>? playbackStyle,
    i0.Expression<String>? name,
    i0.Expression<int>? type,
    i0.Expression<DateTime>? createdAt,
    i0.Expression<DateTime>? updatedAt,
    i0.Expression<int>? width,
    i0.Expression<int>? height,
    i0.Expression<int>? durationMs,
    i0.Expression<String>? albumId,
    i0.Expression<int>? source,
  }) {
    return i0.RawValuesInsertable({
      if (id != null) 'id': id,
      if (checksum != null) 'checksum': checksum,
      if (isFavorite != null) 'is_favorite': isFavorite,
      if (orientation != null) 'orientation': orientation,
      if (iCloudId != null) 'i_cloud_id': iCloudId,
      if (adjustmentTime != null) 'adjustment_time': adjustmentTime,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (playbackStyle != null) 'playback_style': playbackStyle,
      if (name != null) 'name': name,
      if (type != null) 'type': type,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (width != null) 'width': width,
      if (height != null) 'height': height,
      if (durationMs != null) 'duration_ms': durationMs,
      if (albumId != null) 'album_id': albumId,
      if (source != null) 'source': source,
    });
  }

  i1.TrashedLocalAssetEntityCompanion copyWith({
    i0.Value<String>? id,
    i0.Value<String?>? checksum,
    i0.Value<bool>? isFavorite,
    i0.Value<int>? orientation,
    i0.Value<String?>? iCloudId,
    i0.Value<DateTime?>? adjustmentTime,
    i0.Value<double?>? latitude,
    i0.Value<double?>? longitude,
    i0.Value<i2.AssetPlaybackStyle>? playbackStyle,
    i0.Value<String>? name,
    i0.Value<i2.AssetType>? type,
    i0.Value<DateTime>? createdAt,
    i0.Value<DateTime>? updatedAt,
    i0.Value<int?>? width,
    i0.Value<int?>? height,
    i0.Value<int?>? durationMs,
    i0.Value<String>? albumId,
    i0.Value<i3.TrashOrigin>? source,
  }) {
    return i1.TrashedLocalAssetEntityCompanion(
      id: id ?? this.id,
      checksum: checksum ?? this.checksum,
      isFavorite: isFavorite ?? this.isFavorite,
      orientation: orientation ?? this.orientation,
      iCloudId: iCloudId ?? this.iCloudId,
      adjustmentTime: adjustmentTime ?? this.adjustmentTime,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      playbackStyle: playbackStyle ?? this.playbackStyle,
      name: name ?? this.name,
      type: type ?? this.type,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      width: width ?? this.width,
      height: height ?? this.height,
      durationMs: durationMs ?? this.durationMs,
      albumId: albumId ?? this.albumId,
      source: source ?? this.source,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (id.present) {
      map['id'] = i0.Variable<String>(id.value);
    }
    if (checksum.present) {
      map['checksum'] = i0.Variable<String>(checksum.value);
    }
    if (isFavorite.present) {
      map['is_favorite'] = i0.Variable<bool>(isFavorite.value);
    }
    if (orientation.present) {
      map['orientation'] = i0.Variable<int>(orientation.value);
    }
    if (iCloudId.present) {
      map['i_cloud_id'] = i0.Variable<String>(iCloudId.value);
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
    if (playbackStyle.present) {
      map['playback_style'] = i0.Variable<int>(
        i1.$TrashedLocalAssetEntityTable.$converterplaybackStyle.toSql(
          playbackStyle.value,
        ),
      );
    }
    if (name.present) {
      map['name'] = i0.Variable<String>(name.value);
    }
    if (type.present) {
      map['type'] = i0.Variable<int>(
        i1.$TrashedLocalAssetEntityTable.$convertertype.toSql(type.value),
      );
    }
    if (createdAt.present) {
      map['created_at'] = i0.Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = i0.Variable<DateTime>(updatedAt.value);
    }
    if (width.present) {
      map['width'] = i0.Variable<int>(width.value);
    }
    if (height.present) {
      map['height'] = i0.Variable<int>(height.value);
    }
    if (durationMs.present) {
      map['duration_ms'] = i0.Variable<int>(durationMs.value);
    }
    if (albumId.present) {
      map['album_id'] = i0.Variable<String>(albumId.value);
    }
    if (source.present) {
      map['source'] = i0.Variable<int>(
        i1.$TrashedLocalAssetEntityTable.$convertersource.toSql(source.value),
      );
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('TrashedLocalAssetEntityCompanion(')
          ..write('id: $id, ')
          ..write('checksum: $checksum, ')
          ..write('isFavorite: $isFavorite, ')
          ..write('orientation: $orientation, ')
          ..write('iCloudId: $iCloudId, ')
          ..write('adjustmentTime: $adjustmentTime, ')
          ..write('latitude: $latitude, ')
          ..write('longitude: $longitude, ')
          ..write('playbackStyle: $playbackStyle, ')
          ..write('name: $name, ')
          ..write('type: $type, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('width: $width, ')
          ..write('height: $height, ')
          ..write('durationMs: $durationMs, ')
          ..write('albumId: $albumId, ')
          ..write('source: $source')
          ..write(')'))
        .toString();
  }
}

i0.Index get idxTrashedLocalAssetAlbum => i0.Index(
  'idx_trashed_local_asset_album',
  'CREATE INDEX IF NOT EXISTS idx_trashed_local_asset_album ON trashed_local_asset_entity (album_id)',
);
