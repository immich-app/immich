// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/trash_sync.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/trash_sync.entity.dart'
    as i2;
import 'package:drift/src/runtime/query_builder/query_builder.dart' as i3;

typedef $$TrashSyncEntityTableCreateCompanionBuilder =
    i1.TrashSyncEntityCompanion Function({
      required String assetId,
      required String checksum,
      i0.Value<bool?> isSyncApproved,
      i0.Value<DateTime> createdAt,
    });
typedef $$TrashSyncEntityTableUpdateCompanionBuilder =
    i1.TrashSyncEntityCompanion Function({
      i0.Value<String> assetId,
      i0.Value<String> checksum,
      i0.Value<bool?> isSyncApproved,
      i0.Value<DateTime> createdAt,
    });

class $$TrashSyncEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$TrashSyncEntityTable> {
  $$TrashSyncEntityTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnFilters<String> get assetId => $composableBuilder(
    column: $table.assetId,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<String> get checksum => $composableBuilder(
    column: $table.checksum,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<bool> get isSyncApproved => $composableBuilder(
    column: $table.isSyncApproved,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => i0.ColumnFilters(column),
  );
}

class $$TrashSyncEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$TrashSyncEntityTable> {
  $$TrashSyncEntityTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnOrderings<String> get assetId => $composableBuilder(
    column: $table.assetId,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get checksum => $composableBuilder(
    column: $table.checksum,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<bool> get isSyncApproved => $composableBuilder(
    column: $table.isSyncApproved,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => i0.ColumnOrderings(column),
  );
}

class $$TrashSyncEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$TrashSyncEntityTable> {
  $$TrashSyncEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<String> get assetId =>
      $composableBuilder(column: $table.assetId, builder: (column) => column);

  i0.GeneratedColumn<String> get checksum =>
      $composableBuilder(column: $table.checksum, builder: (column) => column);

  i0.GeneratedColumn<bool> get isSyncApproved => $composableBuilder(
    column: $table.isSyncApproved,
    builder: (column) => column,
  );

  i0.GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);
}

class $$TrashSyncEntityTableTableManager
    extends
        i0.RootTableManager<
          i0.GeneratedDatabase,
          i1.$TrashSyncEntityTable,
          i1.TrashSyncEntityData,
          i1.$$TrashSyncEntityTableFilterComposer,
          i1.$$TrashSyncEntityTableOrderingComposer,
          i1.$$TrashSyncEntityTableAnnotationComposer,
          $$TrashSyncEntityTableCreateCompanionBuilder,
          $$TrashSyncEntityTableUpdateCompanionBuilder,
          (
            i1.TrashSyncEntityData,
            i0.BaseReferences<
              i0.GeneratedDatabase,
              i1.$TrashSyncEntityTable,
              i1.TrashSyncEntityData
            >,
          ),
          i1.TrashSyncEntityData,
          i0.PrefetchHooks Function()
        > {
  $$TrashSyncEntityTableTableManager(
    i0.GeneratedDatabase db,
    i1.$TrashSyncEntityTable table,
  ) : super(
        i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$TrashSyncEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              i1.$$TrashSyncEntityTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () => i1
              .$$TrashSyncEntityTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                i0.Value<String> assetId = const i0.Value.absent(),
                i0.Value<String> checksum = const i0.Value.absent(),
                i0.Value<bool?> isSyncApproved = const i0.Value.absent(),
                i0.Value<DateTime> createdAt = const i0.Value.absent(),
              }) => i1.TrashSyncEntityCompanion(
                assetId: assetId,
                checksum: checksum,
                isSyncApproved: isSyncApproved,
                createdAt: createdAt,
              ),
          createCompanionCallback:
              ({
                required String assetId,
                required String checksum,
                i0.Value<bool?> isSyncApproved = const i0.Value.absent(),
                i0.Value<DateTime> createdAt = const i0.Value.absent(),
              }) => i1.TrashSyncEntityCompanion.insert(
                assetId: assetId,
                checksum: checksum,
                isSyncApproved: isSyncApproved,
                createdAt: createdAt,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), i0.BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$TrashSyncEntityTableProcessedTableManager =
    i0.ProcessedTableManager<
      i0.GeneratedDatabase,
      i1.$TrashSyncEntityTable,
      i1.TrashSyncEntityData,
      i1.$$TrashSyncEntityTableFilterComposer,
      i1.$$TrashSyncEntityTableOrderingComposer,
      i1.$$TrashSyncEntityTableAnnotationComposer,
      $$TrashSyncEntityTableCreateCompanionBuilder,
      $$TrashSyncEntityTableUpdateCompanionBuilder,
      (
        i1.TrashSyncEntityData,
        i0.BaseReferences<
          i0.GeneratedDatabase,
          i1.$TrashSyncEntityTable,
          i1.TrashSyncEntityData
        >,
      ),
      i1.TrashSyncEntityData,
      i0.PrefetchHooks Function()
    >;
i0.Index get idxTrashSyncChecksum => i0.Index(
  'idx_trash_sync_checksum',
  'CREATE INDEX idx_trash_sync_checksum ON trash_sync_entity (checksum)',
);

class $TrashSyncEntityTable extends i2.TrashSyncEntity
    with i0.TableInfo<$TrashSyncEntityTable, i1.TrashSyncEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $TrashSyncEntityTable(this.attachedDatabase, [this._alias]);
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
  );
  static const i0.VerificationMeta _checksumMeta = const i0.VerificationMeta(
    'checksum',
  );
  @override
  late final i0.GeneratedColumn<String> checksum = i0.GeneratedColumn<String>(
    'checksum',
    aliasedName,
    false,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const i0.VerificationMeta _isSyncApprovedMeta =
      const i0.VerificationMeta('isSyncApproved');
  @override
  late final i0.GeneratedColumn<bool> isSyncApproved = i0.GeneratedColumn<bool>(
    'is_sync_approved',
    aliasedName,
    true,
    type: i0.DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
      'CHECK ("is_sync_approved" IN (0, 1))',
    ),
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
        defaultValue: i3.currentDateAndTime,
      );
  @override
  List<i0.GeneratedColumn> get $columns => [
    assetId,
    checksum,
    isSyncApproved,
    createdAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'trash_sync_entity';
  @override
  i0.VerificationContext validateIntegrity(
    i0.Insertable<i1.TrashSyncEntityData> instance, {
    bool isInserting = false,
  }) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('asset_id')) {
      context.handle(
        _assetIdMeta,
        assetId.isAcceptableOrUnknown(data['asset_id']!, _assetIdMeta),
      );
    } else if (isInserting) {
      context.missing(_assetIdMeta);
    }
    if (data.containsKey('checksum')) {
      context.handle(
        _checksumMeta,
        checksum.isAcceptableOrUnknown(data['checksum']!, _checksumMeta),
      );
    } else if (isInserting) {
      context.missing(_checksumMeta);
    }
    if (data.containsKey('is_sync_approved')) {
      context.handle(
        _isSyncApprovedMeta,
        isSyncApproved.isAcceptableOrUnknown(
          data['is_sync_approved']!,
          _isSyncApprovedMeta,
        ),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {assetId};
  @override
  i1.TrashSyncEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.TrashSyncEntityData(
      assetId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}asset_id'],
      )!,
      checksum: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}checksum'],
      )!,
      isSyncApproved: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.bool,
        data['${effectivePrefix}is_sync_approved'],
      ),
      createdAt: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
    );
  }

  @override
  $TrashSyncEntityTable createAlias(String alias) {
    return $TrashSyncEntityTable(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class TrashSyncEntityData extends i0.DataClass
    implements i0.Insertable<i1.TrashSyncEntityData> {
  final String assetId;
  final String checksum;
  final bool? isSyncApproved;
  final DateTime createdAt;
  const TrashSyncEntityData({
    required this.assetId,
    required this.checksum,
    this.isSyncApproved,
    required this.createdAt,
  });
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['asset_id'] = i0.Variable<String>(assetId);
    map['checksum'] = i0.Variable<String>(checksum);
    if (!nullToAbsent || isSyncApproved != null) {
      map['is_sync_approved'] = i0.Variable<bool>(isSyncApproved);
    }
    map['created_at'] = i0.Variable<DateTime>(createdAt);
    return map;
  }

  factory TrashSyncEntityData.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return TrashSyncEntityData(
      assetId: serializer.fromJson<String>(json['assetId']),
      checksum: serializer.fromJson<String>(json['checksum']),
      isSyncApproved: serializer.fromJson<bool?>(json['isSyncApproved']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'assetId': serializer.toJson<String>(assetId),
      'checksum': serializer.toJson<String>(checksum),
      'isSyncApproved': serializer.toJson<bool?>(isSyncApproved),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  i1.TrashSyncEntityData copyWith({
    String? assetId,
    String? checksum,
    i0.Value<bool?> isSyncApproved = const i0.Value.absent(),
    DateTime? createdAt,
  }) => i1.TrashSyncEntityData(
    assetId: assetId ?? this.assetId,
    checksum: checksum ?? this.checksum,
    isSyncApproved: isSyncApproved.present
        ? isSyncApproved.value
        : this.isSyncApproved,
    createdAt: createdAt ?? this.createdAt,
  );
  TrashSyncEntityData copyWithCompanion(i1.TrashSyncEntityCompanion data) {
    return TrashSyncEntityData(
      assetId: data.assetId.present ? data.assetId.value : this.assetId,
      checksum: data.checksum.present ? data.checksum.value : this.checksum,
      isSyncApproved: data.isSyncApproved.present
          ? data.isSyncApproved.value
          : this.isSyncApproved,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('TrashSyncEntityData(')
          ..write('assetId: $assetId, ')
          ..write('checksum: $checksum, ')
          ..write('isSyncApproved: $isSyncApproved, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(assetId, checksum, isSyncApproved, createdAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.TrashSyncEntityData &&
          other.assetId == this.assetId &&
          other.checksum == this.checksum &&
          other.isSyncApproved == this.isSyncApproved &&
          other.createdAt == this.createdAt);
}

class TrashSyncEntityCompanion
    extends i0.UpdateCompanion<i1.TrashSyncEntityData> {
  final i0.Value<String> assetId;
  final i0.Value<String> checksum;
  final i0.Value<bool?> isSyncApproved;
  final i0.Value<DateTime> createdAt;
  const TrashSyncEntityCompanion({
    this.assetId = const i0.Value.absent(),
    this.checksum = const i0.Value.absent(),
    this.isSyncApproved = const i0.Value.absent(),
    this.createdAt = const i0.Value.absent(),
  });
  TrashSyncEntityCompanion.insert({
    required String assetId,
    required String checksum,
    this.isSyncApproved = const i0.Value.absent(),
    this.createdAt = const i0.Value.absent(),
  }) : assetId = i0.Value(assetId),
       checksum = i0.Value(checksum);
  static i0.Insertable<i1.TrashSyncEntityData> custom({
    i0.Expression<String>? assetId,
    i0.Expression<String>? checksum,
    i0.Expression<bool>? isSyncApproved,
    i0.Expression<DateTime>? createdAt,
  }) {
    return i0.RawValuesInsertable({
      if (assetId != null) 'asset_id': assetId,
      if (checksum != null) 'checksum': checksum,
      if (isSyncApproved != null) 'is_sync_approved': isSyncApproved,
      if (createdAt != null) 'created_at': createdAt,
    });
  }

  i1.TrashSyncEntityCompanion copyWith({
    i0.Value<String>? assetId,
    i0.Value<String>? checksum,
    i0.Value<bool?>? isSyncApproved,
    i0.Value<DateTime>? createdAt,
  }) {
    return i1.TrashSyncEntityCompanion(
      assetId: assetId ?? this.assetId,
      checksum: checksum ?? this.checksum,
      isSyncApproved: isSyncApproved ?? this.isSyncApproved,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (assetId.present) {
      map['asset_id'] = i0.Variable<String>(assetId.value);
    }
    if (checksum.present) {
      map['checksum'] = i0.Variable<String>(checksum.value);
    }
    if (isSyncApproved.present) {
      map['is_sync_approved'] = i0.Variable<bool>(isSyncApproved.value);
    }
    if (createdAt.present) {
      map['created_at'] = i0.Variable<DateTime>(createdAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('TrashSyncEntityCompanion(')
          ..write('assetId: $assetId, ')
          ..write('checksum: $checksum, ')
          ..write('isSyncApproved: $isSyncApproved, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }
}
