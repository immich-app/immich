// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart'
    as i1;
import 'package:immich_mobile/domain/models/local_album.model.dart' as i2;
import 'package:immich_mobile/infrastructure/entities/local_album.entity.dart'
    as i3;
import 'package:drift/src/runtime/query_builder/query_builder.dart' as i4;
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart'
    as i5;
import 'package:drift/internal/modular.dart' as i6;

typedef $$LocalAlbumEntityTableCreateCompanionBuilder
    = i1.LocalAlbumEntityCompanion Function({
  required String id,
  required String name,
  i0.Value<DateTime> updatedAt,
  i0.Value<String?> thumbnailId,
  required i2.BackupSelection backupSelection,
});
typedef $$LocalAlbumEntityTableUpdateCompanionBuilder
    = i1.LocalAlbumEntityCompanion Function({
  i0.Value<String> id,
  i0.Value<String> name,
  i0.Value<DateTime> updatedAt,
  i0.Value<String?> thumbnailId,
  i0.Value<i2.BackupSelection> backupSelection,
});

final class $$LocalAlbumEntityTableReferences extends i0.BaseReferences<
    i0.GeneratedDatabase, i1.$LocalAlbumEntityTable, i1.LocalAlbumEntityData> {
  $$LocalAlbumEntityTableReferences(
      super.$_db, super.$_table, super.$_typedResult);

  static i5.$LocalAssetEntityTable _thumbnailIdTable(i0.GeneratedDatabase db) =>
      i6.ReadDatabaseContainer(db)
          .resultSet<i5.$LocalAssetEntityTable>('local_asset_entity')
          .createAlias(i0.$_aliasNameGenerator(
              i6.ReadDatabaseContainer(db)
                  .resultSet<i1.$LocalAlbumEntityTable>('local_album_entity')
                  .thumbnailId,
              i6.ReadDatabaseContainer(db)
                  .resultSet<i5.$LocalAssetEntityTable>('local_asset_entity')
                  .localId));

  i5.$$LocalAssetEntityTableProcessedTableManager? get thumbnailId {
    final $_column = $_itemColumn<String>('thumbnail_id');
    if ($_column == null) return null;
    final manager = i5
        .$$LocalAssetEntityTableTableManager(
            $_db,
            i6.ReadDatabaseContainer($_db)
                .resultSet<i5.$LocalAssetEntityTable>('local_asset_entity'))
        .filter((f) => f.localId.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_thumbnailIdTable($_db));
    if (item == null) return manager;
    return i0.ProcessedTableManager(
        manager.$state.copyWith(prefetchedData: [item]));
  }
}

