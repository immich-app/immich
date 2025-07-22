// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/person.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/person.entity.dart' as i2;
import 'package:drift/src/runtime/query_builder/query_builder.dart' as i3;
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart'
    as i4;
import 'package:drift/internal/modular.dart' as i5;

typedef $$PersonEntityTableCreateCompanionBuilder = i1.PersonEntityCompanion
    Function({
  required String id,
  i0.Value<DateTime> createdAt,
  i0.Value<DateTime> updatedAt,
  required String ownerId,
  required String name,
  i0.Value<String?> faceAssetId,
  required bool isFavorite,
  required bool isHidden,
  i0.Value<String?> color,
  i0.Value<DateTime?> birthDate,
});
typedef $$PersonEntityTableUpdateCompanionBuilder = i1.PersonEntityCompanion
    Function({
  i0.Value<String> id,
  i0.Value<DateTime> createdAt,
  i0.Value<DateTime> updatedAt,
  i0.Value<String> ownerId,
  i0.Value<String> name,
  i0.Value<String?> faceAssetId,
  i0.Value<bool> isFavorite,
  i0.Value<bool> isHidden,
  i0.Value<String?> color,
  i0.Value<DateTime?> birthDate,
});

final class $$PersonEntityTableReferences extends i0.BaseReferences<
    i0.GeneratedDatabase, i1.$PersonEntityTable, i1.PersonEntityData> {
  $$PersonEntityTableReferences(super.$_db, super.$_table, super.$_typedResult);

  static i4.$UserEntityTable _ownerIdTable(i0.GeneratedDatabase db) =>
      i5.ReadDatabaseContainer(db)
          .resultSet<i4.$UserEntityTable>('user_entity')
          .createAlias(i0.$_aliasNameGenerator(
              i5.ReadDatabaseContainer(db)
                  .resultSet<i1.$PersonEntityTable>('person_entity')
                  .ownerId,
              i5.ReadDatabaseContainer(db)
                  .resultSet<i4.$UserEntityTable>('user_entity')
                  .id));

  i4.$$UserEntityTableProcessedTableManager get ownerId {
    final $_column = $_itemColumn<String>('owner_id')!;

    final manager = i4
        .$$UserEntityTableTableManager(
            $_db,
            i5.ReadDatabaseContainer($_db)
                .resultSet<i4.$UserEntityTable>('user_entity'))
        .filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_ownerIdTable($_db));
    if (item == null) return manager;
    return i0.ProcessedTableManager(
        manager.$state.copyWith(prefetchedData: [item]));
  }
}

