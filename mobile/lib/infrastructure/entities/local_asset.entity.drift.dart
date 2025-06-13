// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart'
    as i1;
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart' as i2;
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.dart'
    as i3;
import 'package:drift/src/runtime/query_builder/query_builder.dart' as i4;

typedef $$LocalAssetEntityTableCreateCompanionBuilder
    = i1.LocalAssetEntityCompanion Function({
  required String name,
  required i2.AssetType type,
  i0.Value<DateTime> createdAt,
  i0.Value<DateTime> updatedAt,
  i0.Value<int?> width,
  i0.Value<int?> height,
  i0.Value<int?> durationInSeconds,
  required String id,
  i0.Value<String?> checksum,
  i0.Value<bool> isFavorite,
});
typedef $$LocalAssetEntityTableUpdateCompanionBuilder
    = i1.LocalAssetEntityCompanion Function({
  i0.Value<String> name,
  i0.Value<i2.AssetType> type,
  i0.Value<DateTime> createdAt,
  i0.Value<DateTime> updatedAt,
  i0.Value<int?> width,
  i0.Value<int?> height,
  i0.Value<int?> durationInSeconds,
  i0.Value<String> id,
  i0.Value<String?> checksum,
  i0.Value<bool> isFavorite,
});

class $$LocalAssetEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$LocalAssetEntityTable> {
  $$LocalAssetEntityTableFilterComposer({
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

  i0.ColumnFilters<int> get width => $composableBuilder(
      column: $table.width, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<int> get height => $composableBuilder(
      column: $table.height, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<int> get durationInSeconds => $composableBuilder(
      column: $table.durationInSeconds,
      builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get checksum => $composableBuilder(
      column: $table.checksum, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<bool> get isFavorite => $composableBuilder(
      column: $table.isFavorite, builder: (column) => i0.ColumnFilters(column));
}

class $$LocalAssetEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$LocalAssetEntityTable> {
  $$LocalAssetEntityTableOrderingComposer({
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

  i0.ColumnOrderings<int> get width => $composableBuilder(
      column: $table.width, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<int> get height => $composableBuilder(
      column: $table.height, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<int> get durationInSeconds => $composableBuilder(
      column: $table.durationInSeconds,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get checksum => $composableBuilder(
      column: $table.checksum, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<bool> get isFavorite => $composableBuilder(
      column: $table.isFavorite,
      builder: (column) => i0.ColumnOrderings(column));
}

class $$LocalAssetEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$LocalAssetEntityTable> {
  $$LocalAssetEntityTableAnnotationComposer({
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

  i0.GeneratedColumn<int> get width =>
      $composableBuilder(column: $table.width, builder: (column) => column);

  i0.GeneratedColumn<int> get height =>
      $composableBuilder(column: $table.height, builder: (column) => column);

  i0.GeneratedColumn<int> get durationInSeconds => $composableBuilder(
      column: $table.durationInSeconds, builder: (column) => column);

  i0.GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  i0.GeneratedColumn<String> get checksum =>
      $composableBuilder(column: $table.checksum, builder: (column) => column);

  i0.GeneratedColumn<bool> get isFavorite => $composableBuilder(
      column: $table.isFavorite, builder: (column) => column);
}

class $$LocalAssetEntityTableTableManager extends i0.RootTableManager<
    i0.GeneratedDatabase,
    i1.$LocalAssetEntityTable,
    i1.LocalAssetEntityData,
    i1.$$LocalAssetEntityTableFilterComposer,
    i1.$$LocalAssetEntityTableOrderingComposer,
    i1.$$LocalAssetEntityTableAnnotationComposer,
    $$LocalAssetEntityTableCreateCompanionBuilder,
    $$LocalAssetEntityTableUpdateCompanionBuilder,
    (
      i1.LocalAssetEntityData,
      i0.BaseReferences<i0.GeneratedDatabase, i1.$LocalAssetEntityTable,
          i1.LocalAssetEntityData>
    ),
    i1.LocalAssetEntityData,
    i0.PrefetchHooks Function()> {
  $$LocalAssetEntityTableTableManager(
      i0.GeneratedDatabase db, i1.$LocalAssetEntityTable table)
      : super(i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$LocalAssetEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () => i1
              .$$LocalAssetEntityTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              i1.$$LocalAssetEntityTableAnnotationComposer(
                  $db: db, $table: table),
          updateCompanionCallback: ({
            i0.Value<String> name = const i0.Value.absent(),
            i0.Value<i2.AssetType> type = const i0.Value.absent(),
            i0.Value<DateTime> createdAt = const i0.Value.absent(),
            i0.Value<DateTime> updatedAt = const i0.Value.absent(),
            i0.Value<int?> width = const i0.Value.absent(),
            i0.Value<int?> height = const i0.Value.absent(),
            i0.Value<int?> durationInSeconds = const i0.Value.absent(),
            i0.Value<String> id = const i0.Value.absent(),
            i0.Value<String?> checksum = const i0.Value.absent(),
            i0.Value<bool> isFavorite = const i0.Value.absent(),
          }) =>
              i1.LocalAssetEntityCompanion(
            name: name,
            type: type,
            createdAt: createdAt,
            updatedAt: updatedAt,
            width: width,
            height: height,
            durationInSeconds: durationInSeconds,
            id: id,
            checksum: checksum,
            isFavorite: isFavorite,
          ),
          createCompanionCallback: ({
            required String name,
            required i2.AssetType type,
            i0.Value<DateTime> createdAt = const i0.Value.absent(),
            i0.Value<DateTime> updatedAt = const i0.Value.absent(),
            i0.Value<int?> width = const i0.Value.absent(),
            i0.Value<int?> height = const i0.Value.absent(),
            i0.Value<int?> durationInSeconds = const i0.Value.absent(),
            required String id,
            i0.Value<String?> checksum = const i0.Value.absent(),
            i0.Value<bool> isFavorite = const i0.Value.absent(),
          }) =>
              i1.LocalAssetEntityCompanion.insert(
            name: name,
            type: type,
            createdAt: createdAt,
            updatedAt: updatedAt,
            width: width,
            height: height,
            durationInSeconds: durationInSeconds,
            id: id,
            checksum: checksum,
            isFavorite: isFavorite,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), i0.BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$LocalAssetEntityTableProcessedTableManager = i0.ProcessedTableManager<
    i0.GeneratedDatabase,
    i1.$LocalAssetEntityTable,
    i1.LocalAssetEntityData,
    i1.$$LocalAssetEntityTableFilterComposer,
    i1.$$LocalAssetEntityTableOrderingComposer,
    i1.$$LocalAssetEntityTableAnnotationComposer,
    $$LocalAssetEntityTableCreateCompanionBuilder,
    $$LocalAssetEntityTableUpdateCompanionBuilder,
    (
      i1.LocalAssetEntityData,
      i0.BaseReferences<i0.GeneratedDatabase, i1.$LocalAssetEntityTable,
          i1.LocalAssetEntityData>
    ),
    i1.LocalAssetEntityData,
    i0.PrefetchHooks Function()>;
i0.Index get idxLocalAssetChecksum => i0.Index('idx_local_asset_checksum',
    'CREATE INDEX idx_local_asset_checksum ON local_asset_entity (checksum)');

class $LocalAssetEntityTable extends i3.LocalAssetEntity
    with i0.TableInfo<$LocalAssetEntityTable, i1.LocalAssetEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalAssetEntityTable(this.attachedDatabase, [this._alias]);
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
              i1.$LocalAssetEntityTable.$convertertype);
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
  static const i0.VerificationMeta _widthMeta =
      const i0.VerificationMeta('width');
  @override
  late final i0.GeneratedColumn<int> width = i0.GeneratedColumn<int>(
      'width', aliasedName, true,
      type: i0.DriftSqlType.int, requiredDuringInsert: false);
  static const i0.VerificationMeta _heightMeta =
      const i0.VerificationMeta('height');
  @override
  late final i0.GeneratedColumn<int> height = i0.GeneratedColumn<int>(
      'height', aliasedName, true,
      type: i0.DriftSqlType.int, requiredDuringInsert: false);
  static const i0.VerificationMeta _durationInSecondsMeta =
      const i0.VerificationMeta('durationInSeconds');
  @override
  late final i0.GeneratedColumn<int> durationInSeconds =
      i0.GeneratedColumn<int>('duration_in_seconds', aliasedName, true,
          type: i0.DriftSqlType.int, requiredDuringInsert: false);
  static const i0.VerificationMeta _idMeta = const i0.VerificationMeta('id');
  @override
  late final i0.GeneratedColumn<String> id = i0.GeneratedColumn<String>(
      'id', aliasedName, false,
      type: i0.DriftSqlType.string, requiredDuringInsert: true);
  static const i0.VerificationMeta _checksumMeta =
      const i0.VerificationMeta('checksum');
  @override
  late final i0.GeneratedColumn<String> checksum = i0.GeneratedColumn<String>(
      'checksum', aliasedName, true,
      type: i0.DriftSqlType.string, requiredDuringInsert: false);
  static const i0.VerificationMeta _isFavoriteMeta =
      const i0.VerificationMeta('isFavorite');
  @override
  late final i0.GeneratedColumn<bool> isFavorite = i0.GeneratedColumn<bool>(
      'is_favorite', aliasedName, false,
      type: i0.DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
          'CHECK ("is_favorite" IN (0, 1))'),
      defaultValue: const i4.Constant(false));
  @override
  List<i0.GeneratedColumn> get $columns => [
        name,
        type,
        createdAt,
        updatedAt,
        width,
        height,
        durationInSeconds,
        id,
        checksum,
        isFavorite
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_asset_entity';
  @override
  i0.VerificationContext validateIntegrity(
      i0.Insertable<i1.LocalAssetEntityData> instance,
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
    if (data.containsKey('width')) {
      context.handle(
          _widthMeta, width.isAcceptableOrUnknown(data['width']!, _widthMeta));
    }
    if (data.containsKey('height')) {
      context.handle(_heightMeta,
          height.isAcceptableOrUnknown(data['height']!, _heightMeta));
    }
    if (data.containsKey('duration_in_seconds')) {
      context.handle(
          _durationInSecondsMeta,
          durationInSeconds.isAcceptableOrUnknown(
              data['duration_in_seconds']!, _durationInSecondsMeta));
    }
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('checksum')) {
      context.handle(_checksumMeta,
          checksum.isAcceptableOrUnknown(data['checksum']!, _checksumMeta));
    }
    if (data.containsKey('is_favorite')) {
      context.handle(
          _isFavoriteMeta,
          isFavorite.isAcceptableOrUnknown(
              data['is_favorite']!, _isFavoriteMeta));
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {id};
  @override
  i1.LocalAssetEntityData map(Map<String, dynamic> data,
      {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.LocalAssetEntityData(
      name: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}name'])!,
      type: i1.$LocalAssetEntityTable.$convertertype.fromSql(attachedDatabase
          .typeMapping
          .read(i0.DriftSqlType.int, data['${effectivePrefix}type'])!),
      createdAt: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      updatedAt: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
      width: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.int, data['${effectivePrefix}width']),
      height: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.int, data['${effectivePrefix}height']),
      durationInSeconds: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.int, data['${effectivePrefix}duration_in_seconds']),
      id: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}id'])!,
      checksum: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}checksum']),
      isFavorite: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.bool, data['${effectivePrefix}is_favorite'])!,
    );
  }

  @override
  $LocalAssetEntityTable createAlias(String alias) {
    return $LocalAssetEntityTable(attachedDatabase, alias);
  }

  static i0.JsonTypeConverter2<i2.AssetType, int, int> $convertertype =
      const i0.EnumIndexConverter<i2.AssetType>(i2.AssetType.values);
  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class LocalAssetEntityData extends i0.DataClass
    implements i0.Insertable<i1.LocalAssetEntityData> {
  final String name;
  final i2.AssetType type;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int? width;
  final int? height;
  final int? durationInSeconds;
  final String id;
  final String? checksum;
  final bool isFavorite;
  const LocalAssetEntityData(
      {required this.name,
      required this.type,
      required this.createdAt,
      required this.updatedAt,
      this.width,
      this.height,
      this.durationInSeconds,
      required this.id,
      this.checksum,
      required this.isFavorite});
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['name'] = i0.Variable<String>(name);
    {
      map['type'] = i0.Variable<int>(
          i1.$LocalAssetEntityTable.$convertertype.toSql(type));
    }
    map['created_at'] = i0.Variable<DateTime>(createdAt);
    map['updated_at'] = i0.Variable<DateTime>(updatedAt);
    if (!nullToAbsent || width != null) {
      map['width'] = i0.Variable<int>(width);
    }
    if (!nullToAbsent || height != null) {
      map['height'] = i0.Variable<int>(height);
    }
    if (!nullToAbsent || durationInSeconds != null) {
      map['duration_in_seconds'] = i0.Variable<int>(durationInSeconds);
    }
    map['id'] = i0.Variable<String>(id);
    if (!nullToAbsent || checksum != null) {
      map['checksum'] = i0.Variable<String>(checksum);
    }
    map['is_favorite'] = i0.Variable<bool>(isFavorite);
    return map;
  }

  factory LocalAssetEntityData.fromJson(Map<String, dynamic> json,
      {i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return LocalAssetEntityData(
      name: serializer.fromJson<String>(json['name']),
      type: i1.$LocalAssetEntityTable.$convertertype
          .fromJson(serializer.fromJson<int>(json['type'])),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      width: serializer.fromJson<int?>(json['width']),
      height: serializer.fromJson<int?>(json['height']),
      durationInSeconds: serializer.fromJson<int?>(json['durationInSeconds']),
      id: serializer.fromJson<String>(json['id']),
      checksum: serializer.fromJson<String?>(json['checksum']),
      isFavorite: serializer.fromJson<bool>(json['isFavorite']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'name': serializer.toJson<String>(name),
      'type': serializer
          .toJson<int>(i1.$LocalAssetEntityTable.$convertertype.toJson(type)),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'width': serializer.toJson<int?>(width),
      'height': serializer.toJson<int?>(height),
      'durationInSeconds': serializer.toJson<int?>(durationInSeconds),
      'id': serializer.toJson<String>(id),
      'checksum': serializer.toJson<String?>(checksum),
      'isFavorite': serializer.toJson<bool>(isFavorite),
    };
  }

  i1.LocalAssetEntityData copyWith(
          {String? name,
          i2.AssetType? type,
          DateTime? createdAt,
          DateTime? updatedAt,
          i0.Value<int?> width = const i0.Value.absent(),
          i0.Value<int?> height = const i0.Value.absent(),
          i0.Value<int?> durationInSeconds = const i0.Value.absent(),
          String? id,
          i0.Value<String?> checksum = const i0.Value.absent(),
          bool? isFavorite}) =>
      i1.LocalAssetEntityData(
        name: name ?? this.name,
        type: type ?? this.type,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
        width: width.present ? width.value : this.width,
        height: height.present ? height.value : this.height,
        durationInSeconds: durationInSeconds.present
            ? durationInSeconds.value
            : this.durationInSeconds,
        id: id ?? this.id,
        checksum: checksum.present ? checksum.value : this.checksum,
        isFavorite: isFavorite ?? this.isFavorite,
      );
  LocalAssetEntityData copyWithCompanion(i1.LocalAssetEntityCompanion data) {
    return LocalAssetEntityData(
      name: data.name.present ? data.name.value : this.name,
      type: data.type.present ? data.type.value : this.type,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      width: data.width.present ? data.width.value : this.width,
      height: data.height.present ? data.height.value : this.height,
      durationInSeconds: data.durationInSeconds.present
          ? data.durationInSeconds.value
          : this.durationInSeconds,
      id: data.id.present ? data.id.value : this.id,
      checksum: data.checksum.present ? data.checksum.value : this.checksum,
      isFavorite:
          data.isFavorite.present ? data.isFavorite.value : this.isFavorite,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalAssetEntityData(')
          ..write('name: $name, ')
          ..write('type: $type, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('width: $width, ')
          ..write('height: $height, ')
          ..write('durationInSeconds: $durationInSeconds, ')
          ..write('id: $id, ')
          ..write('checksum: $checksum, ')
          ..write('isFavorite: $isFavorite')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(name, type, createdAt, updatedAt, width,
      height, durationInSeconds, id, checksum, isFavorite);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.LocalAssetEntityData &&
          other.name == this.name &&
          other.type == this.type &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt &&
          other.width == this.width &&
          other.height == this.height &&
          other.durationInSeconds == this.durationInSeconds &&
          other.id == this.id &&
          other.checksum == this.checksum &&
          other.isFavorite == this.isFavorite);
}

class LocalAssetEntityCompanion
    extends i0.UpdateCompanion<i1.LocalAssetEntityData> {
  final i0.Value<String> name;
  final i0.Value<i2.AssetType> type;
  final i0.Value<DateTime> createdAt;
  final i0.Value<DateTime> updatedAt;
  final i0.Value<int?> width;
  final i0.Value<int?> height;
  final i0.Value<int?> durationInSeconds;
  final i0.Value<String> id;
  final i0.Value<String?> checksum;
  final i0.Value<bool> isFavorite;
  const LocalAssetEntityCompanion({
    this.name = const i0.Value.absent(),
    this.type = const i0.Value.absent(),
    this.createdAt = const i0.Value.absent(),
    this.updatedAt = const i0.Value.absent(),
    this.width = const i0.Value.absent(),
    this.height = const i0.Value.absent(),
    this.durationInSeconds = const i0.Value.absent(),
    this.id = const i0.Value.absent(),
    this.checksum = const i0.Value.absent(),
    this.isFavorite = const i0.Value.absent(),
  });
  LocalAssetEntityCompanion.insert({
    required String name,
    required i2.AssetType type,
    this.createdAt = const i0.Value.absent(),
    this.updatedAt = const i0.Value.absent(),
    this.width = const i0.Value.absent(),
    this.height = const i0.Value.absent(),
    this.durationInSeconds = const i0.Value.absent(),
    required String id,
    this.checksum = const i0.Value.absent(),
    this.isFavorite = const i0.Value.absent(),
  })  : name = i0.Value(name),
        type = i0.Value(type),
        id = i0.Value(id);
  static i0.Insertable<i1.LocalAssetEntityData> custom({
    i0.Expression<String>? name,
    i0.Expression<int>? type,
    i0.Expression<DateTime>? createdAt,
    i0.Expression<DateTime>? updatedAt,
    i0.Expression<int>? width,
    i0.Expression<int>? height,
    i0.Expression<int>? durationInSeconds,
    i0.Expression<String>? id,
    i0.Expression<String>? checksum,
    i0.Expression<bool>? isFavorite,
  }) {
    return i0.RawValuesInsertable({
      if (name != null) 'name': name,
      if (type != null) 'type': type,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (width != null) 'width': width,
      if (height != null) 'height': height,
      if (durationInSeconds != null) 'duration_in_seconds': durationInSeconds,
      if (id != null) 'id': id,
      if (checksum != null) 'checksum': checksum,
      if (isFavorite != null) 'is_favorite': isFavorite,
    });
  }

  i1.LocalAssetEntityCompanion copyWith(
      {i0.Value<String>? name,
      i0.Value<i2.AssetType>? type,
      i0.Value<DateTime>? createdAt,
      i0.Value<DateTime>? updatedAt,
      i0.Value<int?>? width,
      i0.Value<int?>? height,
      i0.Value<int?>? durationInSeconds,
      i0.Value<String>? id,
      i0.Value<String?>? checksum,
      i0.Value<bool>? isFavorite}) {
    return i1.LocalAssetEntityCompanion(
      name: name ?? this.name,
      type: type ?? this.type,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      width: width ?? this.width,
      height: height ?? this.height,
      durationInSeconds: durationInSeconds ?? this.durationInSeconds,
      id: id ?? this.id,
      checksum: checksum ?? this.checksum,
      isFavorite: isFavorite ?? this.isFavorite,
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
          i1.$LocalAssetEntityTable.$convertertype.toSql(type.value));
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
    if (durationInSeconds.present) {
      map['duration_in_seconds'] = i0.Variable<int>(durationInSeconds.value);
    }
    if (id.present) {
      map['id'] = i0.Variable<String>(id.value);
    }
    if (checksum.present) {
      map['checksum'] = i0.Variable<String>(checksum.value);
    }
    if (isFavorite.present) {
      map['is_favorite'] = i0.Variable<bool>(isFavorite.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalAssetEntityCompanion(')
          ..write('name: $name, ')
          ..write('type: $type, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('width: $width, ')
          ..write('height: $height, ')
          ..write('durationInSeconds: $durationInSeconds, ')
          ..write('id: $id, ')
          ..write('checksum: $checksum, ')
          ..write('isFavorite: $isFavorite')
          ..write(')'))
        .toString();
  }
}
