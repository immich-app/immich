// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/asset_face.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/asset_face.entity.dart'
    as i2;
import 'package:drift/src/runtime/query_builder/query_builder.dart' as i3;
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart'
    as i4;
import 'package:drift/internal/modular.dart' as i5;
import 'package:immich_mobile/infrastructure/entities/person.entity.drift.dart'
    as i6;

typedef $$AssetFaceEntityTableCreateCompanionBuilder =
    i1.AssetFaceEntityCompanion Function({
      required String id,
      required String assetId,
      i0.Value<String?> personId,
      required int imageWidth,
      required int imageHeight,
      required int boundingBoxX1,
      required int boundingBoxY1,
      required int boundingBoxX2,
      required int boundingBoxY2,
      required String sourceType,
      i0.Value<bool> isVisible,
      i0.Value<DateTime?> deletedAt,
    });
typedef $$AssetFaceEntityTableUpdateCompanionBuilder =
    i1.AssetFaceEntityCompanion Function({
      i0.Value<String> id,
      i0.Value<String> assetId,
      i0.Value<String?> personId,
      i0.Value<int> imageWidth,
      i0.Value<int> imageHeight,
      i0.Value<int> boundingBoxX1,
      i0.Value<int> boundingBoxY1,
      i0.Value<int> boundingBoxX2,
      i0.Value<int> boundingBoxY2,
      i0.Value<String> sourceType,
      i0.Value<bool> isVisible,
      i0.Value<DateTime?> deletedAt,
    });

final class $$AssetFaceEntityTableReferences
    extends
        i0.BaseReferences<
          i0.GeneratedDatabase,
          i1.$AssetFaceEntityTable,
          i1.AssetFaceEntityData
        > {
  $$AssetFaceEntityTableReferences(
    super.$_db,
    super.$_table,
    super.$_typedResult,
  );

  static i4.$RemoteAssetEntityTable _assetIdTable(i0.GeneratedDatabase db) =>
      i5.ReadDatabaseContainer(db)
          .resultSet<i4.$RemoteAssetEntityTable>('remote_asset_entity')
          .createAlias(
            i0.$_aliasNameGenerator(
              i5.ReadDatabaseContainer(db)
                  .resultSet<i1.$AssetFaceEntityTable>('asset_face_entity')
                  .assetId,
              i5.ReadDatabaseContainer(
                db,
              ).resultSet<i4.$RemoteAssetEntityTable>('remote_asset_entity').id,
            ),
          );

  i4.$$RemoteAssetEntityTableProcessedTableManager get assetId {
    final $_column = $_itemColumn<String>('asset_id')!;

    final manager = i4
        .$$RemoteAssetEntityTableTableManager(
          $_db,
          i5.ReadDatabaseContainer(
            $_db,
          ).resultSet<i4.$RemoteAssetEntityTable>('remote_asset_entity'),
        )
        .filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_assetIdTable($_db));
    if (item == null) return manager;
    return i0.ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }

  static i6.$PersonEntityTable _personIdTable(i0.GeneratedDatabase db) =>
      i5.ReadDatabaseContainer(db)
          .resultSet<i6.$PersonEntityTable>('person_entity')
          .createAlias(
            i0.$_aliasNameGenerator(
              i5.ReadDatabaseContainer(db)
                  .resultSet<i1.$AssetFaceEntityTable>('asset_face_entity')
                  .personId,
              i5.ReadDatabaseContainer(
                db,
              ).resultSet<i6.$PersonEntityTable>('person_entity').id,
            ),
          );

  i6.$$PersonEntityTableProcessedTableManager? get personId {
    final $_column = $_itemColumn<String>('person_id');
    if ($_column == null) return null;
    final manager = i6
        .$$PersonEntityTableTableManager(
          $_db,
          i5.ReadDatabaseContainer(
            $_db,
          ).resultSet<i6.$PersonEntityTable>('person_entity'),
        )
        .filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_personIdTable($_db));
    if (item == null) return manager;
    return i0.ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }
}

