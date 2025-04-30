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
  i0.Value<int?> durationInSeconds,
  required String localId,
  i0.Value<String?> checksum,
  i0.Value<bool> isFavorite,
});
typedef $$LocalAssetEntityTableUpdateCompanionBuilder
    = i1.LocalAssetEntityCompanion Function({
  i0.Value<String> name,
  i0.Value<i2.AssetType> type,
  i0.Value<DateTime> createdAt,
  i0.Value<DateTime> updatedAt,
  i0.Value<int?> durationInSeconds,
  i0.Value<String> localId,
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

  i0.ColumnFilters<int> get durationInSeconds => $composableBuilder(
      column: $table.durationInSeconds,
      builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get localId => $composableBuilder(
      column: $table.localId, builder: (column) => i0.ColumnFilters(column));

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

  i0.ColumnOrderings<int> get durationInSeconds => $composableBuilder(
      column: $table.durationInSeconds,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get localId => $composableBuilder(
      column: $table.localId, builder: (column) => i0.ColumnOrderings(column));

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

  i0.GeneratedColumn<int> get durationInSeconds => $composableBuilder(
      column: $table.durationInSeconds, builder: (column) => column);

  i0.GeneratedColumn<String> get localId =>
      $composableBuilder(column: $table.localId, builder: (column) => column);

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
            i0.Value<int?> durationInSeconds = const i0.Value.absent(),
            i0.Value<String> localId = const i0.Value.absent(),
            i0.Value<String?> checksum = const i0.Value.absent(),
            i0.Value<bool> isFavorite = const i0.Value.absent(),
          }) =>
              i1.LocalAssetEntityCompanion(
            name: name,
            type: type,
            createdAt: createdAt,
            updatedAt: updatedAt,
            durationInSeconds: durationInSeconds,
            localId: localId,
            checksum: checksum,
            isFavorite: isFavorite,
          ),
          createCompanionCallback: ({
            required String name,
            required i2.AssetType type,
            i0.Value<DateTime> createdAt = const i0.Value.absent(),
            i0.Value<DateTime> updatedAt = const i0.Value.absent(),
            i0.Value<int?> durationInSeconds = const i0.Value.absent(),
            required String localId,
            i0.Value<String?> checksum = const i0.Value.absent(),
            i0.Value<bool> isFavorite = const i0.Value.absent(),
          }) =>
              i1.LocalAssetEntityCompanion.insert(
            name: name,
            type: type,
            createdAt: createdAt,
            updatedAt: updatedAt,
            durationInSeconds: durationInSeconds,
            localId: localId,
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
i0.Index get localAssetChecksum => i0.Index('local_asset_checksum',
    'CREATE INDEX local_asset_checksum ON local_asset_entity (checksum)');

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
  static const i0.VerificationMeta _durationInSecondsMeta =
      const i0.VerificationMeta('durationInSeconds');
  @override
  late final i0.GeneratedColumn<int> durationInSeconds =
      i0.GeneratedColumn<int>('duration_in_seconds', aliasedName, true,
          type: i0.DriftSqlType.int, requiredDuringInsert: false);
  static const i0.VerificationMeta _localIdMeta =
      const i0.VerificationMeta('localId');
  @override
  late final i0.GeneratedColumn<String> localId = i0.GeneratedColumn<String>(
      'local_id', aliasedName, false,
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
        durationInSeconds,
        localId,
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
    if (data.containsKey('duration_in_seconds')) {
      context.handle(
          _durationInSecondsMeta,
          durationInSeconds.isAcceptableOrUnknown(
              data['duration_in_seconds']!, _durationInSecondsMeta));
    }
    if (data.containsKey('local_id')) {
      context.handle(_localIdMeta,
          localId.isAcceptableOrUnknown(data['local_id']!, _localIdMeta));
    } else if (isInserting) {
      context.missing(_localIdMeta);
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
  Set<i0.GeneratedColumn> get $primaryKey => {localId};
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
      durationInSeconds: attachedDatabase.typeMapping.read(
          i0.DriftSqlType.int, data['${effectivePrefix}duration_in_seconds']),
      localId: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}local_id'])!,
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
  final int? durationInSeconds;
  final String localId;
  final String? checksum;
  final bool isFavorite;
  const LocalAssetEntityData(
      {required this.name,
      required this.type,
      required this.createdAt,
      required this.updatedAt,
      this.durationInSeconds,
      required this.localId,
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
    if (!nullToAbsent || durationInSeconds != null) {
      map['duration_in_seconds'] = i0.Variable<int>(durationInSeconds);
    }
    map['local_id'] = i0.Variable<String>(localId);
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
      durationInSeconds: serializer.fromJson<int?>(json['durationInSeconds']),
      localId: serializer.fromJson<String>(json['localId']),
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
      'durationInSeconds': serializer.toJson<int?>(durationInSeconds),
      'localId': serializer.toJson<String>(localId),
      'checksum': serializer.toJson<String?>(checksum),
      'isFavorite': serializer.toJson<bool>(isFavorite),
    };
  }

  i1.LocalAssetEntityData copyWith(
          {String? name,
          i2.AssetType? type,
          DateTime? createdAt,
          DateTime? updatedAt,
          i0.Value<int?> durationInSeconds = const i0.Value.absent(),
          String? localId,
          i0.Value<String?> checksum = const i0.Value.absent(),
          bool? isFavorite}) =>
      i1.LocalAssetEntityData(
        name: name ?? this.name,
        type: type ?? this.type,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
        durationInSeconds: durationInSeconds.present
            ? durationInSeconds.value
            : this.durationInSeconds,
        localId: localId ?? this.localId,
        checksum: checksum.present ? checksum.value : this.checksum,
        isFavorite: isFavorite ?? this.isFavorite,
      );
  LocalAssetEntityData copyWithCompanion(i1.LocalAssetEntityCompanion data) {
    return LocalAssetEntityData(
      name: data.name.present ? data.name.value : this.name,
      type: data.type.present ? data.type.value : this.type,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      durationInSeconds: data.durationInSeconds.present
          ? data.durationInSeconds.value
          : this.durationInSeconds,
      localId: data.localId.present ? data.localId.value : this.localId,
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
          ..write('durationInSeconds: $durationInSeconds, ')
          ..write('localId: $localId, ')
          ..write('checksum: $checksum, ')
          ..write('isFavorite: $isFavorite')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(name, type, createdAt, updatedAt,
      durationInSeconds, localId, checksum, isFavorite);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.LocalAssetEntityData &&
          other.name == this.name &&
          other.type == this.type &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt &&
          other.durationInSeconds == this.durationInSeconds &&
          other.localId == this.localId &&
          other.checksum == this.checksum &&
          other.isFavorite == this.isFavorite);
}

class LocalAssetEntityCompanion
    extends i0.UpdateCompanion<i1.LocalAssetEntityData> {
  final i0.Value<String> name;
  final i0.Value<i2.AssetType> type;
  final i0.Value<DateTime> createdAt;
  final i0.Value<DateTime> updatedAt;
  final i0.Value<int?> durationInSeconds;
  final i0.Value<String> localId;
  final i0.Value<String?> checksum;
  final i0.Value<bool> isFavorite;
  const LocalAssetEntityCompanion({
    this.name = const i0.Value.absent(),
    this.type = const i0.Value.absent(),
    this.createdAt = const i0.Value.absent(),
    this.updatedAt = const i0.Value.absent(),
    this.durationInSeconds = const i0.Value.absent(),
    this.localId = const i0.Value.absent(),
    this.checksum = const i0.Value.absent(),
    this.isFavorite = const i0.Value.absent(),
  });
  LocalAssetEntityCompanion.insert({
    required String name,
    required i2.AssetType type,
    this.createdAt = const i0.Value.absent(),
    this.updatedAt = const i0.Value.absent(),
    this.durationInSeconds = const i0.Value.absent(),
    required String localId,
    this.checksum = const i0.Value.absent(),
    this.isFavorite = const i0.Value.absent(),
  })  : name = i0.Value(name),
        type = i0.Value(type),
        localId = i0.Value(localId);
  static i0.Insertable<i1.LocalAssetEntityData> custom({
    i0.Expression<String>? name,
    i0.Expression<int>? type,
    i0.Expression<DateTime>? createdAt,
    i0.Expression<DateTime>? updatedAt,
    i0.Expression<int>? durationInSeconds,
    i0.Expression<String>? localId,
    i0.Expression<String>? checksum,
    i0.Expression<bool>? isFavorite,
  }) {
    return i0.RawValuesInsertable({
      if (name != null) 'name': name,
      if (type != null) 'type': type,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (durationInSeconds != null) 'duration_in_seconds': durationInSeconds,
      if (localId != null) 'local_id': localId,
      if (checksum != null) 'checksum': checksum,
      if (isFavorite != null) 'is_favorite': isFavorite,
    });
  }

  i1.LocalAssetEntityCompanion copyWith(
      {i0.Value<String>? name,
      i0.Value<i2.AssetType>? type,
      i0.Value<DateTime>? createdAt,
      i0.Value<DateTime>? updatedAt,
      i0.Value<int?>? durationInSeconds,
      i0.Value<String>? localId,
      i0.Value<String?>? checksum,
      i0.Value<bool>? isFavorite}) {
    return i1.LocalAssetEntityCompanion(
      name: name ?? this.name,
      type: type ?? this.type,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      durationInSeconds: durationInSeconds ?? this.durationInSeconds,
      localId: localId ?? this.localId,
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
    if (durationInSeconds.present) {
      map['duration_in_seconds'] = i0.Variable<int>(durationInSeconds.value);
    }
    if (localId.present) {
      map['local_id'] = i0.Variable<String>(localId.value);
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
          ..write('durationInSeconds: $durationInSeconds, ')
          ..write('localId: $localId, ')
          ..write('checksum: $checksum, ')
          ..write('isFavorite: $isFavorite')
          ..write(')'))
        .toString();
  }
}
