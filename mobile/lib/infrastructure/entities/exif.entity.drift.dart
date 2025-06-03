// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/exif.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/exif.entity.dart' as i2;
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart'
    as i3;
import 'package:drift/internal/modular.dart' as i4;

typedef $$RemoteExifEntityTableCreateCompanionBuilder
    = i1.RemoteExifEntityCompanion Function({
  required String assetId,
  i0.Value<String?> city,
  i0.Value<String?> state,
  i0.Value<String?> country,
  i0.Value<DateTime?> dateTimeOriginal,
  i0.Value<String?> description,
  i0.Value<int?> height,
  i0.Value<int?> width,
  i0.Value<String?> exposureTime,
  i0.Value<int?> fNumber,
  i0.Value<int?> fileSize,
  i0.Value<int?> focalLength,
  i0.Value<int?> latitude,
  i0.Value<int?> longitude,
  i0.Value<int?> iso,
  i0.Value<String?> make,
  i0.Value<String?> model,
  i0.Value<String?> orientation,
  i0.Value<String?> timeZone,
  i0.Value<int?> rating,
  i0.Value<String?> projectionType,
});
typedef $$RemoteExifEntityTableUpdateCompanionBuilder
    = i1.RemoteExifEntityCompanion Function({
  i0.Value<String> assetId,
  i0.Value<String?> city,
  i0.Value<String?> state,
  i0.Value<String?> country,
  i0.Value<DateTime?> dateTimeOriginal,
  i0.Value<String?> description,
  i0.Value<int?> height,
  i0.Value<int?> width,
  i0.Value<String?> exposureTime,
  i0.Value<int?> fNumber,
  i0.Value<int?> fileSize,
  i0.Value<int?> focalLength,
  i0.Value<int?> latitude,
  i0.Value<int?> longitude,
  i0.Value<int?> iso,
  i0.Value<String?> make,
  i0.Value<String?> model,
  i0.Value<String?> orientation,
  i0.Value<String?> timeZone,
  i0.Value<int?> rating,
  i0.Value<String?> projectionType,
});

final class $$RemoteExifEntityTableReferences extends i0.BaseReferences<
    i0.GeneratedDatabase, i1.$RemoteExifEntityTable, i1.RemoteExifEntityData> {
  $$RemoteExifEntityTableReferences(
      super.$_db, super.$_table, super.$_typedResult);

  static i3.$RemoteAssetEntityTable _assetIdTable(i0.GeneratedDatabase db) =>
      i4.ReadDatabaseContainer(db)
          .resultSet<i3.$RemoteAssetEntityTable>('remote_asset_entity')
          .createAlias(i0.$_aliasNameGenerator(
              i4.ReadDatabaseContainer(db)
                  .resultSet<i1.$RemoteExifEntityTable>('remote_exif_entity')
                  .assetId,
              i4.ReadDatabaseContainer(db)
                  .resultSet<i3.$RemoteAssetEntityTable>('remote_asset_entity')
                  .id));

  i3.$$RemoteAssetEntityTableProcessedTableManager get assetId {
    final $_column = $_itemColumn<String>('asset_id')!;

    final manager = i3
        .$$RemoteAssetEntityTableTableManager(
            $_db,
            i4.ReadDatabaseContainer($_db)
                .resultSet<i3.$RemoteAssetEntityTable>('remote_asset_entity'))
        .filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_assetIdTable($_db));
    if (item == null) return manager;
    return i0.ProcessedTableManager(
        manager.$state.copyWith(prefetchedData: [item]));
  }
}

