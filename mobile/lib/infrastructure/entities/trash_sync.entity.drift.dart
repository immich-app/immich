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
      required String checksum,
      i0.Value<bool?> isSyncApproved,
      i0.Value<DateTime> updatedAt,
    });
typedef $$TrashSyncEntityTableUpdateCompanionBuilder =
    i1.TrashSyncEntityCompanion Function({
      i0.Value<String> checksum,
      i0.Value<bool?> isSyncApproved,
      i0.Value<DateTime> updatedAt,
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
  i0.ColumnFilters<String> get checksum => $composableBuilder(
    column: $table.checksum,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<bool> get isSyncApproved => $composableBuilder(
    column: $table.isSyncApproved,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
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
  i0.ColumnOrderings<String> get checksum => $composableBuilder(
    column: $table.checksum,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<bool> get isSyncApproved => $composableBuilder(
    column: $table.isSyncApproved,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
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
  i0.GeneratedColumn<String> get checksum =>
      $composableBuilder(column: $table.checksum, builder: (column) => column);

  i0.GeneratedColumn<bool> get isSyncApproved => $composableBuilder(
    column: $table.isSyncApproved,
    builder: (column) => column,
  );

  i0.GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
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
                i0.Value<String> checksum = const i0.Value.absent(),
                i0.Value<bool?> isSyncApproved = const i0.Value.absent(),
                i0.Value<DateTime> updatedAt = const i0.Value.absent(),
              }) => i1.TrashSyncEntityCompanion(
                checksum: checksum,
                isSyncApproved: isSyncApproved,
                updatedAt: updatedAt,
              ),
          createCompanionCallback:
              ({
                required String checksum,
                i0.Value<bool?> isSyncApproved = const i0.Value.absent(),
                i0.Value<DateTime> updatedAt = const i0.Value.absent(),
              }) => i1.TrashSyncEntityCompanion.insert(
                checksum: checksum,
                isSyncApproved: isSyncApproved,
                updatedAt: updatedAt,
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
i0.Index get idxTrashSyncIsSyncApproved => i0.Index(
  'idx_trash_sync_is_sync_approved',
  'CREATE INDEX idx_trash_sync_is_sync_approved ON trash_sync_entity (is_sync_approved)',
);

class $TrashSyncEntityTable extends i2.TrashSyncEntity
    with i0.TableInfo<$TrashSyncEntityTable, i1.TrashSyncEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $TrashSyncEntityTable(this.attachedDatabase, [this._alias]);
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
        defaultValue: i3.currentDateAndTime,
      );
  @override
  List<i0.GeneratedColumn> get $columns => [
    checksum,
    isSyncApproved,
    updatedAt,
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
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {checksum};
  @override
  i1.TrashSyncEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.TrashSyncEntityData(
      checksum: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}checksum'],
      )!,
      isSyncApproved: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.bool,
        data['${effectivePrefix}is_sync_approved'],
      ),
      updatedAt: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
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
  final String checksum;
  final bool? isSyncApproved;
  final DateTime updatedAt;
  const TrashSyncEntityData({
    required this.checksum,
    this.isSyncApproved,
    required this.updatedAt,
  });
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['checksum'] = i0.Variable<String>(checksum);
    if (!nullToAbsent || isSyncApproved != null) {
      map['is_sync_approved'] = i0.Variable<bool>(isSyncApproved);
    }
    map['updated_at'] = i0.Variable<DateTime>(updatedAt);
    return map;
  }

  factory TrashSyncEntityData.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return TrashSyncEntityData(
      checksum: serializer.fromJson<String>(json['checksum']),
      isSyncApproved: serializer.fromJson<bool?>(json['isSyncApproved']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'checksum': serializer.toJson<String>(checksum),
      'isSyncApproved': serializer.toJson<bool?>(isSyncApproved),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  i1.TrashSyncEntityData copyWith({
    String? checksum,
    i0.Value<bool?> isSyncApproved = const i0.Value.absent(),
    DateTime? updatedAt,
  }) => i1.TrashSyncEntityData(
    checksum: checksum ?? this.checksum,
    isSyncApproved: isSyncApproved.present
        ? isSyncApproved.value
        : this.isSyncApproved,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  TrashSyncEntityData copyWithCompanion(i1.TrashSyncEntityCompanion data) {
    return TrashSyncEntityData(
      checksum: data.checksum.present ? data.checksum.value : this.checksum,
      isSyncApproved: data.isSyncApproved.present
          ? data.isSyncApproved.value
          : this.isSyncApproved,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('TrashSyncEntityData(')
          ..write('checksum: $checksum, ')
          ..write('isSyncApproved: $isSyncApproved, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(checksum, isSyncApproved, updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.TrashSyncEntityData &&
          other.checksum == this.checksum &&
          other.isSyncApproved == this.isSyncApproved &&
          other.updatedAt == this.updatedAt);
}

class TrashSyncEntityCompanion
    extends i0.UpdateCompanion<i1.TrashSyncEntityData> {
  final i0.Value<String> checksum;
  final i0.Value<bool?> isSyncApproved;
  final i0.Value<DateTime> updatedAt;
  const TrashSyncEntityCompanion({
    this.checksum = const i0.Value.absent(),
    this.isSyncApproved = const i0.Value.absent(),
    this.updatedAt = const i0.Value.absent(),
  });
  TrashSyncEntityCompanion.insert({
    required String checksum,
    this.isSyncApproved = const i0.Value.absent(),
    this.updatedAt = const i0.Value.absent(),
  }) : checksum = i0.Value(checksum);
  static i0.Insertable<i1.TrashSyncEntityData> custom({
    i0.Expression<String>? checksum,
    i0.Expression<bool>? isSyncApproved,
    i0.Expression<DateTime>? updatedAt,
  }) {
    return i0.RawValuesInsertable({
      if (checksum != null) 'checksum': checksum,
      if (isSyncApproved != null) 'is_sync_approved': isSyncApproved,
      if (updatedAt != null) 'updated_at': updatedAt,
    });
  }

  i1.TrashSyncEntityCompanion copyWith({
    i0.Value<String>? checksum,
    i0.Value<bool?>? isSyncApproved,
    i0.Value<DateTime>? updatedAt,
  }) {
    return i1.TrashSyncEntityCompanion(
      checksum: checksum ?? this.checksum,
      isSyncApproved: isSyncApproved ?? this.isSyncApproved,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (checksum.present) {
      map['checksum'] = i0.Variable<String>(checksum.value);
    }
    if (isSyncApproved.present) {
      map['is_sync_approved'] = i0.Variable<bool>(isSyncApproved.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = i0.Variable<DateTime>(updatedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('TrashSyncEntityCompanion(')
          ..write('checksum: $checksum, ')
          ..write('isSyncApproved: $isSyncApproved, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }
}

i0.Index get idxTrashSyncChecksumStatus => i0.Index(
  'idx_trash_sync_checksum_status',
  'CREATE INDEX idx_trash_sync_checksum_status ON trash_sync_entity (checksum, is_sync_approved)',
);
