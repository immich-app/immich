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
      required String albumId,
      i0.Value<String?> checksum,
      required String name,
      required i2.AssetType type,
      i0.Value<DateTime> createdAt,
      i0.Value<DateTime> updatedAt,
      i0.Value<int?> size,
    });
typedef $$TrashedLocalAssetEntityTableUpdateCompanionBuilder =
    i1.TrashedLocalAssetEntityCompanion Function({
      i0.Value<String> id,
      i0.Value<String> albumId,
      i0.Value<String?> checksum,
      i0.Value<String> name,
      i0.Value<i2.AssetType> type,
      i0.Value<DateTime> createdAt,
      i0.Value<DateTime> updatedAt,
      i0.Value<int?> size,
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

  i0.ColumnFilters<String> get albumId => $composableBuilder(
    column: $table.albumId,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<String> get checksum => $composableBuilder(
    column: $table.checksum,
    builder: (column) => i0.ColumnFilters(column),
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

  i0.ColumnFilters<int> get size => $composableBuilder(
    column: $table.size,
    builder: (column) => i0.ColumnFilters(column),
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

  i0.ColumnOrderings<String> get albumId => $composableBuilder(
    column: $table.albumId,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get checksum => $composableBuilder(
    column: $table.checksum,
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

  i0.ColumnOrderings<int> get size => $composableBuilder(
    column: $table.size,
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

  i0.GeneratedColumn<String> get albumId =>
      $composableBuilder(column: $table.albumId, builder: (column) => column);

  i0.GeneratedColumn<String> get checksum =>
      $composableBuilder(column: $table.checksum, builder: (column) => column);

  i0.GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  i0.GeneratedColumnWithTypeConverter<i2.AssetType, int> get type =>
      $composableBuilder(column: $table.type, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  i0.GeneratedColumn<int> get size =>
      $composableBuilder(column: $table.size, builder: (column) => column);
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
                i0.Value<String> albumId = const i0.Value.absent(),
                i0.Value<String?> checksum = const i0.Value.absent(),
                i0.Value<String> name = const i0.Value.absent(),
                i0.Value<i2.AssetType> type = const i0.Value.absent(),
                i0.Value<DateTime> createdAt = const i0.Value.absent(),
                i0.Value<DateTime> updatedAt = const i0.Value.absent(),
                i0.Value<int?> size = const i0.Value.absent(),
              }) => i1.TrashedLocalAssetEntityCompanion(
                id: id,
                albumId: albumId,
                checksum: checksum,
                name: name,
                type: type,
                createdAt: createdAt,
                updatedAt: updatedAt,
                size: size,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String albumId,
                i0.Value<String?> checksum = const i0.Value.absent(),
                required String name,
                required i2.AssetType type,
                i0.Value<DateTime> createdAt = const i0.Value.absent(),
                i0.Value<DateTime> updatedAt = const i0.Value.absent(),
                i0.Value<int?> size = const i0.Value.absent(),
              }) => i1.TrashedLocalAssetEntityCompanion.insert(
                id: id,
                albumId: albumId,
                checksum: checksum,
                name: name,
                type: type,
                createdAt: createdAt,
                updatedAt: updatedAt,
                size: size,
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
  static const i0.VerificationMeta _sizeMeta = const i0.VerificationMeta(
    'size',
  );
  @override
  late final i0.GeneratedColumn<int> size = i0.GeneratedColumn<int>(
    'size',
    aliasedName,
    true,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: false,
  );
  @override
  List<i0.GeneratedColumn> get $columns => [
    id,
    albumId,
    checksum,
    name,
    type,
    createdAt,
    updatedAt,
    size,
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
    if (data.containsKey('album_id')) {
      context.handle(
        _albumIdMeta,
        albumId.isAcceptableOrUnknown(data['album_id']!, _albumIdMeta),
      );
    } else if (isInserting) {
      context.missing(_albumIdMeta);
    }
    if (data.containsKey('checksum')) {
      context.handle(
        _checksumMeta,
        checksum.isAcceptableOrUnknown(data['checksum']!, _checksumMeta),
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
    if (data.containsKey('size')) {
      context.handle(
        _sizeMeta,
        size.isAcceptableOrUnknown(data['size']!, _sizeMeta),
      );
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {id};
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
      albumId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}album_id'],
      )!,
      checksum: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}checksum'],
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
      size: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}size'],
      ),
    );
  }

  @override
  $TrashedLocalAssetEntityTable createAlias(String alias) {
    return $TrashedLocalAssetEntityTable(attachedDatabase, alias);
  }

  static i0.JsonTypeConverter2<i2.AssetType, int, int> $convertertype =
      const i0.EnumIndexConverter<i2.AssetType>(i2.AssetType.values);
  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class TrashedLocalAssetEntityData extends i0.DataClass
    implements i0.Insertable<i1.TrashedLocalAssetEntityData> {
  final String id;
  final String albumId;
  final String? checksum;
  final String name;
  final i2.AssetType type;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int? size;
  const TrashedLocalAssetEntityData({
    required this.id,
    required this.albumId,
    this.checksum,
    required this.name,
    required this.type,
    required this.createdAt,
    required this.updatedAt,
    this.size,
  });
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['id'] = i0.Variable<String>(id);
    map['album_id'] = i0.Variable<String>(albumId);
    if (!nullToAbsent || checksum != null) {
      map['checksum'] = i0.Variable<String>(checksum);
    }
    map['name'] = i0.Variable<String>(name);
    {
      map['type'] = i0.Variable<int>(
        i1.$TrashedLocalAssetEntityTable.$convertertype.toSql(type),
      );
    }
    map['created_at'] = i0.Variable<DateTime>(createdAt);
    map['updated_at'] = i0.Variable<DateTime>(updatedAt);
    if (!nullToAbsent || size != null) {
      map['size'] = i0.Variable<int>(size);
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
      albumId: serializer.fromJson<String>(json['albumId']),
      checksum: serializer.fromJson<String?>(json['checksum']),
      name: serializer.fromJson<String>(json['name']),
      type: i1.$TrashedLocalAssetEntityTable.$convertertype.fromJson(
        serializer.fromJson<int>(json['type']),
      ),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      size: serializer.fromJson<int?>(json['size']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'albumId': serializer.toJson<String>(albumId),
      'checksum': serializer.toJson<String?>(checksum),
      'name': serializer.toJson<String>(name),
      'type': serializer.toJson<int>(
        i1.$TrashedLocalAssetEntityTable.$convertertype.toJson(type),
      ),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'size': serializer.toJson<int?>(size),
    };
  }

  i1.TrashedLocalAssetEntityData copyWith({
    String? id,
    String? albumId,
    i0.Value<String?> checksum = const i0.Value.absent(),
    String? name,
    i2.AssetType? type,
    DateTime? createdAt,
    DateTime? updatedAt,
    i0.Value<int?> size = const i0.Value.absent(),
  }) => i1.TrashedLocalAssetEntityData(
    id: id ?? this.id,
    albumId: albumId ?? this.albumId,
    checksum: checksum.present ? checksum.value : this.checksum,
    name: name ?? this.name,
    type: type ?? this.type,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
    size: size.present ? size.value : this.size,
  );
  TrashedLocalAssetEntityData copyWithCompanion(
    i1.TrashedLocalAssetEntityCompanion data,
  ) {
    return TrashedLocalAssetEntityData(
      id: data.id.present ? data.id.value : this.id,
      albumId: data.albumId.present ? data.albumId.value : this.albumId,
      checksum: data.checksum.present ? data.checksum.value : this.checksum,
      name: data.name.present ? data.name.value : this.name,
      type: data.type.present ? data.type.value : this.type,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      size: data.size.present ? data.size.value : this.size,
    );
  }

  @override
  String toString() {
    return (StringBuffer('TrashedLocalAssetEntityData(')
          ..write('id: $id, ')
          ..write('albumId: $albumId, ')
          ..write('checksum: $checksum, ')
          ..write('name: $name, ')
          ..write('type: $type, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('size: $size')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    albumId,
    checksum,
    name,
    type,
    createdAt,
    updatedAt,
    size,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.TrashedLocalAssetEntityData &&
          other.id == this.id &&
          other.albumId == this.albumId &&
          other.checksum == this.checksum &&
          other.name == this.name &&
          other.type == this.type &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt &&
          other.size == this.size);
}

class TrashedLocalAssetEntityCompanion
    extends i0.UpdateCompanion<i1.TrashedLocalAssetEntityData> {
  final i0.Value<String> id;
  final i0.Value<String> albumId;
  final i0.Value<String?> checksum;
  final i0.Value<String> name;
  final i0.Value<i2.AssetType> type;
  final i0.Value<DateTime> createdAt;
  final i0.Value<DateTime> updatedAt;
  final i0.Value<int?> size;
  const TrashedLocalAssetEntityCompanion({
    this.id = const i0.Value.absent(),
    this.albumId = const i0.Value.absent(),
    this.checksum = const i0.Value.absent(),
    this.name = const i0.Value.absent(),
    this.type = const i0.Value.absent(),
    this.createdAt = const i0.Value.absent(),
    this.updatedAt = const i0.Value.absent(),
    this.size = const i0.Value.absent(),
  });
  TrashedLocalAssetEntityCompanion.insert({
    required String id,
    required String albumId,
    this.checksum = const i0.Value.absent(),
    required String name,
    required i2.AssetType type,
    this.createdAt = const i0.Value.absent(),
    this.updatedAt = const i0.Value.absent(),
    this.size = const i0.Value.absent(),
  }) : id = i0.Value(id),
       albumId = i0.Value(albumId),
       name = i0.Value(name),
       type = i0.Value(type);
  static i0.Insertable<i1.TrashedLocalAssetEntityData> custom({
    i0.Expression<String>? id,
    i0.Expression<String>? albumId,
    i0.Expression<String>? checksum,
    i0.Expression<String>? name,
    i0.Expression<int>? type,
    i0.Expression<DateTime>? createdAt,
    i0.Expression<DateTime>? updatedAt,
    i0.Expression<int>? size,
  }) {
    return i0.RawValuesInsertable({
      if (id != null) 'id': id,
      if (albumId != null) 'album_id': albumId,
      if (checksum != null) 'checksum': checksum,
      if (name != null) 'name': name,
      if (type != null) 'type': type,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (size != null) 'size': size,
    });
  }

  i1.TrashedLocalAssetEntityCompanion copyWith({
    i0.Value<String>? id,
    i0.Value<String>? albumId,
    i0.Value<String?>? checksum,
    i0.Value<String>? name,
    i0.Value<i2.AssetType>? type,
    i0.Value<DateTime>? createdAt,
    i0.Value<DateTime>? updatedAt,
    i0.Value<int?>? size,
  }) {
    return i1.TrashedLocalAssetEntityCompanion(
      id: id ?? this.id,
      albumId: albumId ?? this.albumId,
      checksum: checksum ?? this.checksum,
      name: name ?? this.name,
      type: type ?? this.type,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      size: size ?? this.size,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (id.present) {
      map['id'] = i0.Variable<String>(id.value);
    }
    if (albumId.present) {
      map['album_id'] = i0.Variable<String>(albumId.value);
    }
    if (checksum.present) {
      map['checksum'] = i0.Variable<String>(checksum.value);
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
    if (size.present) {
      map['size'] = i0.Variable<int>(size.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('TrashedLocalAssetEntityCompanion(')
          ..write('id: $id, ')
          ..write('albumId: $albumId, ')
          ..write('checksum: $checksum, ')
          ..write('name: $name, ')
          ..write('type: $type, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('size: $size')
          ..write(')'))
        .toString();
  }
}
