// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/asset_ocr.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/asset_ocr.entity.dart'
    as i2;
import 'package:drift/src/runtime/query_builder/query_builder.dart' as i3;
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart'
    as i4;
import 'package:drift/internal/modular.dart' as i5;

typedef $$AssetOcrEntityTableCreateCompanionBuilder =
    i1.AssetOcrEntityCompanion Function({
      required String id,
      required String assetId,
      required double x1,
      required double y1,
      required double x2,
      required double y2,
      required double x3,
      required double y3,
      required double x4,
      required double y4,
      required double boxScore,
      required double textScore,
      required String recognizedText,
      i0.Value<bool> isVisible,
    });
typedef $$AssetOcrEntityTableUpdateCompanionBuilder =
    i1.AssetOcrEntityCompanion Function({
      i0.Value<String> id,
      i0.Value<String> assetId,
      i0.Value<double> x1,
      i0.Value<double> y1,
      i0.Value<double> x2,
      i0.Value<double> y2,
      i0.Value<double> x3,
      i0.Value<double> y3,
      i0.Value<double> x4,
      i0.Value<double> y4,
      i0.Value<double> boxScore,
      i0.Value<double> textScore,
      i0.Value<String> recognizedText,
      i0.Value<bool> isVisible,
    });

final class $$AssetOcrEntityTableReferences
    extends
        i0.BaseReferences<
          i0.GeneratedDatabase,
          i1.$AssetOcrEntityTable,
          i1.AssetOcrEntityData
        > {
  $$AssetOcrEntityTableReferences(
    super.$_db,
    super.$_table,
    super.$_typedResult,
  );

  static i4.$RemoteAssetEntityTable _assetIdTable(i0.GeneratedDatabase db) =>
      i5.ReadDatabaseContainer(db)
          .resultSet<i4.$RemoteAssetEntityTable>('remote_asset_entity')
          .createAlias('asset_ocr_entity__asset_id__remote_asset_entity__id');

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
}

