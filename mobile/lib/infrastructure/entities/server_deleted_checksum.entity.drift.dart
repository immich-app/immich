// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/server_deleted_checksum.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/server_deleted_checksum.entity.dart'
    as i2;

typedef $$ServerDeletedChecksumEntityTableCreateCompanionBuilder =
    i1.ServerDeletedChecksumEntityCompanion Function({
      required String checksum,
    });
typedef $$ServerDeletedChecksumEntityTableUpdateCompanionBuilder =
    i1.ServerDeletedChecksumEntityCompanion Function({
      i0.Value<String> checksum,
    });

class $$ServerDeletedChecksumEntityTableFilterComposer
    extends
        i0.Composer<
          i0.GeneratedDatabase,
          i1.$ServerDeletedChecksumEntityTable
        > {
  $$ServerDeletedChecksumEntityTableFilterComposer({
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
}

class $$ServerDeletedChecksumEntityTableOrderingComposer
    extends
        i0.Composer<
          i0.GeneratedDatabase,
          i1.$ServerDeletedChecksumEntityTable
        > {
  $$ServerDeletedChecksumEntityTableOrderingComposer({
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
}

class $$ServerDeletedChecksumEntityTableAnnotationComposer
    extends
        i0.Composer<
          i0.GeneratedDatabase,
          i1.$ServerDeletedChecksumEntityTable
        > {
  $$ServerDeletedChecksumEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<String> get checksum =>
      $composableBuilder(column: $table.checksum, builder: (column) => column);
}

class $$ServerDeletedChecksumEntityTableTableManager
    extends
        i0.RootTableManager<
          i0.GeneratedDatabase,
          i1.$ServerDeletedChecksumEntityTable,
          i1.ServerDeletedChecksumEntityData,
          i1.$$ServerDeletedChecksumEntityTableFilterComposer,
          i1.$$ServerDeletedChecksumEntityTableOrderingComposer,
          i1.$$ServerDeletedChecksumEntityTableAnnotationComposer,
          $$ServerDeletedChecksumEntityTableCreateCompanionBuilder,
          $$ServerDeletedChecksumEntityTableUpdateCompanionBuilder,
          (
            i1.ServerDeletedChecksumEntityData,
            i0.BaseReferences<
              i0.GeneratedDatabase,
              i1.$ServerDeletedChecksumEntityTable,
              i1.ServerDeletedChecksumEntityData
            >,
          ),
          i1.ServerDeletedChecksumEntityData,
          i0.PrefetchHooks Function()
        > {
  $$ServerDeletedChecksumEntityTableTableManager(
    i0.GeneratedDatabase db,
    i1.$ServerDeletedChecksumEntityTable table,
  ) : super(
        i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$ServerDeletedChecksumEntityTableFilterComposer(
                $db: db,
                $table: table,
              ),
          createOrderingComposer: () =>
              i1.$$ServerDeletedChecksumEntityTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              i1.$$ServerDeletedChecksumEntityTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({i0.Value<String> checksum = const i0.Value.absent()}) =>
                  i1.ServerDeletedChecksumEntityCompanion(checksum: checksum),
          createCompanionCallback: ({required String checksum}) =>
              i1.ServerDeletedChecksumEntityCompanion.insert(
                checksum: checksum,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), i0.BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$ServerDeletedChecksumEntityTableProcessedTableManager =
    i0.ProcessedTableManager<
      i0.GeneratedDatabase,
      i1.$ServerDeletedChecksumEntityTable,
      i1.ServerDeletedChecksumEntityData,
      i1.$$ServerDeletedChecksumEntityTableFilterComposer,
      i1.$$ServerDeletedChecksumEntityTableOrderingComposer,
      i1.$$ServerDeletedChecksumEntityTableAnnotationComposer,
      $$ServerDeletedChecksumEntityTableCreateCompanionBuilder,
      $$ServerDeletedChecksumEntityTableUpdateCompanionBuilder,
      (
        i1.ServerDeletedChecksumEntityData,
        i0.BaseReferences<
          i0.GeneratedDatabase,
          i1.$ServerDeletedChecksumEntityTable,
          i1.ServerDeletedChecksumEntityData
        >,
      ),
      i1.ServerDeletedChecksumEntityData,
      i0.PrefetchHooks Function()
    >;

class $ServerDeletedChecksumEntityTable extends i2.ServerDeletedChecksumEntity
    with
        i0.TableInfo<
          $ServerDeletedChecksumEntityTable,
          i1.ServerDeletedChecksumEntityData
        > {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $ServerDeletedChecksumEntityTable(this.attachedDatabase, [this._alias]);
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
  @override
  List<i0.GeneratedColumn> get $columns => [checksum];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'server_deleted_checksum';
  @override
  i0.VerificationContext validateIntegrity(
    i0.Insertable<i1.ServerDeletedChecksumEntityData> instance, {
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
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {checksum};
  @override
  i1.ServerDeletedChecksumEntityData map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.ServerDeletedChecksumEntityData(
      checksum: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}checksum'],
      )!,
    );
  }

  @override
  $ServerDeletedChecksumEntityTable createAlias(String alias) {
    return $ServerDeletedChecksumEntityTable(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class ServerDeletedChecksumEntityData extends i0.DataClass
    implements i0.Insertable<i1.ServerDeletedChecksumEntityData> {
  final String checksum;
  const ServerDeletedChecksumEntityData({required this.checksum});
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['checksum'] = i0.Variable<String>(checksum);
    return map;
  }

  factory ServerDeletedChecksumEntityData.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return ServerDeletedChecksumEntityData(
      checksum: serializer.fromJson<String>(json['checksum']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{'checksum': serializer.toJson<String>(checksum)};
  }

  i1.ServerDeletedChecksumEntityData copyWith({String? checksum}) =>
      i1.ServerDeletedChecksumEntityData(checksum: checksum ?? this.checksum);
  ServerDeletedChecksumEntityData copyWithCompanion(
    i1.ServerDeletedChecksumEntityCompanion data,
  ) {
    return ServerDeletedChecksumEntityData(
      checksum: data.checksum.present ? data.checksum.value : this.checksum,
    );
  }

  @override
  String toString() {
    return (StringBuffer('ServerDeletedChecksumEntityData(')
          ..write('checksum: $checksum')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => checksum.hashCode;
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.ServerDeletedChecksumEntityData &&
          other.checksum == this.checksum);
}

class ServerDeletedChecksumEntityCompanion
    extends i0.UpdateCompanion<i1.ServerDeletedChecksumEntityData> {
  final i0.Value<String> checksum;
  const ServerDeletedChecksumEntityCompanion({
    this.checksum = const i0.Value.absent(),
  });
  ServerDeletedChecksumEntityCompanion.insert({required String checksum})
    : checksum = i0.Value(checksum);
  static i0.Insertable<i1.ServerDeletedChecksumEntityData> custom({
    i0.Expression<String>? checksum,
  }) {
    return i0.RawValuesInsertable({if (checksum != null) 'checksum': checksum});
  }

  i1.ServerDeletedChecksumEntityCompanion copyWith({
    i0.Value<String>? checksum,
  }) {
    return i1.ServerDeletedChecksumEntityCompanion(
      checksum: checksum ?? this.checksum,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (checksum.present) {
      map['checksum'] = i0.Variable<String>(checksum.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('ServerDeletedChecksumEntityCompanion(')
          ..write('checksum: $checksum')
          ..write(')'))
        .toString();
  }
}