class $$AssetFaceEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$AssetFaceEntityTable> {
  $$AssetFaceEntityTableFilterComposer({
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

  i0.ColumnFilters<int> get imageWidth => $composableBuilder(
    column: $table.imageWidth,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get imageHeight => $composableBuilder(
    column: $table.imageHeight,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get boundingBoxX1 => $composableBuilder(
    column: $table.boundingBoxX1,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get boundingBoxY1 => $composableBuilder(
    column: $table.boundingBoxY1,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get boundingBoxX2 => $composableBuilder(
    column: $table.boundingBoxX2,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get boundingBoxY2 => $composableBuilder(
    column: $table.boundingBoxY2,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<String> get sourceType => $composableBuilder(
    column: $table.sourceType,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<bool> get isVisible => $composableBuilder(
    column: $table.isVisible,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<DateTime> get deletedAt => $composableBuilder(
    column: $table.deletedAt,
    builder: (column) => i0.ColumnFilters(column),
  );

  i4.$$RemoteAssetEntityTableFilterComposer get assetId {
    final i4.$$RemoteAssetEntityTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.assetId,
      referencedTable: i5.ReadDatabaseContainer(
        $db,
      ).resultSet<i4.$RemoteAssetEntityTable>('remote_asset_entity'),
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => i4.$$RemoteAssetEntityTableFilterComposer(
            $db: $db,
            $table: i5.ReadDatabaseContainer(
              $db,
            ).resultSet<i4.$RemoteAssetEntityTable>('remote_asset_entity'),
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }

  i6.$$PersonEntityTableFilterComposer get personId {
    final i6.$$PersonEntityTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.personId,
      referencedTable: i5.ReadDatabaseContainer(
        $db,
      ).resultSet<i6.$PersonEntityTable>('person_entity'),
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => i6.$$PersonEntityTableFilterComposer(
            $db: $db,
            $table: i5.ReadDatabaseContainer(
              $db,
            ).resultSet<i6.$PersonEntityTable>('person_entity'),
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$AssetFaceEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$AssetFaceEntityTable> {
  $$AssetFaceEntityTableOrderingComposer({
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

  i0.ColumnOrderings<int> get imageWidth => $composableBuilder(
    column: $table.imageWidth,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get imageHeight => $composableBuilder(
    column: $table.imageHeight,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get boundingBoxX1 => $composableBuilder(
    column: $table.boundingBoxX1,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get boundingBoxY1 => $composableBuilder(
    column: $table.boundingBoxY1,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get boundingBoxX2 => $composableBuilder(
    column: $table.boundingBoxX2,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get boundingBoxY2 => $composableBuilder(
    column: $table.boundingBoxY2,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get sourceType => $composableBuilder(
    column: $table.sourceType,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<bool> get isVisible => $composableBuilder(
    column: $table.isVisible,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<DateTime> get deletedAt => $composableBuilder(
    column: $table.deletedAt,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i4.$$RemoteAssetEntityTableOrderingComposer get assetId {
    final i4.$$RemoteAssetEntityTableOrderingComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.assetId,
          referencedTable: i5.ReadDatabaseContainer(
            $db,
          ).resultSet<i4.$RemoteAssetEntityTable>('remote_asset_entity'),
          getReferencedColumn: (t) => t.id,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => i4.$$RemoteAssetEntityTableOrderingComposer(
                $db: $db,
                $table: i5.ReadDatabaseContainer(
                  $db,
                ).resultSet<i4.$RemoteAssetEntityTable>('remote_asset_entity'),
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return composer;
  }

  i6.$$PersonEntityTableOrderingComposer get personId {
    final i6.$$PersonEntityTableOrderingComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.personId,
      referencedTable: i5.ReadDatabaseContainer(
        $db,
      ).resultSet<i6.$PersonEntityTable>('person_entity'),
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => i6.$$PersonEntityTableOrderingComposer(
            $db: $db,
            $table: i5.ReadDatabaseContainer(
              $db,
            ).resultSet<i6.$PersonEntityTable>('person_entity'),
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$AssetFaceEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$AssetFaceEntityTable> {
  $$AssetFaceEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  i0.GeneratedColumn<int> get imageWidth => $composableBuilder(
    column: $table.imageWidth,
    builder: (column) => column,
  );

  i0.GeneratedColumn<int> get imageHeight => $composableBuilder(
    column: $table.imageHeight,
    builder: (column) => column,
  );

  i0.GeneratedColumn<int> get boundingBoxX1 => $composableBuilder(
    column: $table.boundingBoxX1,
    builder: (column) => column,
  );

  i0.GeneratedColumn<int> get boundingBoxY1 => $composableBuilder(
    column: $table.boundingBoxY1,
    builder: (column) => column,
  );

  i0.GeneratedColumn<int> get boundingBoxX2 => $composableBuilder(
    column: $table.boundingBoxX2,
    builder: (column) => column,
  );

  i0.GeneratedColumn<int> get boundingBoxY2 => $composableBuilder(
    column: $table.boundingBoxY2,
    builder: (column) => column,
  );

  i0.GeneratedColumn<String> get sourceType => $composableBuilder(
    column: $table.sourceType,
    builder: (column) => column,
  );

  i0.GeneratedColumn<bool> get isVisible =>
      $composableBuilder(column: $table.isVisible, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get deletedAt =>
      $composableBuilder(column: $table.deletedAt, builder: (column) => column);

  i4.$$RemoteAssetEntityTableAnnotationComposer get assetId {
    final i4.$$RemoteAssetEntityTableAnnotationComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.assetId,
          referencedTable: i5.ReadDatabaseContainer(
            $db,
          ).resultSet<i4.$RemoteAssetEntityTable>('remote_asset_entity'),
          getReferencedColumn: (t) => t.id,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => i4.$$RemoteAssetEntityTableAnnotationComposer(
                $db: $db,
                $table: i5.ReadDatabaseContainer(
                  $db,
                ).resultSet<i4.$RemoteAssetEntityTable>('remote_asset_entity'),
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return composer;
  }

  i6.$$PersonEntityTableAnnotationComposer get personId {
    final i6.$$PersonEntityTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.personId,
      referencedTable: i5.ReadDatabaseContainer(
        $db,
      ).resultSet<i6.$PersonEntityTable>('person_entity'),
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => i6.$$PersonEntityTableAnnotationComposer(
            $db: $db,
            $table: i5.ReadDatabaseContainer(
              $db,
            ).resultSet<i6.$PersonEntityTable>('person_entity'),
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$AssetFaceEntityTableTableManager
    extends
        i0.RootTableManager<
          i0.GeneratedDatabase,
          i1.$AssetFaceEntityTable,
          i1.AssetFaceEntityData,
          i1.$$AssetFaceEntityTableFilterComposer,
          i1.$$AssetFaceEntityTableOrderingComposer,
          i1.$$AssetFaceEntityTableAnnotationComposer,
          $$AssetFaceEntityTableCreateCompanionBuilder,
          $$AssetFaceEntityTableUpdateCompanionBuilder,
          (i1.AssetFaceEntityData, i1.$$AssetFaceEntityTableReferences),
          i1.AssetFaceEntityData,
          i0.PrefetchHooks Function({bool assetId, bool personId})
        > {
  $$AssetFaceEntityTableTableManager(
    i0.GeneratedDatabase db,
    i1.$AssetFaceEntityTable table,
  ) : super(
        i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$AssetFaceEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              i1.$$AssetFaceEntityTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () => i1
              .$$AssetFaceEntityTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                i0.Value<String> id = const i0.Value.absent(),
                i0.Value<String> assetId = const i0.Value.absent(),
                i0.Value<String?> personId = const i0.Value.absent(),
                i0.Value<int> imageWidth = const i0.Value.absent(),
                i0.Value<int> imageHeight = const i0.Value.absent(),
                i0.Value<int> boundingBoxX1 = const i0.Value.absent(),
                i0.Value<int> boundingBoxY1 = const i0.Value.absent(),
                i0.Value<int> boundingBoxX2 = const i0.Value.absent(),
                i0.Value<int> boundingBoxY2 = const i0.Value.absent(),
                i0.Value<String> sourceType = const i0.Value.absent(),
                i0.Value<bool> isVisible = const i0.Value.absent(),
                i0.Value<DateTime?> deletedAt = const i0.Value.absent(),
              }) => i1.AssetFaceEntityCompanion(
                id: id,
                assetId: assetId,
                personId: personId,
                imageWidth: imageWidth,
                imageHeight: imageHeight,
                boundingBoxX1: boundingBoxX1,
                boundingBoxY1: boundingBoxY1,
                boundingBoxX2: boundingBoxX2,
                boundingBoxY2: boundingBoxY2,
                sourceType: sourceType,
                isVisible: isVisible,
                deletedAt: deletedAt,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String assetId,
                i0.Value<String?> personId = const i0.Value.absent(),
                required int imageWidth,
                required int imageHeight,
                required int boundingBoxX1,
                required int boundingBoxY1,
                required int boundingBoxX2,
                required int boundingBoxY2,
                required String sourceType,
                i0.Value<bool> isVisible = const i0.Value.absent(),
                i0.Value<DateTime?> deletedAt = const i0.Value.absent(),
              }) => i1.AssetFaceEntityCompanion.insert(
                id: id,
                assetId: assetId,
                personId: personId,
                imageWidth: imageWidth,
                imageHeight: imageHeight,
                boundingBoxX1: boundingBoxX1,
                boundingBoxY1: boundingBoxY1,
                boundingBoxX2: boundingBoxX2,
                boundingBoxY2: boundingBoxY2,
                sourceType: sourceType,
                isVisible: isVisible,
                deletedAt: deletedAt,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable(table),
                  i1.$$AssetFaceEntityTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: ({assetId = false, personId = false}) {
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
                    if (assetId) {
                      state =
                          state.withJoin(
                                currentTable: table,
                                currentColumn: table.assetId,
                                referencedTable: i1
                                    .$$AssetFaceEntityTableReferences
                                    ._assetIdTable(db),
                                referencedColumn: i1
                                    .$$AssetFaceEntityTableReferences
                                    ._assetIdTable(db)
                                    .id,
                              )
                              as T;
                    }
                    if (personId) {
                      state =
                          state.withJoin(
                                currentTable: table,
                                currentColumn: table.personId,
                                referencedTable: i1
                                    .$$AssetFaceEntityTableReferences
                                    ._personIdTable(db),
                                referencedColumn: i1
                                    .$$AssetFaceEntityTableReferences
                                    ._personIdTable(db)
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

typedef $$AssetFaceEntityTableProcessedTableManager =
    i0.ProcessedTableManager<
      i0.GeneratedDatabase,
      i1.$AssetFaceEntityTable,
      i1.AssetFaceEntityData,
      i1.$$AssetFaceEntityTableFilterComposer,
      i1.$$AssetFaceEntityTableOrderingComposer,
      i1.$$AssetFaceEntityTableAnnotationComposer,
      $$AssetFaceEntityTableCreateCompanionBuilder,
      $$AssetFaceEntityTableUpdateCompanionBuilder,
      (i1.AssetFaceEntityData, i1.$$AssetFaceEntityTableReferences),
      i1.AssetFaceEntityData,
      i0.PrefetchHooks Function({bool assetId, bool personId})
    >;
i0.Index get idxAssetFacePersonId => i0.Index(
  'idx_asset_face_person_id',
  'CREATE INDEX IF NOT EXISTS idx_asset_face_person_id ON asset_face_entity (person_id)',
);

class $AssetFaceEntityTable extends i2.AssetFaceEntity
    with i0.TableInfo<$AssetFaceEntityTable, i1.AssetFaceEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $AssetFaceEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _idMeta = const i0.VerificationMeta('id');
  @override
  late final i0.GeneratedColumn<String> id = i0.GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _assetIdMeta = const i0.VerificationMeta(
    'assetId',
  );
  @override
  late final i0.GeneratedColumn<String> assetId = i0.GeneratedColumn<String>(
    'asset_id',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
      'REFERENCES remote_asset_entity (id) ON DELETE CASCADE',
    ),
  );
  static const i0.VerificationMeta _personIdMeta = const i0.VerificationMeta(
    'personId',
  );
  @override
  late final i0.GeneratedColumn<String> personId = i0.GeneratedColumn<String>(
    'person_id',
    aliasedName,
    true,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: false,
    defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
      'REFERENCES person_entity (id) ON DELETE SET NULL',
    ),
  );
  static const i0.VerificationMeta _imageWidthMeta = const i0.VerificationMeta(
    'imageWidth',
  );
  @override
  late final i0.GeneratedColumn<int> imageWidth = i0.GeneratedColumn<int>(
    'image_width',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _imageHeightMeta = const i0.VerificationMeta(
    'imageHeight',
  );
  @override
  late final i0.GeneratedColumn<int> imageHeight = i0.GeneratedColumn<int>(
    'image_height',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _boundingBoxX1Meta =
      const i0.VerificationMeta('boundingBoxX1');
  @override
  late final i0.GeneratedColumn<int> boundingBoxX1 = i0.GeneratedColumn<int>(
    'bounding_box_x1',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _boundingBoxY1Meta =
      const i0.VerificationMeta('boundingBoxY1');
  @override
  late final i0.GeneratedColumn<int> boundingBoxY1 = i0.GeneratedColumn<int>(
    'bounding_box_y1',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _boundingBoxX2Meta =
      const i0.VerificationMeta('boundingBoxX2');
  @override
  late final i0.GeneratedColumn<int> boundingBoxX2 = i0.GeneratedColumn<int>(
    'bounding_box_x2',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _boundingBoxY2Meta =
      const i0.VerificationMeta('boundingBoxY2');
  @override
  late final i0.GeneratedColumn<int> boundingBoxY2 = i0.GeneratedColumn<int>(
    'bounding_box_y2',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _sourceTypeMeta = const i0.VerificationMeta(
    'sourceType',
  );
  @override
  late final i0.GeneratedColumn<String> sourceType = i0.GeneratedColumn<String>(
    'source_type',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _isVisibleMeta = const i0.VerificationMeta(
    'isVisible',
  );
  @override
  late final i0.GeneratedColumn<bool> isVisible = i0.GeneratedColumn<bool>(
    'is_visible',
    aliasedName,
    false,
    type: i0.DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
      'CHECK ("is_visible" IN (0, 1))',
    ),
    defaultValue: const i3.Constant(true),
  );
  static const i0.VerificationMeta _deletedAtMeta = const i0.VerificationMeta(
    'deletedAt',
  );
  @override
  late final i0.GeneratedColumn<DateTime> deletedAt =
      i0.GeneratedColumn<DateTime>(
        'deleted_at',
        aliasedName,
        true,
        type: i0.DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  @override
  List<i0.GeneratedColumn> get $columns => [
    id,
    assetId,
    personId,
    imageWidth,
    imageHeight,
    boundingBoxX1,
    boundingBoxY1,
    boundingBoxX2,
    boundingBoxY2,
    sourceType,
    isVisible,
    deletedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'asset_face_entity';
  @override
  i0.VerificationContext validateIntegrity(
    i0.Insertable<i1.AssetFaceEntityData> instance, {
    bool isInserting = false,
  }) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('asset_id')) {
      context.handle(
        _assetIdMeta,
        assetId.isAcceptableOrUnknown(data['asset_id']!, _assetIdMeta),
      );
    } else if (isInserting) {
      context.missing(_assetIdMeta);
    }
    if (data.containsKey('person_id')) {
      context.handle(
        _personIdMeta,
        personId.isAcceptableOrUnknown(data['person_id']!, _personIdMeta),
      );
    }
    if (data.containsKey('image_width')) {
      context.handle(
        _imageWidthMeta,
        imageWidth.isAcceptableOrUnknown(data['image_width']!, _imageWidthMeta),
      );
    } else if (isInserting) {
      context.missing(_imageWidthMeta);
    }
    if (data.containsKey('image_height')) {
      context.handle(
        _imageHeightMeta,
        imageHeight.isAcceptableOrUnknown(
          data['image_height']!,
          _imageHeightMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_imageHeightMeta);
    }
    if (data.containsKey('bounding_box_x1')) {
      context.handle(
        _boundingBoxX1Meta,
        boundingBoxX1.isAcceptableOrUnknown(
          data['bounding_box_x1']!,
          _boundingBoxX1Meta,
        ),
      );
    } else if (isInserting) {
      context.missing(_boundingBoxX1Meta);
    }
    if (data.containsKey('bounding_box_y1')) {
      context.handle(
        _boundingBoxY1Meta,
        boundingBoxY1.isAcceptableOrUnknown(
          data['bounding_box_y1']!,
          _boundingBoxY1Meta,
        ),
      );
    } else if (isInserting) {
      context.missing(_boundingBoxY1Meta);
    }
    if (data.containsKey('bounding_box_x2')) {
      context.handle(
        _boundingBoxX2Meta,
        boundingBoxX2.isAcceptableOrUnknown(
          data['bounding_box_x2']!,
          _boundingBoxX2Meta,
        ),
      );
    } else if (isInserting) {
      context.missing(_boundingBoxX2Meta);
    }
    if (data.containsKey('bounding_box_y2')) {
      context.handle(
        _boundingBoxY2Meta,
        boundingBoxY2.isAcceptableOrUnknown(
          data['bounding_box_y2']!,
          _boundingBoxY2Meta,
        ),
      );
    } else if (isInserting) {
      context.missing(_boundingBoxY2Meta);
    }
    if (data.containsKey('source_type')) {
      context.handle(
        _sourceTypeMeta,
        sourceType.isAcceptableOrUnknown(data['source_type']!, _sourceTypeMeta),
      );
    } else if (isInserting) {
      context.missing(_sourceTypeMeta);
    }
    if (data.containsKey('is_visible')) {
      context.handle(
        _isVisibleMeta,
        isVisible.isAcceptableOrUnknown(data['is_visible']!, _isVisibleMeta),
      );
    }
    if (data.containsKey('deleted_at')) {
      context.handle(
        _deletedAtMeta,
        deletedAt.isAcceptableOrUnknown(data['deleted_at']!, _deletedAtMeta),
      );
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {id};
  @override
  i1.AssetFaceEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.AssetFaceEntityData(
      id: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      assetId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}asset_id'],
      )!,
      personId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}person_id'],
      ),
      imageWidth: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}image_width'],
      )!,
      imageHeight: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}image_height'],
      )!,
      boundingBoxX1: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}bounding_box_x1'],
      )!,
      boundingBoxY1: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}bounding_box_y1'],
      )!,
      boundingBoxX2: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}bounding_box_x2'],
      )!,
      boundingBoxY2: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}bounding_box_y2'],
      )!,
      sourceType: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}source_type'],
      )!,
      isVisible: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.bool,
        data['${effectivePrefix}is_visible'],
      )!,
      deletedAt: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.dateTime,
        data['${effectivePrefix}deleted_at'],
      ),
    );
  }

  @override
  $AssetFaceEntityTable createAlias(String alias) {
    return $AssetFaceEntityTable(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class AssetFaceEntityData extends i0.DataClass
    implements i0.Insertable<i1.AssetFaceEntityData> {
  final String id;
  final String assetId;
  final String? personId;
  final int imageWidth;
  final int imageHeight;
  final int boundingBoxX1;
  final int boundingBoxY1;
  final int boundingBoxX2;
  final int boundingBoxY2;
  final String sourceType;
  final bool isVisible;
  final DateTime? deletedAt;
  const AssetFaceEntityData({
    required this.id,
    required this.assetId,
    this.personId,
    required this.imageWidth,
    required this.imageHeight,
    required this.boundingBoxX1,
    required this.boundingBoxY1,
    required this.boundingBoxX2,
    required this.boundingBoxY2,
    required this.sourceType,
    required this.isVisible,
    this.deletedAt,
  });
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['id'] = i0.Variable<String>(id);
    map['asset_id'] = i0.Variable<String>(assetId);
    if (!nullToAbsent || personId != null) {
      map['person_id'] = i0.Variable<String>(personId);
    }
    map['image_width'] = i0.Variable<int>(imageWidth);
    map['image_height'] = i0.Variable<int>(imageHeight);
    map['bounding_box_x1'] = i0.Variable<int>(boundingBoxX1);
    map['bounding_box_y1'] = i0.Variable<int>(boundingBoxY1);
    map['bounding_box_x2'] = i0.Variable<int>(boundingBoxX2);
    map['bounding_box_y2'] = i0.Variable<int>(boundingBoxY2);
    map['source_type'] = i0.Variable<String>(sourceType);
    map['is_visible'] = i0.Variable<bool>(isVisible);
    if (!nullToAbsent || deletedAt != null) {
      map['deleted_at'] = i0.Variable<DateTime>(deletedAt);
    }
    return map;
  }

  factory AssetFaceEntityData.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return AssetFaceEntityData(
      id: serializer.fromJson<String>(json['id']),
      assetId: serializer.fromJson<String>(json['assetId']),
      personId: serializer.fromJson<String?>(json['personId']),
      imageWidth: serializer.fromJson<int>(json['imageWidth']),
      imageHeight: serializer.fromJson<int>(json['imageHeight']),
      boundingBoxX1: serializer.fromJson<int>(json['boundingBoxX1']),
      boundingBoxY1: serializer.fromJson<int>(json['boundingBoxY1']),
      boundingBoxX2: serializer.fromJson<int>(json['boundingBoxX2']),
      boundingBoxY2: serializer.fromJson<int>(json['boundingBoxY2']),
      sourceType: serializer.fromJson<String>(json['sourceType']),
      isVisible: serializer.fromJson<bool>(json['isVisible']),
      deletedAt: serializer.fromJson<DateTime?>(json['deletedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'assetId': serializer.toJson<String>(assetId),
      'personId': serializer.toJson<String?>(personId),
      'imageWidth': serializer.toJson<int>(imageWidth),
      'imageHeight': serializer.toJson<int>(imageHeight),
      'boundingBoxX1': serializer.toJson<int>(boundingBoxX1),
      'boundingBoxY1': serializer.toJson<int>(boundingBoxY1),
      'boundingBoxX2': serializer.toJson<int>(boundingBoxX2),
      'boundingBoxY2': serializer.toJson<int>(boundingBoxY2),
      'sourceType': serializer.toJson<String>(sourceType),
      'isVisible': serializer.toJson<bool>(isVisible),
      'deletedAt': serializer.toJson<DateTime?>(deletedAt),
    };
  }

  i1.AssetFaceEntityData copyWith({
    String? id,
    String? assetId,
    i0.Value<String?> personId = const i0.Value.absent(),
    int? imageWidth,
    int? imageHeight,
    int? boundingBoxX1,
    int? boundingBoxY1,
    int? boundingBoxX2,
    int? boundingBoxY2,
    String? sourceType,
    bool? isVisible,
    i0.Value<DateTime?> deletedAt = const i0.Value.absent(),
  }) => i1.AssetFaceEntityData(
    id: id ?? this.id,
    assetId: assetId ?? this.assetId,
    personId: personId.present ? personId.value : this.personId,
    imageWidth: imageWidth ?? this.imageWidth,
    imageHeight: imageHeight ?? this.imageHeight,
    boundingBoxX1: boundingBoxX1 ?? this.boundingBoxX1,
    boundingBoxY1: boundingBoxY1 ?? this.boundingBoxY1,
    boundingBoxX2: boundingBoxX2 ?? this.boundingBoxX2,
    boundingBoxY2: boundingBoxY2 ?? this.boundingBoxY2,
    sourceType: sourceType ?? this.sourceType,
    isVisible: isVisible ?? this.isVisible,
    deletedAt: deletedAt.present ? deletedAt.value : this.deletedAt,
  );
  AssetFaceEntityData copyWithCompanion(i1.AssetFaceEntityCompanion data) {
    return AssetFaceEntityData(
      id: data.id.present ? data.id.value : this.id,
      assetId: data.assetId.present ? data.assetId.value : this.assetId,
      personId: data.personId.present ? data.personId.value : this.personId,
      imageWidth: data.imageWidth.present
          ? data.imageWidth.value
          : this.imageWidth,
      imageHeight: data.imageHeight.present
          ? data.imageHeight.value
          : this.imageHeight,
      boundingBoxX1: data.boundingBoxX1.present
          ? data.boundingBoxX1.value
          : this.boundingBoxX1,
      boundingBoxY1: data.boundingBoxY1.present
          ? data.boundingBoxY1.value
          : this.boundingBoxY1,
      boundingBoxX2: data.boundingBoxX2.present
          ? data.boundingBoxX2.value
          : this.boundingBoxX2,
      boundingBoxY2: data.boundingBoxY2.present
          ? data.boundingBoxY2.value
          : this.boundingBoxY2,
      sourceType: data.sourceType.present
          ? data.sourceType.value
          : this.sourceType,
      isVisible: data.isVisible.present ? data.isVisible.value : this.isVisible,
      deletedAt: data.deletedAt.present ? data.deletedAt.value : this.deletedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('AssetFaceEntityData(')
          ..write('id: $id, ')
          ..write('assetId: $assetId, ')
          ..write('personId: $personId, ')
          ..write('imageWidth: $imageWidth, ')
          ..write('imageHeight: $imageHeight, ')
          ..write('boundingBoxX1: $boundingBoxX1, ')
          ..write('boundingBoxY1: $boundingBoxY1, ')
          ..write('boundingBoxX2: $boundingBoxX2, ')
          ..write('boundingBoxY2: $boundingBoxY2, ')
          ..write('sourceType: $sourceType, ')
          ..write('isVisible: $isVisible, ')
          ..write('deletedAt: $deletedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    assetId,
    personId,
    imageWidth,
    imageHeight,
    boundingBoxX1,
    boundingBoxY1,
    boundingBoxX2,
    boundingBoxY2,
    sourceType,
    isVisible,
    deletedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.AssetFaceEntityData &&
          other.id == this.id &&
          other.assetId == this.assetId &&
          other.personId == this.personId &&
          other.imageWidth == this.imageWidth &&
          other.imageHeight == this.imageHeight &&
          other.boundingBoxX1 == this.boundingBoxX1 &&
          other.boundingBoxY1 == this.boundingBoxY1 &&
          other.boundingBoxX2 == this.boundingBoxX2 &&
          other.boundingBoxY2 == this.boundingBoxY2 &&
          other.sourceType == this.sourceType &&
          other.isVisible == this.isVisible &&
          other.deletedAt == this.deletedAt);
}

class AssetFaceEntityCompanion
    extends i0.UpdateCompanion<i1.AssetFaceEntityData> {
  final i0.Value<String> id;
  final i0.Value<String> assetId;
  final i0.Value<String?> personId;
  final i0.Value<int> imageWidth;
  final i0.Value<int> imageHeight;
  final i0.Value<int> boundingBoxX1;
  final i0.Value<int> boundingBoxY1;
  final i0.Value<int> boundingBoxX2;
  final i0.Value<int> boundingBoxY2;
  final i0.Value<String> sourceType;
  final i0.Value<bool> isVisible;
  final i0.Value<DateTime?> deletedAt;
  const AssetFaceEntityCompanion({
    this.id = const i0.Value.absent(),
    this.assetId = const i0.Value.absent(),
    this.personId = const i0.Value.absent(),
    this.imageWidth = const i0.Value.absent(),
    this.imageHeight = const i0.Value.absent(),
    this.boundingBoxX1 = const i0.Value.absent(),
    this.boundingBoxY1 = const i0.Value.absent(),
    this.boundingBoxX2 = const i0.Value.absent(),
    this.boundingBoxY2 = const i0.Value.absent(),
    this.sourceType = const i0.Value.absent(),
    this.isVisible = const i0.Value.absent(),
    this.deletedAt = const i0.Value.absent(),
  });
  AssetFaceEntityCompanion.insert({
    required String id,
    required String assetId,
    this.personId = const i0.Value.absent(),
    required int imageWidth,
    required int imageHeight,
    required int boundingBoxX1,
    required int boundingBoxY1,
    required int boundingBoxX2,
    required int boundingBoxY2,
    required String sourceType,
    this.isVisible = const i0.Value.absent(),
    this.deletedAt = const i0.Value.absent(),
  }) : id = i0.Value(id),
       assetId = i0.Value(assetId),
       imageWidth = i0.Value(imageWidth),
       imageHeight = i0.Value(imageHeight),
       boundingBoxX1 = i0.Value(boundingBoxX1),
       boundingBoxY1 = i0.Value(boundingBoxY1),
       boundingBoxX2 = i0.Value(boundingBoxX2),
       boundingBoxY2 = i0.Value(boundingBoxY2),
       sourceType = i0.Value(sourceType);
  static i0.Insertable<i1.AssetFaceEntityData> custom({
    i0.Expression<String>? id,
    i0.Expression<String>? assetId,
    i0.Expression<String>? personId,
    i0.Expression<int>? imageWidth,
    i0.Expression<int>? imageHeight,
    i0.Expression<int>? boundingBoxX1,
    i0.Expression<int>? boundingBoxY1,
    i0.Expression<int>? boundingBoxX2,
    i0.Expression<int>? boundingBoxY2,
    i0.Expression<String>? sourceType,
    i0.Expression<bool>? isVisible,
    i0.Expression<DateTime>? deletedAt,
  }) {
    return i0.RawValuesInsertable({
      if (id != null) 'id': id,
      if (assetId != null) 'asset_id': assetId,
      if (personId != null) 'person_id': personId,
      if (imageWidth != null) 'image_width': imageWidth,
      if (imageHeight != null) 'image_height': imageHeight,
      if (boundingBoxX1 != null) 'bounding_box_x1': boundingBoxX1,
      if (boundingBoxY1 != null) 'bounding_box_y1': boundingBoxY1,
      if (boundingBoxX2 != null) 'bounding_box_x2': boundingBoxX2,
      if (boundingBoxY2 != null) 'bounding_box_y2': boundingBoxY2,
      if (sourceType != null) 'source_type': sourceType,
      if (isVisible != null) 'is_visible': isVisible,
      if (deletedAt != null) 'deleted_at': deletedAt,
    });
  }

  i1.AssetFaceEntityCompanion copyWith({
    i0.Value<String>? id,
    i0.Value<String>? assetId,
    i0.Value<String?>? personId,
    i0.Value<int>? imageWidth,
    i0.Value<int>? imageHeight,
    i0.Value<int>? boundingBoxX1,
    i0.Value<int>? boundingBoxY1,
    i0.Value<int>? boundingBoxX2,
    i0.Value<int>? boundingBoxY2,
    i0.Value<String>? sourceType,
    i0.Value<bool>? isVisible,
    i0.Value<DateTime?>? deletedAt,
  }) {
    return i1.AssetFaceEntityCompanion(
      id: id ?? this.id,
      assetId: assetId ?? this.assetId,
      personId: personId ?? this.personId,
      imageWidth: imageWidth ?? this.imageWidth,
      imageHeight: imageHeight ?? this.imageHeight,
      boundingBoxX1: boundingBoxX1 ?? this.boundingBoxX1,
      boundingBoxY1: boundingBoxY1 ?? this.boundingBoxY1,
      boundingBoxX2: boundingBoxX2 ?? this.boundingBoxX2,
      boundingBoxY2: boundingBoxY2 ?? this.boundingBoxY2,
      sourceType: sourceType ?? this.sourceType,
      isVisible: isVisible ?? this.isVisible,
      deletedAt: deletedAt ?? this.deletedAt,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (id.present) {
      map['id'] = i0.Variable<String>(id.value);
    }
    if (assetId.present) {
      map['asset_id'] = i0.Variable<String>(assetId.value);
    }
    if (personId.present) {
      map['person_id'] = i0.Variable<String>(personId.value);
    }
    if (imageWidth.present) {
      map['image_width'] = i0.Variable<int>(imageWidth.value);
    }
    if (imageHeight.present) {
      map['image_height'] = i0.Variable<int>(imageHeight.value);
    }
    if (boundingBoxX1.present) {
      map['bounding_box_x1'] = i0.Variable<int>(boundingBoxX1.value);
    }
    if (boundingBoxY1.present) {
      map['bounding_box_y1'] = i0.Variable<int>(boundingBoxY1.value);
    }
    if (boundingBoxX2.present) {
      map['bounding_box_x2'] = i0.Variable<int>(boundingBoxX2.value);
    }
    if (boundingBoxY2.present) {
      map['bounding_box_y2'] = i0.Variable<int>(boundingBoxY2.value);
    }
    if (sourceType.present) {
      map['source_type'] = i0.Variable<String>(sourceType.value);
    }
    if (isVisible.present) {
      map['is_visible'] = i0.Variable<bool>(isVisible.value);
    }
    if (deletedAt.present) {
      map['deleted_at'] = i0.Variable<DateTime>(deletedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('AssetFaceEntityCompanion(')
          ..write('id: $id, ')
          ..write('assetId: $assetId, ')
          ..write('personId: $personId, ')
          ..write('imageWidth: $imageWidth, ')
          ..write('imageHeight: $imageHeight, ')
          ..write('boundingBoxX1: $boundingBoxX1, ')
          ..write('boundingBoxY1: $boundingBoxY1, ')
          ..write('boundingBoxX2: $boundingBoxX2, ')
          ..write('boundingBoxY2: $boundingBoxY2, ')
          ..write('sourceType: $sourceType, ')
          ..write('isVisible: $isVisible, ')
          ..write('deletedAt: $deletedAt')
          ..write(')'))
        .toString();
  }
}

i0.Index get idxAssetFaceAssetId => i0.Index(
  'idx_asset_face_asset_id',
  'CREATE INDEX IF NOT EXISTS idx_asset_face_asset_id ON asset_face_entity (asset_id)',
);