class $$RemoteExifEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$RemoteExifEntityTable> {
  $$RemoteExifEntityTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnFilters<String> get city => $composableBuilder(
      column: $table.city, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get state => $composableBuilder(
      column: $table.state, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get country => $composableBuilder(
      column: $table.country, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<DateTime> get dateTimeOriginal => $composableBuilder(
      column: $table.dateTimeOriginal,
      builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get description => $composableBuilder(
      column: $table.description,
      builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<int> get height => $composableBuilder(
      column: $table.height, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<int> get width => $composableBuilder(
      column: $table.width, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get exposureTime => $composableBuilder(
      column: $table.exposureTime,
      builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<int> get fNumber => $composableBuilder(
      column: $table.fNumber, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<int> get fileSize => $composableBuilder(
      column: $table.fileSize, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<int> get focalLength => $composableBuilder(
      column: $table.focalLength,
      builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<int> get latitude => $composableBuilder(
      column: $table.latitude, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<int> get longitude => $composableBuilder(
      column: $table.longitude, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<int> get iso => $composableBuilder(
      column: $table.iso, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get make => $composableBuilder(
      column: $table.make, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get model => $composableBuilder(
      column: $table.model, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get orientation => $composableBuilder(
      column: $table.orientation,
      builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get timeZone => $composableBuilder(
      column: $table.timeZone, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<int> get rating => $composableBuilder(
      column: $table.rating, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get projectionType => $composableBuilder(
      column: $table.projectionType,
      builder: (column) => i0.ColumnFilters(column));

  i3.$$RemoteAssetEntityTableFilterComposer get assetId {
    final i3.$$RemoteAssetEntityTableFilterComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.assetId,
        referencedTable: i4.ReadDatabaseContainer($db)
            .resultSet<i3.$RemoteAssetEntityTable>('remote_asset_entity'),
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            i3.$$RemoteAssetEntityTableFilterComposer(
              $db: $db,
              $table: i4.ReadDatabaseContainer($db)
                  .resultSet<i3.$RemoteAssetEntityTable>('remote_asset_entity'),
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$RemoteExifEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$RemoteExifEntityTable> {
  $$RemoteExifEntityTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnOrderings<String> get city => $composableBuilder(
      column: $table.city, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get state => $composableBuilder(
      column: $table.state, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get country => $composableBuilder(
      column: $table.country, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<DateTime> get dateTimeOriginal => $composableBuilder(
      column: $table.dateTimeOriginal,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get description => $composableBuilder(
      column: $table.description,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<int> get height => $composableBuilder(
      column: $table.height, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<int> get width => $composableBuilder(
      column: $table.width, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get exposureTime => $composableBuilder(
      column: $table.exposureTime,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<int> get fNumber => $composableBuilder(
      column: $table.fNumber, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<int> get fileSize => $composableBuilder(
      column: $table.fileSize, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<int> get focalLength => $composableBuilder(
      column: $table.focalLength,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<int> get latitude => $composableBuilder(
      column: $table.latitude, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<int> get longitude => $composableBuilder(
      column: $table.longitude,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<int> get iso => $composableBuilder(
      column: $table.iso, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get make => $composableBuilder(
      column: $table.make, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get model => $composableBuilder(
      column: $table.model, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get orientation => $composableBuilder(
      column: $table.orientation,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get timeZone => $composableBuilder(
      column: $table.timeZone, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<int> get rating => $composableBuilder(
      column: $table.rating, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get projectionType => $composableBuilder(
      column: $table.projectionType,
      builder: (column) => i0.ColumnOrderings(column));

  i3.$$RemoteAssetEntityTableOrderingComposer get assetId {
    final i3.$$RemoteAssetEntityTableOrderingComposer composer =
        $composerBuilder(
            composer: this,
            getCurrentColumn: (t) => t.assetId,
            referencedTable: i4.ReadDatabaseContainer($db)
                .resultSet<i3.$RemoteAssetEntityTable>('remote_asset_entity'),
            getReferencedColumn: (t) => t.id,
            builder: (joinBuilder,
                    {$addJoinBuilderToRootComposer,
                    $removeJoinBuilderFromRootComposer}) =>
                i3.$$RemoteAssetEntityTableOrderingComposer(
                  $db: $db,
                  $table: i4.ReadDatabaseContainer($db)
                      .resultSet<i3.$RemoteAssetEntityTable>(
                          'remote_asset_entity'),
                  $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                  joinBuilder: joinBuilder,
                  $removeJoinBuilderFromRootComposer:
                      $removeJoinBuilderFromRootComposer,
                ));
    return composer;
  }
}

class $$RemoteExifEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$RemoteExifEntityTable> {
  $$RemoteExifEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<String> get city =>
      $composableBuilder(column: $table.city, builder: (column) => column);

  i0.GeneratedColumn<String> get state =>
      $composableBuilder(column: $table.state, builder: (column) => column);

  i0.GeneratedColumn<String> get country =>
      $composableBuilder(column: $table.country, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get dateTimeOriginal => $composableBuilder(
      column: $table.dateTimeOriginal, builder: (column) => column);

  i0.GeneratedColumn<String> get description => $composableBuilder(
      column: $table.description, builder: (column) => column);

  i0.GeneratedColumn<int> get height =>
      $composableBuilder(column: $table.height, builder: (column) => column);

  i0.GeneratedColumn<int> get width =>
      $composableBuilder(column: $table.width, builder: (column) => column);

  i0.GeneratedColumn<String> get exposureTime => $composableBuilder(
      column: $table.exposureTime, builder: (column) => column);

  i0.GeneratedColumn<int> get fNumber =>
      $composableBuilder(column: $table.fNumber, builder: (column) => column);

  i0.GeneratedColumn<int> get fileSize =>
      $composableBuilder(column: $table.fileSize, builder: (column) => column);

  i0.GeneratedColumn<int> get focalLength => $composableBuilder(
      column: $table.focalLength, builder: (column) => column);

  i0.GeneratedColumn<int> get latitude =>
      $composableBuilder(column: $table.latitude, builder: (column) => column);

  i0.GeneratedColumn<int> get longitude =>
      $composableBuilder(column: $table.longitude, builder: (column) => column);

  i0.GeneratedColumn<int> get iso =>
      $composableBuilder(column: $table.iso, builder: (column) => column);

  i0.GeneratedColumn<String> get make =>
      $composableBuilder(column: $table.make, builder: (column) => column);

  i0.GeneratedColumn<String> get model =>
      $composableBuilder(column: $table.model, builder: (column) => column);

  i0.GeneratedColumn<String> get orientation => $composableBuilder(
      column: $table.orientation, builder: (column) => column);

  i0.GeneratedColumn<String> get timeZone =>
      $composableBuilder(column: $table.timeZone, builder: (column) => column);

  i0.GeneratedColumn<int> get rating =>
      $composableBuilder(column: $table.rating, builder: (column) => column);

  i0.GeneratedColumn<String> get projectionType => $composableBuilder(
      column: $table.projectionType, builder: (column) => column);

  i3.$$RemoteAssetEntityTableAnnotationComposer get assetId {
    final i3.$$RemoteAssetEntityTableAnnotationComposer composer =
        $composerBuilder(
            composer: this,
            getCurrentColumn: (t) => t.assetId,
            referencedTable: i4.ReadDatabaseContainer($db)
                .resultSet<i3.$RemoteAssetEntityTable>('remote_asset_entity'),
            getReferencedColumn: (t) => t.id,
            builder: (joinBuilder,
                    {$addJoinBuilderToRootComposer,
                    $removeJoinBuilderFromRootComposer}) =>
                i3.$$RemoteAssetEntityTableAnnotationComposer(
                  $db: $db,
                  $table: i4.ReadDatabaseContainer($db)
                      .resultSet<i3.$RemoteAssetEntityTable>(
                          'remote_asset_entity'),
                  $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                  joinBuilder: joinBuilder,
                  $removeJoinBuilderFromRootComposer:
                      $removeJoinBuilderFromRootComposer,
                ));
    return composer;
  }
}

class $$RemoteExifEntityTableTableManager extends i0.RootTableManager<
    i0.GeneratedDatabase,
    i1.$RemoteExifEntityTable,
    i1.RemoteExifEntityData,
    i1.$$RemoteExifEntityTableFilterComposer,
    i1.$$RemoteExifEntityTableOrderingComposer,
    i1.$$RemoteExifEntityTableAnnotationComposer,
    $$RemoteExifEntityTableCreateCompanionBuilder,
    $$RemoteExifEntityTableUpdateCompanionBuilder,
    (i1.RemoteExifEntityData, i1.$$RemoteExifEntityTableReferences),
    i1.RemoteExifEntityData,
    i0.PrefetchHooks Function({bool assetId})> {
  $$RemoteExifEntityTableTableManager(
      i0.GeneratedDatabase db, i1.$RemoteExifEntityTable table)
      : super(i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$RemoteExifEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () => i1
              .$$RemoteExifEntityTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              i1.$$RemoteExifEntityTableAnnotationComposer(
                  $db: db, $table: table),
          updateCompanionCallback: ({
            i0.Value<String> assetId = const i0.Value.absent(),
            i0.Value<String?> city = const i0.Value.absent(),
            i0.Value<String?> state = const i0.Value.absent(),
            i0.Value<String?> country = const i0.Value.absent(),
            i0.Value<DateTime?> dateTimeOriginal = const i0.Value.absent(),
            i0.Value<String?> description = const i0.Value.absent(),
            i0.Value<int?> height = const i0.Value.absent(),
            i0.Value<int?> width = const i0.Value.absent(),
            i0.Value<String?> exposureTime = const i0.Value.absent(),
            i0.Value<int?> fNumber = const i0.Value.absent(),
            i0.Value<int?> fileSize = const i0.Value.absent(),
            i0.Value<int?> focalLength = const i0.Value.absent(),
            i0.Value<int?> latitude = const i0.Value.absent(),
            i0.Value<int?> longitude = const i0.Value.absent(),
            i0.Value<int?> iso = const i0.Value.absent(),
            i0.Value<String?> make = const i0.Value.absent(),
            i0.Value<String?> model = const i0.Value.absent(),
            i0.Value<String?> orientation = const i0.Value.absent(),
            i0.Value<String?> timeZone = const i0.Value.absent(),
            i0.Value<int?> rating = const i0.Value.absent(),
            i0.Value<String?> projectionType = const i0.Value.absent(),
          }) =>
              i1.RemoteExifEntityCompanion(
            assetId: assetId,
            city: city,
            state: state,
            country: country,
            dateTimeOriginal: dateTimeOriginal,
            description: description,
            height: height,
            width: width,
            exposureTime: exposureTime,
            fNumber: fNumber,
            fileSize: fileSize,
            focalLength: focalLength,
            latitude: latitude,
            longitude: longitude,
            iso: iso,
            make: make,
            model: model,
            orientation: orientation,
            timeZone: timeZone,
            rating: rating,
            projectionType: projectionType,
          ),
          createCompanionCallback: ({
            required String assetId,
            i0.Value<String?> city = const i0.Value.absent(),
            i0.Value<String?> state = const i0.Value.absent(),
            i0.Value<String?> country = const i0.Value.absent(),
            i0.Value<DateTime?> dateTimeOriginal = const i0.Value.absent(),
            i0.Value<String?> description = const i0.Value.absent(),
            i0.Value<int?> height = const i0.Value.absent(),
            i0.Value<int?> width = const i0.Value.absent(),
            i0.Value<String?> exposureTime = const i0.Value.absent(),
            i0.Value<int?> fNumber = const i0.Value.absent(),
            i0.Value<int?> fileSize = const i0.Value.absent(),
            i0.Value<int?> focalLength = const i0.Value.absent(),
            i0.Value<int?> latitude = const i0.Value.absent(),
            i0.Value<int?> longitude = const i0.Value.absent(),
            i0.Value<int?> iso = const i0.Value.absent(),
            i0.Value<String?> make = const i0.Value.absent(),
            i0.Value<String?> model = const i0.Value.absent(),
            i0.Value<String?> orientation = const i0.Value.absent(),
            i0.Value<String?> timeZone = const i0.Value.absent(),
            i0.Value<int?> rating = const i0.Value.absent(),
            i0.Value<String?> projectionType = const i0.Value.absent(),
          }) =>
              i1.RemoteExifEntityCompanion.insert(
            assetId: assetId,
            city: city,
            state: state,
            country: country,
            dateTimeOriginal: dateTimeOriginal,
            description: description,
            height: height,
            width: width,
            exposureTime: exposureTime,
            fNumber: fNumber,
            fileSize: fileSize,
            focalLength: focalLength,
            latitude: latitude,
            longitude: longitude,
            iso: iso,
            make: make,
            model: model,
            orientation: orientation,
            timeZone: timeZone,
            rating: rating,
            projectionType: projectionType,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (
                    e.readTable(table),
                    i1.$$RemoteExifEntityTableReferences(db, table, e)
                  ))
              .toList(),
          prefetchHooksCallback: ({assetId = false}) {
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
                    referencedTable:
                        i1.$$RemoteExifEntityTableReferences._assetIdTable(db),
                    referencedColumn: i1.$$RemoteExifEntityTableReferences
                        ._assetIdTable(db)
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

typedef $$RemoteExifEntityTableProcessedTableManager = i0.ProcessedTableManager<
    i0.GeneratedDatabase,
    i1.$RemoteExifEntityTable,
    i1.RemoteExifEntityData,
    i1.$$RemoteExifEntityTableFilterComposer,
    i1.$$RemoteExifEntityTableOrderingComposer,
    i1.$$RemoteExifEntityTableAnnotationComposer,
    $$RemoteExifEntityTableCreateCompanionBuilder,
    $$RemoteExifEntityTableUpdateCompanionBuilder,
    (i1.RemoteExifEntityData, i1.$$RemoteExifEntityTableReferences),
    i1.RemoteExifEntityData,
    i0.PrefetchHooks Function({bool assetId})>;

class $RemoteExifEntityTable extends i2.RemoteExifEntity
    with i0.TableInfo<$RemoteExifEntityTable, i1.RemoteExifEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $RemoteExifEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _assetIdMeta =
      const i0.VerificationMeta('assetId');
  @override
  late final i0.GeneratedColumn<String> assetId = i0.GeneratedColumn<String>(
      'asset_id', aliasedName, false,
      type: i0.DriftSqlType.string,
      requiredDuringInsert: true,
      defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
          'REFERENCES remote_asset_entity (id) ON DELETE CASCADE'));
  static const i0.VerificationMeta _cityMeta =
      const i0.VerificationMeta('city');
  @override
  late final i0.GeneratedColumn<String> city = i0.GeneratedColumn<String>(
      'city', aliasedName, true,
      type: i0.DriftSqlType.string, requiredDuringInsert: false);
  static const i0.VerificationMeta _stateMeta =
      const i0.VerificationMeta('state');
  @override
  late final i0.GeneratedColumn<String> state = i0.GeneratedColumn<String>(
      'state', aliasedName, true,
      type: i0.DriftSqlType.string, requiredDuringInsert: false);
  static const i0.VerificationMeta _countryMeta =
      const i0.VerificationMeta('country');
  @override
  late final i0.GeneratedColumn<String> country = i0.GeneratedColumn<String>(
      'country', aliasedName, true,
      type: i0.DriftSqlType.string, requiredDuringInsert: false);
  static const i0.VerificationMeta _dateTimeOriginalMeta =
      const i0.VerificationMeta('dateTimeOriginal');
  @override
  late final i0.GeneratedColumn<DateTime> dateTimeOriginal =
      i0.GeneratedColumn<DateTime>('date_time_original', aliasedName, true,
          type: i0.DriftSqlType.dateTime, requiredDuringInsert: false);
  static const i0.VerificationMeta _descriptionMeta =
      const i0.VerificationMeta('description');
  @override
  late final i0.GeneratedColumn<String> description =
      i0.GeneratedColumn<String>('description', aliasedName, true,
          type: i0.DriftSqlType.string, requiredDuringInsert: false);
  static const i0.VerificationMeta _heightMeta =
      const i0.VerificationMeta('height');
  @override
  late final i0.GeneratedColumn<int> height = i0.GeneratedColumn<int>(
      'height', aliasedName, true,
      type: i0.DriftSqlType.int, requiredDuringInsert: false);
  static const i0.VerificationMeta _widthMeta =
      const i0.VerificationMeta('width');
  @override
  late final i0.GeneratedColumn<int> width = i0.GeneratedColumn<int>(
      'width', aliasedName, true,
      type: i0.DriftSqlType.int, requiredDuringInsert: false);
  static const i0.VerificationMeta _exposureTimeMeta =
      const i0.VerificationMeta('exposureTime');
  @override
  late final i0.GeneratedColumn<String> exposureTime =
      i0.GeneratedColumn<String>('exposure_time', aliasedName, true,
          type: i0.DriftSqlType.string, requiredDuringInsert: false);
  static const i0.VerificationMeta _fNumberMeta =
      const i0.VerificationMeta('fNumber');
  @override
  late final i0.GeneratedColumn<int> fNumber = i0.GeneratedColumn<int>(
      'f_number', aliasedName, true,
      type: i0.DriftSqlType.int, requiredDuringInsert: false);
  static const i0.VerificationMeta _fileSizeMeta =
      const i0.VerificationMeta('fileSize');
  @override
  late final i0.GeneratedColumn<int> fileSize = i0.GeneratedColumn<int>(
      'file_size', aliasedName, true,
      type: i0.DriftSqlType.int, requiredDuringInsert: false);
  static const i0.VerificationMeta _focalLengthMeta =
      const i0.VerificationMeta('focalLength');
  @override
  late final i0.GeneratedColumn<int> focalLength = i0.GeneratedColumn<int>(
      'focal_length', aliasedName, true,
      type: i0.DriftSqlType.int, requiredDuringInsert: false);
  static const i0.VerificationMeta _latitudeMeta =
      const i0.VerificationMeta('latitude');
  @override
  late final i0.GeneratedColumn<int> latitude = i0.GeneratedColumn<int>(
      'latitude', aliasedName, true,
      type: i0.DriftSqlType.int, requiredDuringInsert: false);
  static const i0.VerificationMeta _longitudeMeta =
      const i0.VerificationMeta('longitude');
  @override
  late final i0.GeneratedColumn<int> longitude = i0.GeneratedColumn<int>(
      'longitude', aliasedName, true,
      type: i0.DriftSqlType.int, requiredDuringInsert: false);
  static const i0.VerificationMeta _isoMeta = const i0.VerificationMeta('iso');
  @override
  late final i0.GeneratedColumn<int> iso = i0.GeneratedColumn<int>(
      'iso', aliasedName, true,
      type: i0.DriftSqlType.int, requiredDuringInsert: false);
  static const i0.VerificationMeta _makeMeta =
      const i0.VerificationMeta('make');
  @override
  late final i0.GeneratedColumn<String> make = i0.GeneratedColumn<String>(
      'make', aliasedName, true,
      type: i0.DriftSqlType.string, requiredDuringInsert: false);
  static const i0.VerificationMeta _modelMeta =
      const i0.VerificationMeta('model');
  @override
  late final i0.GeneratedColumn<String> model = i0.GeneratedColumn<String>(
      'model', aliasedName, true,
      type: i0.DriftSqlType.string, requiredDuringInsert: false);
  static const i0.VerificationMeta _orientationMeta =
      const i0.VerificationMeta('orientation');
  @override
  late final i0.GeneratedColumn<String> orientation =
      i0.GeneratedColumn<String>('orientation', aliasedName, true,
          type: i0.DriftSqlType.string, requiredDuringInsert: false);
  static const i0.VerificationMeta _timeZoneMeta =
      const i0.VerificationMeta('timeZone');
  @override
  late final i0.GeneratedColumn<String> timeZone = i0.GeneratedColumn<String>(
      'time_zone', aliasedName, true,
      type: i0.DriftSqlType.string, requiredDuringInsert: false);
  static const i0.VerificationMeta _ratingMeta =
      const i0.VerificationMeta('rating');
  @override
  late final i0.GeneratedColumn<int> rating = i0.GeneratedColumn<int>(
      'rating', aliasedName, true,
      type: i0.DriftSqlType.int, requiredDuringInsert: false);
  static const i0.VerificationMeta _projectionTypeMeta =
      const i0.VerificationMeta('projectionType');
  @override
  late final i0.GeneratedColumn<String> projectionType =
      i0.GeneratedColumn<String>('projection_type', aliasedName, true,
          type: i0.DriftSqlType.string, requiredDuringInsert: false);
  @override
  List<i0.GeneratedColumn> get $columns => [
        assetId,
        city,
        state,
        country,
        dateTimeOriginal,
        description,
        height,
        width,
        exposureTime,
        fNumber,
        fileSize,
        focalLength,
        latitude,
        longitude,
        iso,
        make,
        model,
        orientation,
        timeZone,
        rating,
        projectionType
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'remote_exif_entity';
  @override
  i0.VerificationContext validateIntegrity(
      i0.Insertable<i1.RemoteExifEntityData> instance,
      {bool isInserting = false}) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('asset_id')) {
      context.handle(_assetIdMeta,
          assetId.isAcceptableOrUnknown(data['asset_id']!, _assetIdMeta));
    } else if (isInserting) {
      context.missing(_assetIdMeta);
    }
    if (data.containsKey('city')) {
      context.handle(
          _cityMeta, city.isAcceptableOrUnknown(data['city']!, _cityMeta));
    }
    if (data.containsKey('state')) {
      context.handle(
          _stateMeta, state.isAcceptableOrUnknown(data['state']!, _stateMeta));
    }
    if (data.containsKey('country')) {
      context.handle(_countryMeta,
          country.isAcceptableOrUnknown(data['country']!, _countryMeta));
    }
    if (data.containsKey('date_time_original')) {
      context.handle(
          _dateTimeOriginalMeta,
          dateTimeOriginal.isAcceptableOrUnknown(
              data['date_time_original']!, _dateTimeOriginalMeta));
    }
    if (data.containsKey('description')) {
      context.handle(
          _descriptionMeta,
          description.isAcceptableOrUnknown(
              data['description']!, _descriptionMeta));
    }
    if (data.containsKey('height')) {
      context.handle(_heightMeta,
          height.isAcceptableOrUnknown(data['height']!, _heightMeta));
    }
    if (data.containsKey('width')) {
      context.handle(
          _widthMeta, width.isAcceptableOrUnknown(data['width']!, _widthMeta));
    }
    if (data.containsKey('exposure_time')) {
      context.handle(
          _exposureTimeMeta,
          exposureTime.isAcceptableOrUnknown(
              data['exposure_time']!, _exposureTimeMeta));
    }
    if (data.containsKey('f_number')) {
      context.handle(_fNumberMeta,
          fNumber.isAcceptableOrUnknown(data['f_number']!, _fNumberMeta));
    }
    if (data.containsKey('file_size')) {
      context.handle(_fileSizeMeta,
          fileSize.isAcceptableOrUnknown(data['file_size']!, _fileSizeMeta));
    }
    if (data.containsKey('focal_length')) {
      context.handle(
          _focalLengthMeta,
          focalLength.isAcceptableOrUnknown(
              data['focal_length']!, _focalLengthMeta));
    }
    if (data.containsKey('latitude')) {
      context.handle(_latitudeMeta,
          latitude.isAcceptableOrUnknown(data['latitude']!, _latitudeMeta));
    }
    if (data.containsKey('longitude')) {
      context.handle(_longitudeMeta,
          longitude.isAcceptableOrUnknown(data['longitude']!, _longitudeMeta));
    }
    if (data.containsKey('iso')) {
      context.handle(
          _isoMeta, iso.isAcceptableOrUnknown(data['iso']!, _isoMeta));
    }
    if (data.containsKey('make')) {
      context.handle(
          _makeMeta, make.isAcceptableOrUnknown(data['make']!, _makeMeta));
    }
    if (data.containsKey('model')) {
      context.handle(
          _modelMeta, model.isAcceptableOrUnknown(data['model']!, _modelMeta));
    }
    if (data.containsKey('orientation')) {
      context.handle(
          _orientationMeta,
          orientation.isAcceptableOrUnknown(
              data['orientation']!, _orientationMeta));
    }
    if (data.containsKey('time_zone')) {
      context.handle(_timeZoneMeta,
          timeZone.isAcceptableOrUnknown(data['time_zone']!, _timeZoneMeta));
    }
    if (data.containsKey('rating')) {
      context.handle(_ratingMeta,
          rating.isAcceptableOrUnknown(data['rating']!, _ratingMeta));
    }
    if (data.containsKey('projection_type')) {
      context.handle(
          _projectionTypeMeta,
          projectionType.isAcceptableOrUnknown(
              data['projection_type']!, _projectionTypeMeta));
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {assetId};
  @override
  i1.RemoteExifEntityData map(Map<String, dynamic> data,
      {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.RemoteExifEntityData(
      assetId: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}asset_id'])!,
      city: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}city']),
      state: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}state']),
      country: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}country']),
      dateTimeOriginal: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.dateTime,
          data['${effectivePrefix}date_time_original']),
      description: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}description']),
      height: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.int, data['${effectivePrefix}height']),
      width: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.int, data['${effectivePrefix}width']),
      exposureTime: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.string, data['${effectivePrefix}exposure_time']),
      fNumber: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.int, data['${effectivePrefix}f_number']),
      fileSize: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.int, data['${effectivePrefix}file_size']),
      focalLength: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.int, data['${effectivePrefix}focal_length']),
      latitude: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.int, data['${effectivePrefix}latitude']),
      longitude: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.int, data['${effectivePrefix}longitude']),
      iso: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.int, data['${effectivePrefix}iso']),
      make: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}make']),
      model: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}model']),
      orientation: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}orientation']),
      timeZone: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}time_zone']),
      rating: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.int, data['${effectivePrefix}rating']),
      projectionType: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.string, data['${effectivePrefix}projection_type']),
    );
  }

  @override
  $RemoteExifEntityTable createAlias(String alias) {
    return $RemoteExifEntityTable(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class RemoteExifEntityData extends i0.DataClass
    implements i0.Insertable<i1.RemoteExifEntityData> {
  final String assetId;
  final String? city;
  final String? state;
  final String? country;
  final DateTime? dateTimeOriginal;
  final String? description;
  final int? height;
  final int? width;
  final String? exposureTime;
  final int? fNumber;
  final int? fileSize;
  final int? focalLength;
  final int? latitude;
  final int? longitude;
  final int? iso;
  final String? make;
  final String? model;
  final String? orientation;
  final String? timeZone;
  final int? rating;
  final String? projectionType;
  const RemoteExifEntityData(
      {required this.assetId,
      this.city,
      this.state,
      this.country,
      this.dateTimeOriginal,
      this.description,
      this.height,
      this.width,
      this.exposureTime,
      this.fNumber,
      this.fileSize,
      this.focalLength,
      this.latitude,
      this.longitude,
      this.iso,
      this.make,
      this.model,
      this.orientation,
      this.timeZone,
      this.rating,
      this.projectionType});
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['asset_id'] = i0.Variable<String>(assetId);
    if (!nullToAbsent || city != null) {
      map['city'] = i0.Variable<String>(city);
    }
    if (!nullToAbsent || state != null) {
      map['state'] = i0.Variable<String>(state);
    }
    if (!nullToAbsent || country != null) {
      map['country'] = i0.Variable<String>(country);
    }
    if (!nullToAbsent || dateTimeOriginal != null) {
      map['date_time_original'] = i0.Variable<DateTime>(dateTimeOriginal);
    }
    if (!nullToAbsent || description != null) {
      map['description'] = i0.Variable<String>(description);
    }
    if (!nullToAbsent || height != null) {
      map['height'] = i0.Variable<int>(height);
    }
    if (!nullToAbsent || width != null) {
      map['width'] = i0.Variable<int>(width);
    }
    if (!nullToAbsent || exposureTime != null) {
      map['exposure_time'] = i0.Variable<String>(exposureTime);
    }
    if (!nullToAbsent || fNumber != null) {
      map['f_number'] = i0.Variable<int>(fNumber);
    }
    if (!nullToAbsent || fileSize != null) {
      map['file_size'] = i0.Variable<int>(fileSize);
    }
    if (!nullToAbsent || focalLength != null) {
      map['focal_length'] = i0.Variable<int>(focalLength);
    }
    if (!nullToAbsent || latitude != null) {
      map['latitude'] = i0.Variable<int>(latitude);
    }
    if (!nullToAbsent || longitude != null) {
      map['longitude'] = i0.Variable<int>(longitude);
    }
    if (!nullToAbsent || iso != null) {
      map['iso'] = i0.Variable<int>(iso);
    }
    if (!nullToAbsent || make != null) {
      map['make'] = i0.Variable<String>(make);
    }
    if (!nullToAbsent || model != null) {
      map['model'] = i0.Variable<String>(model);
    }
    if (!nullToAbsent || orientation != null) {
      map['orientation'] = i0.Variable<String>(orientation);
    }
    if (!nullToAbsent || timeZone != null) {
      map['time_zone'] = i0.Variable<String>(timeZone);
    }
    if (!nullToAbsent || rating != null) {
      map['rating'] = i0.Variable<int>(rating);
    }
    if (!nullToAbsent || projectionType != null) {
      map['projection_type'] = i0.Variable<String>(projectionType);
    }
    return map;
  }

  factory RemoteExifEntityData.fromJson(Map<String, dynamic> json,
      {i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return RemoteExifEntityData(
      assetId: serializer.fromJson<String>(json['assetId']),
      city: serializer.fromJson<String?>(json['city']),
      state: serializer.fromJson<String?>(json['state']),
      country: serializer.fromJson<String?>(json['country']),
      dateTimeOriginal:
          serializer.fromJson<DateTime?>(json['dateTimeOriginal']),
      description: serializer.fromJson<String?>(json['description']),
      height: serializer.fromJson<int?>(json['height']),
      width: serializer.fromJson<int?>(json['width']),
      exposureTime: serializer.fromJson<String?>(json['exposureTime']),
      fNumber: serializer.fromJson<int?>(json['fNumber']),
      fileSize: serializer.fromJson<int?>(json['fileSize']),
      focalLength: serializer.fromJson<int?>(json['focalLength']),
      latitude: serializer.fromJson<int?>(json['latitude']),
      longitude: serializer.fromJson<int?>(json['longitude']),
      iso: serializer.fromJson<int?>(json['iso']),
      make: serializer.fromJson<String?>(json['make']),
      model: serializer.fromJson<String?>(json['model']),
      orientation: serializer.fromJson<String?>(json['orientation']),
      timeZone: serializer.fromJson<String?>(json['timeZone']),
      rating: serializer.fromJson<int?>(json['rating']),
      projectionType: serializer.fromJson<String?>(json['projectionType']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'assetId': serializer.toJson<String>(assetId),
      'city': serializer.toJson<String?>(city),
      'state': serializer.toJson<String?>(state),
      'country': serializer.toJson<String?>(country),
      'dateTimeOriginal': serializer.toJson<DateTime?>(dateTimeOriginal),
      'description': serializer.toJson<String?>(description),
      'height': serializer.toJson<int?>(height),
      'width': serializer.toJson<int?>(width),
      'exposureTime': serializer.toJson<String?>(exposureTime),
      'fNumber': serializer.toJson<int?>(fNumber),
      'fileSize': serializer.toJson<int?>(fileSize),
      'focalLength': serializer.toJson<int?>(focalLength),
      'latitude': serializer.toJson<int?>(latitude),
      'longitude': serializer.toJson<int?>(longitude),
      'iso': serializer.toJson<int?>(iso),
      'make': serializer.toJson<String?>(make),
      'model': serializer.toJson<String?>(model),
      'orientation': serializer.toJson<String?>(orientation),
      'timeZone': serializer.toJson<String?>(timeZone),
      'rating': serializer.toJson<int?>(rating),
      'projectionType': serializer.toJson<String?>(projectionType),
    };
  }

  i1.RemoteExifEntityData copyWith(
          {String? assetId,
          i0.Value<String?> city = const i0.Value.absent(),
          i0.Value<String?> state = const i0.Value.absent(),
          i0.Value<String?> country = const i0.Value.absent(),
          i0.Value<DateTime?> dateTimeOriginal = const i0.Value.absent(),
          i0.Value<String?> description = const i0.Value.absent(),
          i0.Value<int?> height = const i0.Value.absent(),
          i0.Value<int?> width = const i0.Value.absent(),
          i0.Value<String?> exposureTime = const i0.Value.absent(),
          i0.Value<int?> fNumber = const i0.Value.absent(),
          i0.Value<int?> fileSize = const i0.Value.absent(),
          i0.Value<int?> focalLength = const i0.Value.absent(),
          i0.Value<int?> latitude = const i0.Value.absent(),
          i0.Value<int?> longitude = const i0.Value.absent(),
          i0.Value<int?> iso = const i0.Value.absent(),
          i0.Value<String?> make = const i0.Value.absent(),
          i0.Value<String?> model = const i0.Value.absent(),
          i0.Value<String?> orientation = const i0.Value.absent(),
          i0.Value<String?> timeZone = const i0.Value.absent(),
          i0.Value<int?> rating = const i0.Value.absent(),
          i0.Value<String?> projectionType = const i0.Value.absent()}) =>
      i1.RemoteExifEntityData(
        assetId: assetId ?? this.assetId,
        city: city.present ? city.value : this.city,
        state: state.present ? state.value : this.state,
        country: country.present ? country.value : this.country,
        dateTimeOriginal: dateTimeOriginal.present
            ? dateTimeOriginal.value
            : this.dateTimeOriginal,
        description: description.present ? description.value : this.description,
        height: height.present ? height.value : this.height,
        width: width.present ? width.value : this.width,
        exposureTime:
            exposureTime.present ? exposureTime.value : this.exposureTime,
        fNumber: fNumber.present ? fNumber.value : this.fNumber,
        fileSize: fileSize.present ? fileSize.value : this.fileSize,
        focalLength: focalLength.present ? focalLength.value : this.focalLength,
        latitude: latitude.present ? latitude.value : this.latitude,
        longitude: longitude.present ? longitude.value : this.longitude,
        iso: iso.present ? iso.value : this.iso,
        make: make.present ? make.value : this.make,
        model: model.present ? model.value : this.model,
        orientation: orientation.present ? orientation.value : this.orientation,
        timeZone: timeZone.present ? timeZone.value : this.timeZone,
        rating: rating.present ? rating.value : this.rating,
        projectionType:
            projectionType.present ? projectionType.value : this.projectionType,
      );
  RemoteExifEntityData copyWithCompanion(i1.RemoteExifEntityCompanion data) {
    return RemoteExifEntityData(
      assetId: data.assetId.present ? data.assetId.value : this.assetId,
      city: data.city.present ? data.city.value : this.city,
      state: data.state.present ? data.state.value : this.state,
      country: data.country.present ? data.country.value : this.country,
      dateTimeOriginal: data.dateTimeOriginal.present
          ? data.dateTimeOriginal.value
          : this.dateTimeOriginal,
      description:
          data.description.present ? data.description.value : this.description,
      height: data.height.present ? data.height.value : this.height,
      width: data.width.present ? data.width.value : this.width,
      exposureTime: data.exposureTime.present
          ? data.exposureTime.value
          : this.exposureTime,
      fNumber: data.fNumber.present ? data.fNumber.value : this.fNumber,
      fileSize: data.fileSize.present ? data.fileSize.value : this.fileSize,
      focalLength:
          data.focalLength.present ? data.focalLength.value : this.focalLength,
      latitude: data.latitude.present ? data.latitude.value : this.latitude,
      longitude: data.longitude.present ? data.longitude.value : this.longitude,
      iso: data.iso.present ? data.iso.value : this.iso,
      make: data.make.present ? data.make.value : this.make,
      model: data.model.present ? data.model.value : this.model,
      orientation:
          data.orientation.present ? data.orientation.value : this.orientation,
      timeZone: data.timeZone.present ? data.timeZone.value : this.timeZone,
      rating: data.rating.present ? data.rating.value : this.rating,
      projectionType: data.projectionType.present
          ? data.projectionType.value
          : this.projectionType,
    );
  }

  @override
  String toString() {
    return (StringBuffer('RemoteExifEntityData(')
          ..write('assetId: $assetId, ')
          ..write('city: $city, ')
          ..write('state: $state, ')
          ..write('country: $country, ')
          ..write('dateTimeOriginal: $dateTimeOriginal, ')
          ..write('description: $description, ')
          ..write('height: $height, ')
          ..write('width: $width, ')
          ..write('exposureTime: $exposureTime, ')
          ..write('fNumber: $fNumber, ')
          ..write('fileSize: $fileSize, ')
          ..write('focalLength: $focalLength, ')
          ..write('latitude: $latitude, ')
          ..write('longitude: $longitude, ')
          ..write('iso: $iso, ')
          ..write('make: $make, ')
          ..write('model: $model, ')
          ..write('orientation: $orientation, ')
          ..write('timeZone: $timeZone, ')
          ..write('rating: $rating, ')
          ..write('projectionType: $projectionType')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hashAll([
        assetId,
        city,
        state,
        country,
        dateTimeOriginal,
        description,
        height,
        width,
        exposureTime,
        fNumber,
        fileSize,
        focalLength,
        latitude,
        longitude,
        iso,
        make,
        model,
        orientation,
        timeZone,
        rating,
        projectionType
      ]);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.RemoteExifEntityData &&
          other.assetId == this.assetId &&
          other.city == this.city &&
          other.state == this.state &&
          other.country == this.country &&
          other.dateTimeOriginal == this.dateTimeOriginal &&
          other.description == this.description &&
          other.height == this.height &&
          other.width == this.width &&
          other.exposureTime == this.exposureTime &&
          other.fNumber == this.fNumber &&
          other.fileSize == this.fileSize &&
          other.focalLength == this.focalLength &&
          other.latitude == this.latitude &&
          other.longitude == this.longitude &&
          other.iso == this.iso &&
          other.make == this.make &&
          other.model == this.model &&
          other.orientation == this.orientation &&
          other.timeZone == this.timeZone &&
          other.rating == this.rating &&
          other.projectionType == this.projectionType);
}

class RemoteExifEntityCompanion
    extends i0.UpdateCompanion<i1.RemoteExifEntityData> {
  final i0.Value<String> assetId;
  final i0.Value<String?> city;
  final i0.Value<String?> state;
  final i0.Value<String?> country;
  final i0.Value<DateTime?> dateTimeOriginal;
  final i0.Value<String?> description;
  final i0.Value<int?> height;
  final i0.Value<int?> width;
  final i0.Value<String?> exposureTime;
  final i0.Value<int?> fNumber;
  final i0.Value<int?> fileSize;
  final i0.Value<int?> focalLength;
  final i0.Value<int?> latitude;
  final i0.Value<int?> longitude;
  final i0.Value<int?> iso;
  final i0.Value<String?> make;
  final i0.Value<String?> model;
  final i0.Value<String?> orientation;
  final i0.Value<String?> timeZone;
  final i0.Value<int?> rating;
  final i0.Value<String?> projectionType;
  const RemoteExifEntityCompanion({
    this.assetId = const i0.Value.absent(),
    this.city = const i0.Value.absent(),
    this.state = const i0.Value.absent(),
    this.country = const i0.Value.absent(),
    this.dateTimeOriginal = const i0.Value.absent(),
    this.description = const i0.Value.absent(),
    this.height = const i0.Value.absent(),
    this.width = const i0.Value.absent(),
    this.exposureTime = const i0.Value.absent(),
    this.fNumber = const i0.Value.absent(),
    this.fileSize = const i0.Value.absent(),
    this.focalLength = const i0.Value.absent(),
    this.latitude = const i0.Value.absent(),
    this.longitude = const i0.Value.absent(),
    this.iso = const i0.Value.absent(),
    this.make = const i0.Value.absent(),
    this.model = const i0.Value.absent(),
    this.orientation = const i0.Value.absent(),
    this.timeZone = const i0.Value.absent(),
    this.rating = const i0.Value.absent(),
    this.projectionType = const i0.Value.absent(),
  });
  RemoteExifEntityCompanion.insert({
    required String assetId,
    this.city = const i0.Value.absent(),
    this.state = const i0.Value.absent(),
    this.country = const i0.Value.absent(),
    this.dateTimeOriginal = const i0.Value.absent(),
    this.description = const i0.Value.absent(),
    this.height = const i0.Value.absent(),
    this.width = const i0.Value.absent(),
    this.exposureTime = const i0.Value.absent(),
    this.fNumber = const i0.Value.absent(),
    this.fileSize = const i0.Value.absent(),
    this.focalLength = const i0.Value.absent(),
    this.latitude = const i0.Value.absent(),
    this.longitude = const i0.Value.absent(),
    this.iso = const i0.Value.absent(),
    this.make = const i0.Value.absent(),
    this.model = const i0.Value.absent(),
    this.orientation = const i0.Value.absent(),
    this.timeZone = const i0.Value.absent(),
    this.rating = const i0.Value.absent(),
    this.projectionType = const i0.Value.absent(),
  }) : assetId = i0.Value(assetId);
  static i0.Insertable<i1.RemoteExifEntityData> custom({
    i0.Expression<String>? assetId,
    i0.Expression<String>? city,
    i0.Expression<String>? state,
    i0.Expression<String>? country,
    i0.Expression<DateTime>? dateTimeOriginal,
    i0.Expression<String>? description,
    i0.Expression<int>? height,
    i0.Expression<int>? width,
    i0.Expression<String>? exposureTime,
    i0.Expression<int>? fNumber,
    i0.Expression<int>? fileSize,
    i0.Expression<int>? focalLength,
    i0.Expression<int>? latitude,
    i0.Expression<int>? longitude,
    i0.Expression<int>? iso,
    i0.Expression<String>? make,
    i0.Expression<String>? model,
    i0.Expression<String>? orientation,
    i0.Expression<String>? timeZone,
    i0.Expression<int>? rating,
    i0.Expression<String>? projectionType,
  }) {
    return i0.RawValuesInsertable({
      if (assetId != null) 'asset_id': assetId,
      if (city != null) 'city': city,
      if (state != null) 'state': state,
      if (country != null) 'country': country,
      if (dateTimeOriginal != null) 'date_time_original': dateTimeOriginal,
      if (description != null) 'description': description,
      if (height != null) 'height': height,
      if (width != null) 'width': width,
      if (exposureTime != null) 'exposure_time': exposureTime,
      if (fNumber != null) 'f_number': fNumber,
      if (fileSize != null) 'file_size': fileSize,
      if (focalLength != null) 'focal_length': focalLength,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (iso != null) 'iso': iso,
      if (make != null) 'make': make,
      if (model != null) 'model': model,
      if (orientation != null) 'orientation': orientation,
      if (timeZone != null) 'time_zone': timeZone,
      if (rating != null) 'rating': rating,
      if (projectionType != null) 'projection_type': projectionType,
    });
  }

  i1.RemoteExifEntityCompanion copyWith(
      {i0.Value<String>? assetId,
      i0.Value<String?>? city,
      i0.Value<String?>? state,
      i0.Value<String?>? country,
      i0.Value<DateTime?>? dateTimeOriginal,
      i0.Value<String?>? description,
      i0.Value<int?>? height,
      i0.Value<int?>? width,
      i0.Value<String?>? exposureTime,
      i0.Value<int?>? fNumber,
      i0.Value<int?>? fileSize,
      i0.Value<int?>? focalLength,
      i0.Value<int?>? latitude,
      i0.Value<int?>? longitude,
      i0.Value<int?>? iso,
      i0.Value<String?>? make,
      i0.Value<String?>? model,
      i0.Value<String?>? orientation,
      i0.Value<String?>? timeZone,
      i0.Value<int?>? rating,
      i0.Value<String?>? projectionType}) {
    return i1.RemoteExifEntityCompanion(
      assetId: assetId ?? this.assetId,
      city: city ?? this.city,
      state: state ?? this.state,
      country: country ?? this.country,
      dateTimeOriginal: dateTimeOriginal ?? this.dateTimeOriginal,
      description: description ?? this.description,
      height: height ?? this.height,
      width: width ?? this.width,
      exposureTime: exposureTime ?? this.exposureTime,
      fNumber: fNumber ?? this.fNumber,
      fileSize: fileSize ?? this.fileSize,
      focalLength: focalLength ?? this.focalLength,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      iso: iso ?? this.iso,
      make: make ?? this.make,
      model: model ?? this.model,
      orientation: orientation ?? this.orientation,
      timeZone: timeZone ?? this.timeZone,
      rating: rating ?? this.rating,
      projectionType: projectionType ?? this.projectionType,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (assetId.present) {
      map['asset_id'] = i0.Variable<String>(assetId.value);
    }
    if (city.present) {
      map['city'] = i0.Variable<String>(city.value);
    }
    if (state.present) {
      map['state'] = i0.Variable<String>(state.value);
    }
    if (country.present) {
      map['country'] = i0.Variable<String>(country.value);
    }
    if (dateTimeOriginal.present) {
      map['date_time_original'] = i0.Variable<DateTime>(dateTimeOriginal.value);
    }
    if (description.present) {
      map['description'] = i0.Variable<String>(description.value);
    }
    if (height.present) {
      map['height'] = i0.Variable<int>(height.value);
    }
    if (width.present) {
      map['width'] = i0.Variable<int>(width.value);
    }
    if (exposureTime.present) {
      map['exposure_time'] = i0.Variable<String>(exposureTime.value);
    }
    if (fNumber.present) {
      map['f_number'] = i0.Variable<int>(fNumber.value);
    }
    if (fileSize.present) {
      map['file_size'] = i0.Variable<int>(fileSize.value);
    }
    if (focalLength.present) {
      map['focal_length'] = i0.Variable<int>(focalLength.value);
    }
    if (latitude.present) {
      map['latitude'] = i0.Variable<int>(latitude.value);
    }
    if (longitude.present) {
      map['longitude'] = i0.Variable<int>(longitude.value);
    }
    if (iso.present) {
      map['iso'] = i0.Variable<int>(iso.value);
    }
    if (make.present) {
      map['make'] = i0.Variable<String>(make.value);
    }
    if (model.present) {
      map['model'] = i0.Variable<String>(model.value);
    }
    if (orientation.present) {
      map['orientation'] = i0.Variable<String>(orientation.value);
    }
    if (timeZone.present) {
      map['time_zone'] = i0.Variable<String>(timeZone.value);
    }
    if (rating.present) {
      map['rating'] = i0.Variable<int>(rating.value);
    }
    if (projectionType.present) {
      map['projection_type'] = i0.Variable<String>(projectionType.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('RemoteExifEntityCompanion(')
          ..write('assetId: $assetId, ')
          ..write('city: $city, ')
          ..write('state: $state, ')
          ..write('country: $country, ')
          ..write('dateTimeOriginal: $dateTimeOriginal, ')
          ..write('description: $description, ')
          ..write('height: $height, ')
          ..write('width: $width, ')
          ..write('exposureTime: $exposureTime, ')
          ..write('fNumber: $fNumber, ')
          ..write('fileSize: $fileSize, ')
          ..write('focalLength: $focalLength, ')
          ..write('latitude: $latitude, ')
          ..write('longitude: $longitude, ')
          ..write('iso: $iso, ')
          ..write('make: $make, ')
          ..write('model: $model, ')
          ..write('orientation: $orientation, ')
          ..write('timeZone: $timeZone, ')
          ..write('rating: $rating, ')
          ..write('projectionType: $projectionType')
          ..write(')'))
        .toString();
  }
}