class $$LocalAlbumEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$LocalAlbumEntityTable> {
  $$LocalAlbumEntityTableFilterComposer({
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

  i0.ColumnFilters<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnWithTypeConverterFilters<i2.BackupSelection, i2.BackupSelection, int>
      get backupSelection => $composableBuilder(
          column: $table.backupSelection,
          builder: (column) => i0.ColumnWithTypeConverterFilters(column));

  i5.$$LocalAssetEntityTableFilterComposer get thumbnailId {
    final i5.$$LocalAssetEntityTableFilterComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.thumbnailId,
        referencedTable: i6.ReadDatabaseContainer($db)
            .resultSet<i5.$LocalAssetEntityTable>('local_asset_entity'),
        getReferencedColumn: (t) => t.localId,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            i5.$$LocalAssetEntityTableFilterComposer(
              $db: $db,
              $table: i6.ReadDatabaseContainer($db)
                  .resultSet<i5.$LocalAssetEntityTable>('local_asset_entity'),
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$LocalAlbumEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$LocalAlbumEntityTable> {
  $$LocalAlbumEntityTableOrderingComposer({
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

  i0.ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<int> get backupSelection => $composableBuilder(
      column: $table.backupSelection,
      builder: (column) => i0.ColumnOrderings(column));

  i5.$$LocalAssetEntityTableOrderingComposer get thumbnailId {
    final i5.$$LocalAssetEntityTableOrderingComposer composer =
        $composerBuilder(
            composer: this,
            getCurrentColumn: (t) => t.thumbnailId,
            referencedTable: i6.ReadDatabaseContainer($db)
                .resultSet<i5.$LocalAssetEntityTable>('local_asset_entity'),
            getReferencedColumn: (t) => t.localId,
            builder: (joinBuilder,
                    {$addJoinBuilderToRootComposer,
                    $removeJoinBuilderFromRootComposer}) =>
                i5.$$LocalAssetEntityTableOrderingComposer(
                  $db: $db,
                  $table: i6.ReadDatabaseContainer($db)
                      .resultSet<i5.$LocalAssetEntityTable>(
                          'local_asset_entity'),
                  $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                  joinBuilder: joinBuilder,
                  $removeJoinBuilderFromRootComposer:
                      $removeJoinBuilderFromRootComposer,
                ));
    return composer;
  }
}

class $$LocalAlbumEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$LocalAlbumEntityTable> {
  $$LocalAlbumEntityTableAnnotationComposer({
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

  i0.GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  i0.GeneratedColumnWithTypeConverter<i2.BackupSelection, int>
      get backupSelection => $composableBuilder(
          column: $table.backupSelection, builder: (column) => column);

  i5.$$LocalAssetEntityTableAnnotationComposer get thumbnailId {
    final i5.$$LocalAssetEntityTableAnnotationComposer composer =
        $composerBuilder(
            composer: this,
            getCurrentColumn: (t) => t.thumbnailId,
            referencedTable: i6.ReadDatabaseContainer($db)
                .resultSet<i5.$LocalAssetEntityTable>('local_asset_entity'),
            getReferencedColumn: (t) => t.localId,
            builder: (joinBuilder,
                    {$addJoinBuilderToRootComposer,
                    $removeJoinBuilderFromRootComposer}) =>
                i5.$$LocalAssetEntityTableAnnotationComposer(
                  $db: $db,
                  $table: i6.ReadDatabaseContainer($db)
                      .resultSet<i5.$LocalAssetEntityTable>(
                          'local_asset_entity'),
                  $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                  joinBuilder: joinBuilder,
                  $removeJoinBuilderFromRootComposer:
                      $removeJoinBuilderFromRootComposer,
                ));
    return composer;
  }
}

class $$LocalAlbumEntityTableTableManager extends i0.RootTableManager<
    i0.GeneratedDatabase,
    i1.$LocalAlbumEntityTable,
    i1.LocalAlbumEntityData,
    i1.$$LocalAlbumEntityTableFilterComposer,
    i1.$$LocalAlbumEntityTableOrderingComposer,
    i1.$$LocalAlbumEntityTableAnnotationComposer,
    $$LocalAlbumEntityTableCreateCompanionBuilder,
    $$LocalAlbumEntityTableUpdateCompanionBuilder,
    (i1.LocalAlbumEntityData, i1.$$LocalAlbumEntityTableReferences),
    i1.LocalAlbumEntityData,
    i0.PrefetchHooks Function({bool thumbnailId})> {
  $$LocalAlbumEntityTableTableManager(
      i0.GeneratedDatabase db, i1.$LocalAlbumEntityTable table)
      : super(i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$LocalAlbumEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () => i1
              .$$LocalAlbumEntityTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              i1.$$LocalAlbumEntityTableAnnotationComposer(
                  $db: db, $table: table),
          updateCompanionCallback: ({
            i0.Value<String> id = const i0.Value.absent(),
            i0.Value<String> name = const i0.Value.absent(),
            i0.Value<DateTime> updatedAt = const i0.Value.absent(),
            i0.Value<String?> thumbnailId = const i0.Value.absent(),
            i0.Value<i2.BackupSelection> backupSelection =
                const i0.Value.absent(),
          }) =>
              i1.LocalAlbumEntityCompanion(
            id: id,
            name: name,
            updatedAt: updatedAt,
            thumbnailId: thumbnailId,
            backupSelection: backupSelection,
          ),
          createCompanionCallback: ({
            required String id,
            required String name,
            i0.Value<DateTime> updatedAt = const i0.Value.absent(),
            i0.Value<String?> thumbnailId = const i0.Value.absent(),
            required i2.BackupSelection backupSelection,
          }) =>
              i1.LocalAlbumEntityCompanion.insert(
            id: id,
            name: name,
            updatedAt: updatedAt,
            thumbnailId: thumbnailId,
            backupSelection: backupSelection,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (
                    e.readTable(table),
                    i1.$$LocalAlbumEntityTableReferences(db, table, e)
                  ))
              .toList(),
          prefetchHooksCallback: ({thumbnailId = false}) {
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
                if (thumbnailId) {
                  state = state.withJoin(
                    currentTable: table,
                    currentColumn: table.thumbnailId,
                    referencedTable: i1.$$LocalAlbumEntityTableReferences
                        ._thumbnailIdTable(db),
                    referencedColumn: i1.$$LocalAlbumEntityTableReferences
                        ._thumbnailIdTable(db)
                        .localId,
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

typedef $$LocalAlbumEntityTableProcessedTableManager = i0.ProcessedTableManager<
    i0.GeneratedDatabase,
    i1.$LocalAlbumEntityTable,
    i1.LocalAlbumEntityData,
    i1.$$LocalAlbumEntityTableFilterComposer,
    i1.$$LocalAlbumEntityTableOrderingComposer,
    i1.$$LocalAlbumEntityTableAnnotationComposer,
    $$LocalAlbumEntityTableCreateCompanionBuilder,
    $$LocalAlbumEntityTableUpdateCompanionBuilder,
    (i1.LocalAlbumEntityData, i1.$$LocalAlbumEntityTableReferences),
    i1.LocalAlbumEntityData,
    i0.PrefetchHooks Function({bool thumbnailId})>;

class $LocalAlbumEntityTable extends i3.LocalAlbumEntity
    with i0.TableInfo<$LocalAlbumEntityTable, i1.LocalAlbumEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalAlbumEntityTable(this.attachedDatabase, [this._alias]);
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
  static const i0.VerificationMeta _updatedAtMeta =
      const i0.VerificationMeta('updatedAt');
  @override
  late final i0.GeneratedColumn<DateTime> updatedAt =
      i0.GeneratedColumn<DateTime>('updated_at', aliasedName, false,
          type: i0.DriftSqlType.dateTime,
          requiredDuringInsert: false,
          defaultValue: i4.currentDateAndTime);
  static const i0.VerificationMeta _thumbnailIdMeta =
      const i0.VerificationMeta('thumbnailId');
  @override
  late final i0.GeneratedColumn<String> thumbnailId =
      i0.GeneratedColumn<String>('thumbnail_id', aliasedName, true,
          type: i0.DriftSqlType.string,
          requiredDuringInsert: false,
          defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
              'REFERENCES local_asset_entity (local_id) ON DELETE SET NULL'));
  @override
  late final i0.GeneratedColumnWithTypeConverter<i2.BackupSelection, int>
      backupSelection = i0.GeneratedColumn<int>(
              'backup_selection', aliasedName, false,
              type: i0.DriftSqlType.int, requiredDuringInsert: true)
          .withConverter<i2.BackupSelection>(
              i1.$LocalAlbumEntityTable.$converterbackupSelection);
  @override
  List<i0.GeneratedColumn> get $columns =>
      [id, name, updatedAt, thumbnailId, backupSelection];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_album_entity';
  @override
  i0.VerificationContext validateIntegrity(
      i0.Insertable<i1.LocalAlbumEntityData> instance,
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
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    if (data.containsKey('thumbnail_id')) {
      context.handle(
          _thumbnailIdMeta,
          thumbnailId.isAcceptableOrUnknown(
              data['thumbnail_id']!, _thumbnailIdMeta));
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {id};
  @override
  i1.LocalAlbumEntityData map(Map<String, dynamic> data,
      {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.LocalAlbumEntityData(
      id: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}id'])!,
      name: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}name'])!,
      updatedAt: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
      thumbnailId: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}thumbnail_id']),
      backupSelection: i1.$LocalAlbumEntityTable.$converterbackupSelection
          .fromSql(attachedDatabase.typeMapping.read(i0.DriftSqlType.int,
              data['${effectivePrefix}backup_selection'])!),
    );
  }

  @override
  $LocalAlbumEntityTable createAlias(String alias) {
    return $LocalAlbumEntityTable(attachedDatabase, alias);
  }

  static i0.JsonTypeConverter2<i2.BackupSelection, int, int>
      $converterbackupSelection =
      const i0.EnumIndexConverter<i2.BackupSelection>(
          i2.BackupSelection.values);
  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class LocalAlbumEntityData extends i0.DataClass
    implements i0.Insertable<i1.LocalAlbumEntityData> {
  final String id;
  final String name;
  final DateTime updatedAt;
  final String? thumbnailId;
  final i2.BackupSelection backupSelection;
  const LocalAlbumEntityData(
      {required this.id,
      required this.name,
      required this.updatedAt,
      this.thumbnailId,
      required this.backupSelection});
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['id'] = i0.Variable<String>(id);
    map['name'] = i0.Variable<String>(name);
    map['updated_at'] = i0.Variable<DateTime>(updatedAt);
    if (!nullToAbsent || thumbnailId != null) {
      map['thumbnail_id'] = i0.Variable<String>(thumbnailId);
    }
    {
      map['backup_selection'] = i0.Variable<int>(i1
          .$LocalAlbumEntityTable.$converterbackupSelection
          .toSql(backupSelection));
    }
    return map;
  }

  factory LocalAlbumEntityData.fromJson(Map<String, dynamic> json,
      {i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return LocalAlbumEntityData(
      id: serializer.fromJson<String>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      thumbnailId: serializer.fromJson<String?>(json['thumbnailId']),
      backupSelection: i1.$LocalAlbumEntityTable.$converterbackupSelection
          .fromJson(serializer.fromJson<int>(json['backupSelection'])),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'name': serializer.toJson<String>(name),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'thumbnailId': serializer.toJson<String?>(thumbnailId),
      'backupSelection': serializer.toJson<int>(i1
          .$LocalAlbumEntityTable.$converterbackupSelection
          .toJson(backupSelection)),
    };
  }

  i1.LocalAlbumEntityData copyWith(
          {String? id,
          String? name,
          DateTime? updatedAt,
          i0.Value<String?> thumbnailId = const i0.Value.absent(),
          i2.BackupSelection? backupSelection}) =>
      i1.LocalAlbumEntityData(
        id: id ?? this.id,
        name: name ?? this.name,
        updatedAt: updatedAt ?? this.updatedAt,
        thumbnailId: thumbnailId.present ? thumbnailId.value : this.thumbnailId,
        backupSelection: backupSelection ?? this.backupSelection,
      );
  LocalAlbumEntityData copyWithCompanion(i1.LocalAlbumEntityCompanion data) {
    return LocalAlbumEntityData(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      thumbnailId:
          data.thumbnailId.present ? data.thumbnailId.value : this.thumbnailId,
      backupSelection: data.backupSelection.present
          ? data.backupSelection.value
          : this.backupSelection,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalAlbumEntityData(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('thumbnailId: $thumbnailId, ')
          ..write('backupSelection: $backupSelection')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, name, updatedAt, thumbnailId, backupSelection);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.LocalAlbumEntityData &&
          other.id == this.id &&
          other.name == this.name &&
          other.updatedAt == this.updatedAt &&
          other.thumbnailId == this.thumbnailId &&
          other.backupSelection == this.backupSelection);
}

class LocalAlbumEntityCompanion
    extends i0.UpdateCompanion<i1.LocalAlbumEntityData> {
  final i0.Value<String> id;
  final i0.Value<String> name;
  final i0.Value<DateTime> updatedAt;
  final i0.Value<String?> thumbnailId;
  final i0.Value<i2.BackupSelection> backupSelection;
  const LocalAlbumEntityCompanion({
    this.id = const i0.Value.absent(),
    this.name = const i0.Value.absent(),
    this.updatedAt = const i0.Value.absent(),
    this.thumbnailId = const i0.Value.absent(),
    this.backupSelection = const i0.Value.absent(),
  });
  LocalAlbumEntityCompanion.insert({
    required String id,
    required String name,
    this.updatedAt = const i0.Value.absent(),
    this.thumbnailId = const i0.Value.absent(),
    required i2.BackupSelection backupSelection,
  })  : id = i0.Value(id),
        name = i0.Value(name),
        backupSelection = i0.Value(backupSelection);
  static i0.Insertable<i1.LocalAlbumEntityData> custom({
    i0.Expression<String>? id,
    i0.Expression<String>? name,
    i0.Expression<DateTime>? updatedAt,
    i0.Expression<String>? thumbnailId,
    i0.Expression<int>? backupSelection,
  }) {
    return i0.RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (thumbnailId != null) 'thumbnail_id': thumbnailId,
      if (backupSelection != null) 'backup_selection': backupSelection,
    });
  }

  i1.LocalAlbumEntityCompanion copyWith(
      {i0.Value<String>? id,
      i0.Value<String>? name,
      i0.Value<DateTime>? updatedAt,
      i0.Value<String?>? thumbnailId,
      i0.Value<i2.BackupSelection>? backupSelection}) {
    return i1.LocalAlbumEntityCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      updatedAt: updatedAt ?? this.updatedAt,
      thumbnailId: thumbnailId ?? this.thumbnailId,
      backupSelection: backupSelection ?? this.backupSelection,
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
    if (updatedAt.present) {
      map['updated_at'] = i0.Variable<DateTime>(updatedAt.value);
    }
    if (thumbnailId.present) {
      map['thumbnail_id'] = i0.Variable<String>(thumbnailId.value);
    }
    if (backupSelection.present) {
      map['backup_selection'] = i0.Variable<int>(i1
          .$LocalAlbumEntityTable.$converterbackupSelection
          .toSql(backupSelection.value));
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalAlbumEntityCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('thumbnailId: $thumbnailId, ')
          ..write('backupSelection: $backupSelection')
          ..write(')'))
        .toString();
  }
}