class $$AssetOcrEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$AssetOcrEntityTable> {
  $$AssetOcrEntityTableFilterComposer({
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

  i0.ColumnFilters<double> get x1 => $composableBuilder(
    column: $table.x1,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<double> get y1 => $composableBuilder(
    column: $table.y1,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<double> get x2 => $composableBuilder(
    column: $table.x2,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<double> get y2 => $composableBuilder(
    column: $table.y2,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<double> get x3 => $composableBuilder(
    column: $table.x3,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<double> get y3 => $composableBuilder(
    column: $table.y3,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<double> get x4 => $composableBuilder(
    column: $table.x4,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<double> get y4 => $composableBuilder(
    column: $table.y4,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<double> get boxScore => $composableBuilder(
    column: $table.boxScore,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<double> get textScore => $composableBuilder(
    column: $table.textScore,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<String> get recognizedText => $composableBuilder(
    column: $table.recognizedText,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<bool> get isVisible => $composableBuilder(
    column: $table.isVisible,
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
}

class $$AssetOcrEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$AssetOcrEntityTable> {
  $$AssetOcrEntityTableOrderingComposer({
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

  i0.ColumnOrderings<double> get x1 => $composableBuilder(
    column: $table.x1,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<double> get y1 => $composableBuilder(
    column: $table.y1,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<double> get x2 => $composableBuilder(
    column: $table.x2,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<double> get y2 => $composableBuilder(
    column: $table.y2,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<double> get x3 => $composableBuilder(
    column: $table.x3,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<double> get y3 => $composableBuilder(
    column: $table.y3,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<double> get x4 => $composableBuilder(
    column: $table.x4,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<double> get y4 => $composableBuilder(
    column: $table.y4,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<double> get boxScore => $composableBuilder(
    column: $table.boxScore,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<double> get textScore => $composableBuilder(
    column: $table.textScore,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get recognizedText => $composableBuilder(
    column: $table.recognizedText,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<bool> get isVisible => $composableBuilder(
    column: $table.isVisible,
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
}

class $$AssetOcrEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$AssetOcrEntityTable> {
  $$AssetOcrEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  i0.GeneratedColumn<double> get x1 =>
      $composableBuilder(column: $table.x1, builder: (column) => column);

  i0.GeneratedColumn<double> get y1 =>
      $composableBuilder(column: $table.y1, builder: (column) => column);

  i0.GeneratedColumn<double> get x2 =>
      $composableBuilder(column: $table.x2, builder: (column) => column);

  i0.GeneratedColumn<double> get y2 =>
      $composableBuilder(column: $table.y2, builder: (column) => column);

  i0.GeneratedColumn<double> get x3 =>
      $composableBuilder(column: $table.x3, builder: (column) => column);

  i0.GeneratedColumn<double> get y3 =>
      $composableBuilder(column: $table.y3, builder: (column) => column);

  i0.GeneratedColumn<double> get x4 =>
      $composableBuilder(column: $table.x4, builder: (column) => column);

  i0.GeneratedColumn<double> get y4 =>
      $composableBuilder(column: $table.y4, builder: (column) => column);

  i0.GeneratedColumn<double> get boxScore =>
      $composableBuilder(column: $table.boxScore, builder: (column) => column);

  i0.GeneratedColumn<double> get textScore =>
      $composableBuilder(column: $table.textScore, builder: (column) => column);

  i0.GeneratedColumn<String> get recognizedText => $composableBuilder(
    column: $table.recognizedText,
    builder: (column) => column,
  );

  i0.GeneratedColumn<bool> get isVisible =>
      $composableBuilder(column: $table.isVisible, builder: (column) => column);

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
}

class $$AssetOcrEntityTableTableManager
    extends
        i0.RootTableManager<
          i0.GeneratedDatabase,
          i1.$AssetOcrEntityTable,
          i1.AssetOcrEntityData,
          i1.$$AssetOcrEntityTableFilterComposer,
          i1.$$AssetOcrEntityTableOrderingComposer,
          i1.$$AssetOcrEntityTableAnnotationComposer,
          $$AssetOcrEntityTableCreateCompanionBuilder,
          $$AssetOcrEntityTableUpdateCompanionBuilder,
          (i1.AssetOcrEntityData, i1.$$AssetOcrEntityTableReferences),
          i1.AssetOcrEntityData,
          i0.PrefetchHooks Function({bool assetId})
        > {
  $$AssetOcrEntityTableTableManager(
    i0.GeneratedDatabase db,
    i1.$AssetOcrEntityTable table,
  ) : super(
        i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$AssetOcrEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              i1.$$AssetOcrEntityTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () => i1
              .$$AssetOcrEntityTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                i0.Value<String> id = const i0.Value.absent(),
                i0.Value<String> assetId = const i0.Value.absent(),
                i0.Value<double> x1 = const i0.Value.absent(),
                i0.Value<double> y1 = const i0.Value.absent(),
                i0.Value<double> x2 = const i0.Value.absent(),
                i0.Value<double> y2 = const i0.Value.absent(),
                i0.Value<double> x3 = const i0.Value.absent(),
                i0.Value<double> y3 = const i0.Value.absent(),
                i0.Value<double> x4 = const i0.Value.absent(),
                i0.Value<double> y4 = const i0.Value.absent(),
                i0.Value<double> boxScore = const i0.Value.absent(),
                i0.Value<double> textScore = const i0.Value.absent(),
                i0.Value<String> recognizedText = const i0.Value.absent(),
                i0.Value<bool> isVisible = const i0.Value.absent(),
              }) => i1.AssetOcrEntityCompanion(
                id: id,
                assetId: assetId,
                x1: x1,
                y1: y1,
                x2: x2,
                y2: y2,
                x3: x3,
                y3: y3,
                x4: x4,
                y4: y4,
                boxScore: boxScore,
                textScore: textScore,
                recognizedText: recognizedText,
                isVisible: isVisible,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String assetId,
                required double x1,
                required double y1,
                required double x2,
                required double y2,
                required double x3,
                required double y3,
                required double x4,
                required double y4,
                required double boxScore,
                required double textScore,
                required String recognizedText,
                i0.Value<bool> isVisible = const i0.Value.absent(),
              }) => i1.AssetOcrEntityCompanion.insert(
                id: id,
                assetId: assetId,
                x1: x1,
                y1: y1,
                x2: x2,
                y2: y2,
                x3: x3,
                y3: y3,
                x4: x4,
                y4: y4,
                boxScore: boxScore,
                textScore: textScore,
                recognizedText: recognizedText,
                isVisible: isVisible,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable(table),
                  i1.$$AssetOcrEntityTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: ({assetId = false}) {
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
                                    .$$AssetOcrEntityTableReferences
                                    ._assetIdTable(db),
                                referencedColumn: i1
                                    .$$AssetOcrEntityTableReferences
                                    ._assetIdTable(db)
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

typedef $$AssetOcrEntityTableProcessedTableManager =
    i0.ProcessedTableManager<
      i0.GeneratedDatabase,
      i1.$AssetOcrEntityTable,
      i1.AssetOcrEntityData,
      i1.$$AssetOcrEntityTableFilterComposer,
      i1.$$AssetOcrEntityTableOrderingComposer,
      i1.$$AssetOcrEntityTableAnnotationComposer,
      $$AssetOcrEntityTableCreateCompanionBuilder,
      $$AssetOcrEntityTableUpdateCompanionBuilder,
      (i1.AssetOcrEntityData, i1.$$AssetOcrEntityTableReferences),
      i1.AssetOcrEntityData,
      i0.PrefetchHooks Function({bool assetId})
    >;
i0.Index get idxAssetOcrAssetId => i0.Index(
  'idx_asset_ocr_asset_id',
  'CREATE INDEX IF NOT EXISTS idx_asset_ocr_asset_id ON asset_ocr_entity (asset_id)',
);

class $AssetOcrEntityTable extends i2.AssetOcrEntity
    with i0.TableInfo<$AssetOcrEntityTable, i1.AssetOcrEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $AssetOcrEntityTable(this.attachedDatabase, [this._alias]);
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
  static const i0.VerificationMeta _x1Meta = const i0.VerificationMeta('x1');
  @override
  late final i0.GeneratedColumn<double> x1 = i0.GeneratedColumn<double>(
    'x1',
    aliasedName,
    false,
    type: i0.DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _y1Meta = const i0.VerificationMeta('y1');
  @override
  late final i0.GeneratedColumn<double> y1 = i0.GeneratedColumn<double>(
    'y1',
    aliasedName,
    false,
    type: i0.DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _x2Meta = const i0.VerificationMeta('x2');
  @override
  late final i0.GeneratedColumn<double> x2 = i0.GeneratedColumn<double>(
    'x2',
    aliasedName,
    false,
    type: i0.DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _y2Meta = const i0.VerificationMeta('y2');
  @override
  late final i0.GeneratedColumn<double> y2 = i0.GeneratedColumn<double>(
    'y2',
    aliasedName,
    false,
    type: i0.DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _x3Meta = const i0.VerificationMeta('x3');
  @override
  late final i0.GeneratedColumn<double> x3 = i0.GeneratedColumn<double>(
    'x3',
    aliasedName,
    false,
    type: i0.DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _y3Meta = const i0.VerificationMeta('y3');
  @override
  late final i0.GeneratedColumn<double> y3 = i0.GeneratedColumn<double>(
    'y3',
    aliasedName,
    false,
    type: i0.DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _x4Meta = const i0.VerificationMeta('x4');
  @override
  late final i0.GeneratedColumn<double> x4 = i0.GeneratedColumn<double>(
    'x4',
    aliasedName,
    false,
    type: i0.DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _y4Meta = const i0.VerificationMeta('y4');
  @override
  late final i0.GeneratedColumn<double> y4 = i0.GeneratedColumn<double>(
    'y4',
    aliasedName,
    false,
    type: i0.DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _boxScoreMeta = const i0.VerificationMeta(
    'boxScore',
  );
  @override
  late final i0.GeneratedColumn<double> boxScore = i0.GeneratedColumn<double>(
    'box_score',
    aliasedName,
    false,
    type: i0.DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _textScoreMeta = const i0.VerificationMeta(
    'textScore',
  );
  @override
  late final i0.GeneratedColumn<double> textScore = i0.GeneratedColumn<double>(
    'text_score',
    aliasedName,
    false,
    type: i0.DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _recognizedTextMeta =
      const i0.VerificationMeta('recognizedText');
  @override
  late final i0.GeneratedColumn<String> recognizedText =
      i0.GeneratedColumn<String>(
        'recognized_text',
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
  @override
  List<i0.GeneratedColumn> get $columns => [
    id,
    assetId,
    x1,
    y1,
    x2,
    y2,
    x3,
    y3,
    x4,
    y4,
    boxScore,
    textScore,
    recognizedText,
    isVisible,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'asset_ocr_entity';
  @override
  i0.VerificationContext validateIntegrity(
    i0.Insertable<i1.AssetOcrEntityData> instance, {
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
    if (data.containsKey('x1')) {
      context.handle(_x1Meta, x1.isAcceptableOrUnknown(data['x1']!, _x1Meta));
    } else if (isInserting) {
      context.missing(_x1Meta);
    }
    if (data.containsKey('y1')) {
      context.handle(_y1Meta, y1.isAcceptableOrUnknown(data['y1']!, _y1Meta));
    } else if (isInserting) {
      context.missing(_y1Meta);
    }
    if (data.containsKey('x2')) {
      context.handle(_x2Meta, x2.isAcceptableOrUnknown(data['x2']!, _x2Meta));
    } else if (isInserting) {
      context.missing(_x2Meta);
    }
    if (data.containsKey('y2')) {
      context.handle(_y2Meta, y2.isAcceptableOrUnknown(data['y2']!, _y2Meta));
    } else if (isInserting) {
      context.missing(_y2Meta);
    }
    if (data.containsKey('x3')) {
      context.handle(_x3Meta, x3.isAcceptableOrUnknown(data['x3']!, _x3Meta));
    } else if (isInserting) {
      context.missing(_x3Meta);
    }
    if (data.containsKey('y3')) {
      context.handle(_y3Meta, y3.isAcceptableOrUnknown(data['y3']!, _y3Meta));
    } else if (isInserting) {
      context.missing(_y3Meta);
    }
    if (data.containsKey('x4')) {
      context.handle(_x4Meta, x4.isAcceptableOrUnknown(data['x4']!, _x4Meta));
    } else if (isInserting) {
      context.missing(_x4Meta);
    }
    if (data.containsKey('y4')) {
      context.handle(_y4Meta, y4.isAcceptableOrUnknown(data['y4']!, _y4Meta));
    } else if (isInserting) {
      context.missing(_y4Meta);
    }
    if (data.containsKey('box_score')) {
      context.handle(
        _boxScoreMeta,
        boxScore.isAcceptableOrUnknown(data['box_score']!, _boxScoreMeta),
      );
    } else if (isInserting) {
      context.missing(_boxScoreMeta);
    }
    if (data.containsKey('text_score')) {
      context.handle(
        _textScoreMeta,
        textScore.isAcceptableOrUnknown(data['text_score']!, _textScoreMeta),
      );
    } else if (isInserting) {
      context.missing(_textScoreMeta);
    }
    if (data.containsKey('recognized_text')) {
      context.handle(
        _recognizedTextMeta,
        recognizedText.isAcceptableOrUnknown(
          data['recognized_text']!,
          _recognizedTextMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_recognizedTextMeta);
    }
    if (data.containsKey('is_visible')) {
      context.handle(
        _isVisibleMeta,
        isVisible.isAcceptableOrUnknown(data['is_visible']!, _isVisibleMeta),
      );
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {id};
  @override
  i1.AssetOcrEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.AssetOcrEntityData(
      id: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      assetId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}asset_id'],
      )!,
      x1: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.double,
        data['${effectivePrefix}x1'],
      )!,
      y1: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.double,
        data['${effectivePrefix}y1'],
      )!,
      x2: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.double,
        data['${effectivePrefix}x2'],
      )!,
      y2: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.double,
        data['${effectivePrefix}y2'],
      )!,
      x3: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.double,
        data['${effectivePrefix}x3'],
      )!,
      y3: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.double,
        data['${effectivePrefix}y3'],
      )!,
      x4: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.double,
        data['${effectivePrefix}x4'],
      )!,
      y4: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.double,
        data['${effectivePrefix}y4'],
      )!,
      boxScore: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.double,
        data['${effectivePrefix}box_score'],
      )!,
      textScore: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.double,
        data['${effectivePrefix}text_score'],
      )!,
      recognizedText: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}recognized_text'],
      )!,
      isVisible: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.bool,
        data['${effectivePrefix}is_visible'],
      )!,
    );
  }

  @override
  $AssetOcrEntityTable createAlias(String alias) {
    return $AssetOcrEntityTable(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class AssetOcrEntityData extends i0.DataClass
    implements i0.Insertable<i1.AssetOcrEntityData> {
  final String id;
  final String assetId;
  final double x1;
  final double y1;
  final double x2;
  final double y2;
  final double x3;
  final double y3;
  final double x4;
  final double y4;
  final double boxScore;
  final double textScore;
  final String recognizedText;
  final bool isVisible;
  const AssetOcrEntityData({
    required this.id,
    required this.assetId,
    required this.x1,
    required this.y1,
    required this.x2,
    required this.y2,
    required this.x3,
    required this.y3,
    required this.x4,
    required this.y4,
    required this.boxScore,
    required this.textScore,
    required this.recognizedText,
    required this.isVisible,
  });
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['id'] = i0.Variable<String>(id);
    map['asset_id'] = i0.Variable<String>(assetId);
    map['x1'] = i0.Variable<double>(x1);
    map['y1'] = i0.Variable<double>(y1);
    map['x2'] = i0.Variable<double>(x2);
    map['y2'] = i0.Variable<double>(y2);
    map['x3'] = i0.Variable<double>(x3);
    map['y3'] = i0.Variable<double>(y3);
    map['x4'] = i0.Variable<double>(x4);
    map['y4'] = i0.Variable<double>(y4);
    map['box_score'] = i0.Variable<double>(boxScore);
    map['text_score'] = i0.Variable<double>(textScore);
    map['recognized_text'] = i0.Variable<String>(recognizedText);
    map['is_visible'] = i0.Variable<bool>(isVisible);
    return map;
  }

  factory AssetOcrEntityData.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return AssetOcrEntityData(
      id: serializer.fromJson<String>(json['id']),
      assetId: serializer.fromJson<String>(json['assetId']),
      x1: serializer.fromJson<double>(json['x1']),
      y1: serializer.fromJson<double>(json['y1']),
      x2: serializer.fromJson<double>(json['x2']),
      y2: serializer.fromJson<double>(json['y2']),
      x3: serializer.fromJson<double>(json['x3']),
      y3: serializer.fromJson<double>(json['y3']),
      x4: serializer.fromJson<double>(json['x4']),
      y4: serializer.fromJson<double>(json['y4']),
      boxScore: serializer.fromJson<double>(json['boxScore']),
      textScore: serializer.fromJson<double>(json['textScore']),
      recognizedText: serializer.fromJson<String>(json['recognizedText']),
      isVisible: serializer.fromJson<bool>(json['isVisible']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'assetId': serializer.toJson<String>(assetId),
      'x1': serializer.toJson<double>(x1),
      'y1': serializer.toJson<double>(y1),
      'x2': serializer.toJson<double>(x2),
      'y2': serializer.toJson<double>(y2),
      'x3': serializer.toJson<double>(x3),
      'y3': serializer.toJson<double>(y3),
      'x4': serializer.toJson<double>(x4),
      'y4': serializer.toJson<double>(y4),
      'boxScore': serializer.toJson<double>(boxScore),
      'textScore': serializer.toJson<double>(textScore),
      'recognizedText': serializer.toJson<String>(recognizedText),
      'isVisible': serializer.toJson<bool>(isVisible),
    };
  }

  i1.AssetOcrEntityData copyWith({
    String? id,
    String? assetId,
    double? x1,
    double? y1,
    double? x2,
    double? y2,
    double? x3,
    double? y3,
    double? x4,
    double? y4,
    double? boxScore,
    double? textScore,
    String? recognizedText,
    bool? isVisible,
  }) => i1.AssetOcrEntityData(
    id: id ?? this.id,
    assetId: assetId ?? this.assetId,
    x1: x1 ?? this.x1,
    y1: y1 ?? this.y1,
    x2: x2 ?? this.x2,
    y2: y2 ?? this.y2,
    x3: x3 ?? this.x3,
    y3: y3 ?? this.y3,
    x4: x4 ?? this.x4,
    y4: y4 ?? this.y4,
    boxScore: boxScore ?? this.boxScore,
    textScore: textScore ?? this.textScore,
    recognizedText: recognizedText ?? this.recognizedText,
    isVisible: isVisible ?? this.isVisible,
  );
  AssetOcrEntityData copyWithCompanion(i1.AssetOcrEntityCompanion data) {
    return AssetOcrEntityData(
      id: data.id.present ? data.id.value : this.id,
      assetId: data.assetId.present ? data.assetId.value : this.assetId,
      x1: data.x1.present ? data.x1.value : this.x1,
      y1: data.y1.present ? data.y1.value : this.y1,
      x2: data.x2.present ? data.x2.value : this.x2,
      y2: data.y2.present ? data.y2.value : this.y2,
      x3: data.x3.present ? data.x3.value : this.x3,
      y3: data.y3.present ? data.y3.value : this.y3,
      x4: data.x4.present ? data.x4.value : this.x4,
      y4: data.y4.present ? data.y4.value : this.y4,
      boxScore: data.boxScore.present ? data.boxScore.value : this.boxScore,
      textScore: data.textScore.present ? data.textScore.value : this.textScore,
      recognizedText: data.recognizedText.present
          ? data.recognizedText.value
          : this.recognizedText,
      isVisible: data.isVisible.present ? data.isVisible.value : this.isVisible,
    );
  }

  @override
  String toString() {
    return (StringBuffer('AssetOcrEntityData(')
          ..write('id: $id, ')
          ..write('assetId: $assetId, ')
          ..write('x1: $x1, ')
          ..write('y1: $y1, ')
          ..write('x2: $x2, ')
          ..write('y2: $y2, ')
          ..write('x3: $x3, ')
          ..write('y3: $y3, ')
          ..write('x4: $x4, ')
          ..write('y4: $y4, ')
          ..write('boxScore: $boxScore, ')
          ..write('textScore: $textScore, ')
          ..write('recognizedText: $recognizedText, ')
          ..write('isVisible: $isVisible')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    assetId,
    x1,
    y1,
    x2,
    y2,
    x3,
    y3,
    x4,
    y4,
    boxScore,
    textScore,
    recognizedText,
    isVisible,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.AssetOcrEntityData &&
          other.id == this.id &&
          other.assetId == this.assetId &&
          other.x1 == this.x1 &&
          other.y1 == this.y1 &&
          other.x2 == this.x2 &&
          other.y2 == this.y2 &&
          other.x3 == this.x3 &&
          other.y3 == this.y3 &&
          other.x4 == this.x4 &&
          other.y4 == this.y4 &&
          other.boxScore == this.boxScore &&
          other.textScore == this.textScore &&
          other.recognizedText == this.recognizedText &&
          other.isVisible == this.isVisible);
}

class AssetOcrEntityCompanion
    extends i0.UpdateCompanion<i1.AssetOcrEntityData> {
  final i0.Value<String> id;
  final i0.Value<String> assetId;
  final i0.Value<double> x1;
  final i0.Value<double> y1;
  final i0.Value<double> x2;
  final i0.Value<double> y2;
  final i0.Value<double> x3;
  final i0.Value<double> y3;
  final i0.Value<double> x4;
  final i0.Value<double> y4;
  final i0.Value<double> boxScore;
  final i0.Value<double> textScore;
  final i0.Value<String> recognizedText;
  final i0.Value<bool> isVisible;
  const AssetOcrEntityCompanion({
    this.id = const i0.Value.absent(),
    this.assetId = const i0.Value.absent(),
    this.x1 = const i0.Value.absent(),
    this.y1 = const i0.Value.absent(),
    this.x2 = const i0.Value.absent(),
    this.y2 = const i0.Value.absent(),
    this.x3 = const i0.Value.absent(),
    this.y3 = const i0.Value.absent(),
    this.x4 = const i0.Value.absent(),
    this.y4 = const i0.Value.absent(),
    this.boxScore = const i0.Value.absent(),
    this.textScore = const i0.Value.absent(),
    this.recognizedText = const i0.Value.absent(),
    this.isVisible = const i0.Value.absent(),
  });
  AssetOcrEntityCompanion.insert({
    required String id,
    required String assetId,
    required double x1,
    required double y1,
    required double x2,
    required double y2,
    required double x3,
    required double y3,
    required double x4,
    required double y4,
    required double boxScore,
    required double textScore,
    required String recognizedText,
    this.isVisible = const i0.Value.absent(),
  }) : id = i0.Value(id),
       assetId = i0.Value(assetId),
       x1 = i0.Value(x1),
       y1 = i0.Value(y1),
       x2 = i0.Value(x2),
       y2 = i0.Value(y2),
       x3 = i0.Value(x3),
       y3 = i0.Value(y3),
       x4 = i0.Value(x4),
       y4 = i0.Value(y4),
       boxScore = i0.Value(boxScore),
       textScore = i0.Value(textScore),
       recognizedText = i0.Value(recognizedText);
  static i0.Insertable<i1.AssetOcrEntityData> custom({
    i0.Expression<String>? id,
    i0.Expression<String>? assetId,
    i0.Expression<double>? x1,
    i0.Expression<double>? y1,
    i0.Expression<double>? x2,
    i0.Expression<double>? y2,
    i0.Expression<double>? x3,
    i0.Expression<double>? y3,
    i0.Expression<double>? x4,
    i0.Expression<double>? y4,
    i0.Expression<double>? boxScore,
    i0.Expression<double>? textScore,
    i0.Expression<String>? recognizedText,
    i0.Expression<bool>? isVisible,
  }) {
    return i0.RawValuesInsertable({
      if (id != null) 'id': id,
      if (assetId != null) 'asset_id': assetId,
      if (x1 != null) 'x1': x1,
      if (y1 != null) 'y1': y1,
      if (x2 != null) 'x2': x2,
      if (y2 != null) 'y2': y2,
      if (x3 != null) 'x3': x3,
      if (y3 != null) 'y3': y3,
      if (x4 != null) 'x4': x4,
      if (y4 != null) 'y4': y4,
      if (boxScore != null) 'box_score': boxScore,
      if (textScore != null) 'text_score': textScore,
      if (recognizedText != null) 'recognized_text': recognizedText,
      if (isVisible != null) 'is_visible': isVisible,
    });
  }

  i1.AssetOcrEntityCompanion copyWith({
    i0.Value<String>? id,
    i0.Value<String>? assetId,
    i0.Value<double>? x1,
    i0.Value<double>? y1,
    i0.Value<double>? x2,
    i0.Value<double>? y2,
    i0.Value<double>? x3,
    i0.Value<double>? y3,
    i0.Value<double>? x4,
    i0.Value<double>? y4,
    i0.Value<double>? boxScore,
    i0.Value<double>? textScore,
    i0.Value<String>? recognizedText,
    i0.Value<bool>? isVisible,
  }) {
    return i1.AssetOcrEntityCompanion(
      id: id ?? this.id,
      assetId: assetId ?? this.assetId,
      x1: x1 ?? this.x1,
      y1: y1 ?? this.y1,
      x2: x2 ?? this.x2,
      y2: y2 ?? this.y2,
      x3: x3 ?? this.x3,
      y3: y3 ?? this.y3,
      x4: x4 ?? this.x4,
      y4: y4 ?? this.y4,
      boxScore: boxScore ?? this.boxScore,
      textScore: textScore ?? this.textScore,
      recognizedText: recognizedText ?? this.recognizedText,
      isVisible: isVisible ?? this.isVisible,
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
    if (x1.present) {
      map['x1'] = i0.Variable<double>(x1.value);
    }
    if (y1.present) {
      map['y1'] = i0.Variable<double>(y1.value);
    }
    if (x2.present) {
      map['x2'] = i0.Variable<double>(x2.value);
    }
    if (y2.present) {
      map['y2'] = i0.Variable<double>(y2.value);
    }
    if (x3.present) {
      map['x3'] = i0.Variable<double>(x3.value);
    }
    if (y3.present) {
      map['y3'] = i0.Variable<double>(y3.value);
    }
    if (x4.present) {
      map['x4'] = i0.Variable<double>(x4.value);
    }
    if (y4.present) {
      map['y4'] = i0.Variable<double>(y4.value);
    }
    if (boxScore.present) {
      map['box_score'] = i0.Variable<double>(boxScore.value);
    }
    if (textScore.present) {
      map['text_score'] = i0.Variable<double>(textScore.value);
    }
    if (recognizedText.present) {
      map['recognized_text'] = i0.Variable<String>(recognizedText.value);
    }
    if (isVisible.present) {
      map['is_visible'] = i0.Variable<bool>(isVisible.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('AssetOcrEntityCompanion(')
          ..write('id: $id, ')
          ..write('assetId: $assetId, ')
          ..write('x1: $x1, ')
          ..write('y1: $y1, ')
          ..write('x2: $x2, ')
          ..write('y2: $y2, ')
          ..write('x3: $x3, ')
          ..write('y3: $y3, ')
          ..write('x4: $x4, ')
          ..write('y4: $y4, ')
          ..write('boxScore: $boxScore, ')
          ..write('textScore: $textScore, ')
          ..write('recognizedText: $recognizedText, ')
          ..write('isVisible: $isVisible')
          ..write(')'))
        .toString();
  }
}