class $$PersonEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$PersonEntityTable> {
  $$PersonEntityTableFilterComposer({
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

  i0.ColumnFilters<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get faceAssetId => $composableBuilder(
      column: $table.faceAssetId,
      builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<bool> get isFavorite => $composableBuilder(
      column: $table.isFavorite, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<bool> get isHidden => $composableBuilder(
      column: $table.isHidden, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get color => $composableBuilder(
      column: $table.color, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<DateTime> get birthDate => $composableBuilder(
      column: $table.birthDate, builder: (column) => i0.ColumnFilters(column));

  i4.$$UserEntityTableFilterComposer get ownerId {
    final i4.$$UserEntityTableFilterComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.ownerId,
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

class $$PersonEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$PersonEntityTable> {
  $$PersonEntityTableOrderingComposer({
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

  i0.ColumnOrderings<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get faceAssetId => $composableBuilder(
      column: $table.faceAssetId,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<bool> get isFavorite => $composableBuilder(
      column: $table.isFavorite,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<bool> get isHidden => $composableBuilder(
      column: $table.isHidden, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get color => $composableBuilder(
      column: $table.color, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<DateTime> get birthDate => $composableBuilder(
      column: $table.birthDate,
      builder: (column) => i0.ColumnOrderings(column));

  i4.$$UserEntityTableOrderingComposer get ownerId {
    final i4.$$UserEntityTableOrderingComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.ownerId,
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

class $$PersonEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$PersonEntityTable> {
  $$PersonEntityTableAnnotationComposer({
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

  i0.GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  i0.GeneratedColumn<String> get faceAssetId => $composableBuilder(
      column: $table.faceAssetId, builder: (column) => column);

  i0.GeneratedColumn<bool> get isFavorite => $composableBuilder(
      column: $table.isFavorite, builder: (column) => column);

  i0.GeneratedColumn<bool> get isHidden =>
      $composableBuilder(column: $table.isHidden, builder: (column) => column);

  i0.GeneratedColumn<String> get color =>
      $composableBuilder(column: $table.color, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get birthDate =>
      $composableBuilder(column: $table.birthDate, builder: (column) => column);

  i4.$$UserEntityTableAnnotationComposer get ownerId {
    final i4.$$UserEntityTableAnnotationComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.ownerId,
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

class $$PersonEntityTableTableManager extends i0.RootTableManager<
    i0.GeneratedDatabase,
    i1.$PersonEntityTable,
    i1.PersonEntityData,
    i1.$$PersonEntityTableFilterComposer,
    i1.$$PersonEntityTableOrderingComposer,
    i1.$$PersonEntityTableAnnotationComposer,
    $$PersonEntityTableCreateCompanionBuilder,
    $$PersonEntityTableUpdateCompanionBuilder,
    (i1.PersonEntityData, i1.$$PersonEntityTableReferences),
    i1.PersonEntityData,
    i0.PrefetchHooks Function({bool ownerId})> {
  $$PersonEntityTableTableManager(
      i0.GeneratedDatabase db, i1.$PersonEntityTable table)
      : super(i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$PersonEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              i1.$$PersonEntityTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              i1.$$PersonEntityTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            i0.Value<String> id = const i0.Value.absent(),
            i0.Value<DateTime> createdAt = const i0.Value.absent(),
            i0.Value<DateTime> updatedAt = const i0.Value.absent(),
            i0.Value<String> ownerId = const i0.Value.absent(),
            i0.Value<String> name = const i0.Value.absent(),
            i0.Value<String?> faceAssetId = const i0.Value.absent(),
            i0.Value<bool> isFavorite = const i0.Value.absent(),
            i0.Value<bool> isHidden = const i0.Value.absent(),
            i0.Value<String?> color = const i0.Value.absent(),
            i0.Value<DateTime?> birthDate = const i0.Value.absent(),
          }) =>
              i1.PersonEntityCompanion(
            id: id,
            createdAt: createdAt,
            updatedAt: updatedAt,
            ownerId: ownerId,
            name: name,
            faceAssetId: faceAssetId,
            isFavorite: isFavorite,
            isHidden: isHidden,
            color: color,
            birthDate: birthDate,
          ),
          createCompanionCallback: ({
            required String id,
            i0.Value<DateTime> createdAt = const i0.Value.absent(),
            i0.Value<DateTime> updatedAt = const i0.Value.absent(),
            required String ownerId,
            required String name,
            i0.Value<String?> faceAssetId = const i0.Value.absent(),
            required bool isFavorite,
            required bool isHidden,
            i0.Value<String?> color = const i0.Value.absent(),
            i0.Value<DateTime?> birthDate = const i0.Value.absent(),
          }) =>
              i1.PersonEntityCompanion.insert(
            id: id,
            createdAt: createdAt,
            updatedAt: updatedAt,
            ownerId: ownerId,
            name: name,
            faceAssetId: faceAssetId,
            isFavorite: isFavorite,
            isHidden: isHidden,
            color: color,
            birthDate: birthDate,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (
                    e.readTable(table),
                    i1.$$PersonEntityTableReferences(db, table, e)
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
                        i1.$$PersonEntityTableReferences._ownerIdTable(db),
                    referencedColumn:
                        i1.$$PersonEntityTableReferences._ownerIdTable(db).id,
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

typedef $$PersonEntityTableProcessedTableManager = i0.ProcessedTableManager<
    i0.GeneratedDatabase,
    i1.$PersonEntityTable,
    i1.PersonEntityData,
    i1.$$PersonEntityTableFilterComposer,
    i1.$$PersonEntityTableOrderingComposer,
    i1.$$PersonEntityTableAnnotationComposer,
    $$PersonEntityTableCreateCompanionBuilder,
    $$PersonEntityTableUpdateCompanionBuilder,
    (i1.PersonEntityData, i1.$$PersonEntityTableReferences),
    i1.PersonEntityData,
    i0.PrefetchHooks Function({bool ownerId})>;

class $PersonEntityTable extends i2.PersonEntity
    with i0.TableInfo<$PersonEntityTable, i1.PersonEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $PersonEntityTable(this.attachedDatabase, [this._alias]);
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
          defaultValue: i3.currentDateAndTime);
  static const i0.VerificationMeta _updatedAtMeta =
      const i0.VerificationMeta('updatedAt');
  @override
  late final i0.GeneratedColumn<DateTime> updatedAt =
      i0.GeneratedColumn<DateTime>('updated_at', aliasedName, false,
          type: i0.DriftSqlType.dateTime,
          requiredDuringInsert: false,
          defaultValue: i3.currentDateAndTime);
  static const i0.VerificationMeta _ownerIdMeta =
      const i0.VerificationMeta('ownerId');
  @override
  late final i0.GeneratedColumn<String> ownerId = i0.GeneratedColumn<String>(
      'owner_id', aliasedName, false,
      type: i0.DriftSqlType.string,
      requiredDuringInsert: true,
      defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
          'REFERENCES user_entity (id) ON DELETE CASCADE'));
  static const i0.VerificationMeta _nameMeta =
      const i0.VerificationMeta('name');
  @override
  late final i0.GeneratedColumn<String> name = i0.GeneratedColumn<String>(
      'name', aliasedName, false,
      type: i0.DriftSqlType.string, requiredDuringInsert: true);
  static const i0.VerificationMeta _faceAssetIdMeta =
      const i0.VerificationMeta('faceAssetId');
  @override
  late final i0.GeneratedColumn<String> faceAssetId =
      i0.GeneratedColumn<String>('face_asset_id', aliasedName, true,
          type: i0.DriftSqlType.string, requiredDuringInsert: false);
  static const i0.VerificationMeta _isFavoriteMeta =
      const i0.VerificationMeta('isFavorite');
  @override
  late final i0.GeneratedColumn<bool> isFavorite = i0.GeneratedColumn<bool>(
      'is_favorite', aliasedName, false,
      type: i0.DriftSqlType.bool,
      requiredDuringInsert: true,
      defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
          'CHECK ("is_favorite" IN (0, 1))'));
  static const i0.VerificationMeta _isHiddenMeta =
      const i0.VerificationMeta('isHidden');
  @override
  late final i0.GeneratedColumn<bool> isHidden = i0.GeneratedColumn<bool>(
      'is_hidden', aliasedName, false,
      type: i0.DriftSqlType.bool,
      requiredDuringInsert: true,
      defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
          'CHECK ("is_hidden" IN (0, 1))'));
  static const i0.VerificationMeta _colorMeta =
      const i0.VerificationMeta('color');
  @override
  late final i0.GeneratedColumn<String> color = i0.GeneratedColumn<String>(
      'color', aliasedName, true,
      type: i0.DriftSqlType.string, requiredDuringInsert: false);
  static const i0.VerificationMeta _birthDateMeta =
      const i0.VerificationMeta('birthDate');
  @override
  late final i0.GeneratedColumn<DateTime> birthDate =
      i0.GeneratedColumn<DateTime>('birth_date', aliasedName, true,
          type: i0.DriftSqlType.dateTime, requiredDuringInsert: false);
  @override
  List<i0.GeneratedColumn> get $columns => [
        id,
        createdAt,
        updatedAt,
        ownerId,
        name,
        faceAssetId,
        isFavorite,
        isHidden,
        color,
        birthDate
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'person_entity';
  @override
  i0.VerificationContext validateIntegrity(
      i0.Insertable<i1.PersonEntityData> instance,
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
    if (data.containsKey('owner_id')) {
      context.handle(_ownerIdMeta,
          ownerId.isAcceptableOrUnknown(data['owner_id']!, _ownerIdMeta));
    } else if (isInserting) {
      context.missing(_ownerIdMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
          _nameMeta, name.isAcceptableOrUnknown(data['name']!, _nameMeta));
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('face_asset_id')) {
      context.handle(
          _faceAssetIdMeta,
          faceAssetId.isAcceptableOrUnknown(
              data['face_asset_id']!, _faceAssetIdMeta));
    }
    if (data.containsKey('is_favorite')) {
      context.handle(
          _isFavoriteMeta,
          isFavorite.isAcceptableOrUnknown(
              data['is_favorite']!, _isFavoriteMeta));
    } else if (isInserting) {
      context.missing(_isFavoriteMeta);
    }
    if (data.containsKey('is_hidden')) {
      context.handle(_isHiddenMeta,
          isHidden.isAcceptableOrUnknown(data['is_hidden']!, _isHiddenMeta));
    } else if (isInserting) {
      context.missing(_isHiddenMeta);
    }
    if (data.containsKey('color')) {
      context.handle(
          _colorMeta, color.isAcceptableOrUnknown(data['color']!, _colorMeta));
    }
    if (data.containsKey('birth_date')) {
      context.handle(_birthDateMeta,
          birthDate.isAcceptableOrUnknown(data['birth_date']!, _birthDateMeta));
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {id};
  @override
  i1.PersonEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.PersonEntityData(
      id: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}id'])!,
      createdAt: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      updatedAt: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
      ownerId: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}owner_id'])!,
      name: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}name'])!,
      faceAssetId: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.string, data['${effectivePrefix}face_asset_id']),
      isFavorite: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.bool, data['${effectivePrefix}is_favorite'])!,
      isHidden: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.bool, data['${effectivePrefix}is_hidden'])!,
      color: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}color']),
      birthDate: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.dateTime, data['${effectivePrefix}birth_date']),
    );
  }

  @override
  $PersonEntityTable createAlias(String alias) {
    return $PersonEntityTable(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class PersonEntityData extends i0.DataClass
    implements i0.Insertable<i1.PersonEntityData> {
  final String id;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String ownerId;
  final String name;
  final String? faceAssetId;
  final bool isFavorite;
  final bool isHidden;
  final String? color;
  final DateTime? birthDate;
  const PersonEntityData(
      {required this.id,
      required this.createdAt,
      required this.updatedAt,
      required this.ownerId,
      required this.name,
      this.faceAssetId,
      required this.isFavorite,
      required this.isHidden,
      this.color,
      this.birthDate});
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['id'] = i0.Variable<String>(id);
    map['created_at'] = i0.Variable<DateTime>(createdAt);
    map['updated_at'] = i0.Variable<DateTime>(updatedAt);
    map['owner_id'] = i0.Variable<String>(ownerId);
    map['name'] = i0.Variable<String>(name);
    if (!nullToAbsent || faceAssetId != null) {
      map['face_asset_id'] = i0.Variable<String>(faceAssetId);
    }
    map['is_favorite'] = i0.Variable<bool>(isFavorite);
    map['is_hidden'] = i0.Variable<bool>(isHidden);
    if (!nullToAbsent || color != null) {
      map['color'] = i0.Variable<String>(color);
    }
    if (!nullToAbsent || birthDate != null) {
      map['birth_date'] = i0.Variable<DateTime>(birthDate);
    }
    return map;
  }

  factory PersonEntityData.fromJson(Map<String, dynamic> json,
      {i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return PersonEntityData(
      id: serializer.fromJson<String>(json['id']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      ownerId: serializer.fromJson<String>(json['ownerId']),
      name: serializer.fromJson<String>(json['name']),
      faceAssetId: serializer.fromJson<String?>(json['faceAssetId']),
      isFavorite: serializer.fromJson<bool>(json['isFavorite']),
      isHidden: serializer.fromJson<bool>(json['isHidden']),
      color: serializer.fromJson<String?>(json['color']),
      birthDate: serializer.fromJson<DateTime?>(json['birthDate']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'ownerId': serializer.toJson<String>(ownerId),
      'name': serializer.toJson<String>(name),
      'faceAssetId': serializer.toJson<String?>(faceAssetId),
      'isFavorite': serializer.toJson<bool>(isFavorite),
      'isHidden': serializer.toJson<bool>(isHidden),
      'color': serializer.toJson<String?>(color),
      'birthDate': serializer.toJson<DateTime?>(birthDate),
    };
  }

  i1.PersonEntityData copyWith(
          {String? id,
          DateTime? createdAt,
          DateTime? updatedAt,
          String? ownerId,
          String? name,
          i0.Value<String?> faceAssetId = const i0.Value.absent(),
          bool? isFavorite,
          bool? isHidden,
          i0.Value<String?> color = const i0.Value.absent(),
          i0.Value<DateTime?> birthDate = const i0.Value.absent()}) =>
      i1.PersonEntityData(
        id: id ?? this.id,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
        ownerId: ownerId ?? this.ownerId,
        name: name ?? this.name,
        faceAssetId: faceAssetId.present ? faceAssetId.value : this.faceAssetId,
        isFavorite: isFavorite ?? this.isFavorite,
        isHidden: isHidden ?? this.isHidden,
        color: color.present ? color.value : this.color,
        birthDate: birthDate.present ? birthDate.value : this.birthDate,
      );
  PersonEntityData copyWithCompanion(i1.PersonEntityCompanion data) {
    return PersonEntityData(
      id: data.id.present ? data.id.value : this.id,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      ownerId: data.ownerId.present ? data.ownerId.value : this.ownerId,
      name: data.name.present ? data.name.value : this.name,
      faceAssetId:
          data.faceAssetId.present ? data.faceAssetId.value : this.faceAssetId,
      isFavorite:
          data.isFavorite.present ? data.isFavorite.value : this.isFavorite,
      isHidden: data.isHidden.present ? data.isHidden.value : this.isHidden,
      color: data.color.present ? data.color.value : this.color,
      birthDate: data.birthDate.present ? data.birthDate.value : this.birthDate,
    );
  }

  @override
  String toString() {
    return (StringBuffer('PersonEntityData(')
          ..write('id: $id, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('ownerId: $ownerId, ')
          ..write('name: $name, ')
          ..write('faceAssetId: $faceAssetId, ')
          ..write('isFavorite: $isFavorite, ')
          ..write('isHidden: $isHidden, ')
          ..write('color: $color, ')
          ..write('birthDate: $birthDate')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, createdAt, updatedAt, ownerId, name,
      faceAssetId, isFavorite, isHidden, color, birthDate);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.PersonEntityData &&
          other.id == this.id &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt &&
          other.ownerId == this.ownerId &&
          other.name == this.name &&
          other.faceAssetId == this.faceAssetId &&
          other.isFavorite == this.isFavorite &&
          other.isHidden == this.isHidden &&
          other.color == this.color &&
          other.birthDate == this.birthDate);
}

class PersonEntityCompanion extends i0.UpdateCompanion<i1.PersonEntityData> {
  final i0.Value<String> id;
  final i0.Value<DateTime> createdAt;
  final i0.Value<DateTime> updatedAt;
  final i0.Value<String> ownerId;
  final i0.Value<String> name;
  final i0.Value<String?> faceAssetId;
  final i0.Value<bool> isFavorite;
  final i0.Value<bool> isHidden;
  final i0.Value<String?> color;
  final i0.Value<DateTime?> birthDate;
  const PersonEntityCompanion({
    this.id = const i0.Value.absent(),
    this.createdAt = const i0.Value.absent(),
    this.updatedAt = const i0.Value.absent(),
    this.ownerId = const i0.Value.absent(),
    this.name = const i0.Value.absent(),
    this.faceAssetId = const i0.Value.absent(),
    this.isFavorite = const i0.Value.absent(),
    this.isHidden = const i0.Value.absent(),
    this.color = const i0.Value.absent(),
    this.birthDate = const i0.Value.absent(),
  });
  PersonEntityCompanion.insert({
    required String id,
    this.createdAt = const i0.Value.absent(),
    this.updatedAt = const i0.Value.absent(),
    required String ownerId,
    required String name,
    this.faceAssetId = const i0.Value.absent(),
    required bool isFavorite,
    required bool isHidden,
    this.color = const i0.Value.absent(),
    this.birthDate = const i0.Value.absent(),
  })  : id = i0.Value(id),
        ownerId = i0.Value(ownerId),
        name = i0.Value(name),
        isFavorite = i0.Value(isFavorite),
        isHidden = i0.Value(isHidden);
  static i0.Insertable<i1.PersonEntityData> custom({
    i0.Expression<String>? id,
    i0.Expression<DateTime>? createdAt,
    i0.Expression<DateTime>? updatedAt,
    i0.Expression<String>? ownerId,
    i0.Expression<String>? name,
    i0.Expression<String>? faceAssetId,
    i0.Expression<bool>? isFavorite,
    i0.Expression<bool>? isHidden,
    i0.Expression<String>? color,
    i0.Expression<DateTime>? birthDate,
  }) {
    return i0.RawValuesInsertable({
      if (id != null) 'id': id,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (ownerId != null) 'owner_id': ownerId,
      if (name != null) 'name': name,
      if (faceAssetId != null) 'face_asset_id': faceAssetId,
      if (isFavorite != null) 'is_favorite': isFavorite,
      if (isHidden != null) 'is_hidden': isHidden,
      if (color != null) 'color': color,
      if (birthDate != null) 'birth_date': birthDate,
    });
  }

  i1.PersonEntityCompanion copyWith(
      {i0.Value<String>? id,
      i0.Value<DateTime>? createdAt,
      i0.Value<DateTime>? updatedAt,
      i0.Value<String>? ownerId,
      i0.Value<String>? name,
      i0.Value<String?>? faceAssetId,
      i0.Value<bool>? isFavorite,
      i0.Value<bool>? isHidden,
      i0.Value<String?>? color,
      i0.Value<DateTime?>? birthDate}) {
    return i1.PersonEntityCompanion(
      id: id ?? this.id,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      ownerId: ownerId ?? this.ownerId,
      name: name ?? this.name,
      faceAssetId: faceAssetId ?? this.faceAssetId,
      isFavorite: isFavorite ?? this.isFavorite,
      isHidden: isHidden ?? this.isHidden,
      color: color ?? this.color,
      birthDate: birthDate ?? this.birthDate,
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
    if (ownerId.present) {
      map['owner_id'] = i0.Variable<String>(ownerId.value);
    }
    if (name.present) {
      map['name'] = i0.Variable<String>(name.value);
    }
    if (faceAssetId.present) {
      map['face_asset_id'] = i0.Variable<String>(faceAssetId.value);
    }
    if (isFavorite.present) {
      map['is_favorite'] = i0.Variable<bool>(isFavorite.value);
    }
    if (isHidden.present) {
      map['is_hidden'] = i0.Variable<bool>(isHidden.value);
    }
    if (color.present) {
      map['color'] = i0.Variable<String>(color.value);
    }
    if (birthDate.present) {
      map['birth_date'] = i0.Variable<DateTime>(birthDate.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('PersonEntityCompanion(')
          ..write('id: $id, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('ownerId: $ownerId, ')
          ..write('name: $name, ')
          ..write('faceAssetId: $faceAssetId, ')
          ..write('isFavorite: $isFavorite, ')
          ..write('isHidden: $isHidden, ')
          ..write('color: $color, ')
          ..write('birthDate: $birthDate')
          ..write(')'))
        .toString();
  }
}
