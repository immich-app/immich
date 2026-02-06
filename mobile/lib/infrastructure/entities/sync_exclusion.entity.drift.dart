// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/sync_exclusion.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/sync_exclusion.entity.dart'
    as i2;
import 'package:drift/src/runtime/query_builder/query_builder.dart' as i3;

typedef $$SyncExclusionEntityTableCreateCompanionBuilder =
    i1.SyncExclusionEntityCompanion Function({
      required String remoteAssetId,
      required String localAlbumId,
      i0.Value<DateTime> excludedAt,
    });
typedef $$SyncExclusionEntityTableUpdateCompanionBuilder =
    i1.SyncExclusionEntityCompanion Function({
      i0.Value<String> remoteAssetId,
      i0.Value<String> localAlbumId,
      i0.Value<DateTime> excludedAt,
    });

class $$SyncExclusionEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$SyncExclusionEntityTable> {
  $$SyncExclusionEntityTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnFilters<String> get remoteAssetId => $composableBuilder(
    column: $table.remoteAssetId,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<String> get localAlbumId => $composableBuilder(
    column: $table.localAlbumId,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<DateTime> get excludedAt => $composableBuilder(
    column: $table.excludedAt,
    builder: (column) => i0.ColumnFilters(column),
  );
}

class $$SyncExclusionEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$SyncExclusionEntityTable> {
  $$SyncExclusionEntityTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnOrderings<String> get remoteAssetId => $composableBuilder(
    column: $table.remoteAssetId,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get localAlbumId => $composableBuilder(
    column: $table.localAlbumId,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<DateTime> get excludedAt => $composableBuilder(
    column: $table.excludedAt,
    builder: (column) => i0.ColumnOrderings(column),
  );
}

class $$SyncExclusionEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$SyncExclusionEntityTable> {
  $$SyncExclusionEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<String> get remoteAssetId => $composableBuilder(
    column: $table.remoteAssetId,
    builder: (column) => column,
  );

  i0.GeneratedColumn<String> get localAlbumId => $composableBuilder(
    column: $table.localAlbumId,
    builder: (column) => column,
  );

  i0.GeneratedColumn<DateTime> get excludedAt => $composableBuilder(
    column: $table.excludedAt,
    builder: (column) => column,
  );
}

class $$SyncExclusionEntityTableTableManager
    extends
        i0.RootTableManager<
          i0.GeneratedDatabase,
          i1.$SyncExclusionEntityTable,
          i1.SyncExclusionEntityData,
          i1.$$SyncExclusionEntityTableFilterComposer,
          i1.$$SyncExclusionEntityTableOrderingComposer,
          i1.$$SyncExclusionEntityTableAnnotationComposer,
          $$SyncExclusionEntityTableCreateCompanionBuilder,
          $$SyncExclusionEntityTableUpdateCompanionBuilder,
          (
            i1.SyncExclusionEntityData,
            i0.BaseReferences<
              i0.GeneratedDatabase,
              i1.$SyncExclusionEntityTable,
              i1.SyncExclusionEntityData
            >,
          ),
          i1.SyncExclusionEntityData,
          i0.PrefetchHooks Function()
        > {
  $$SyncExclusionEntityTableTableManager(
    i0.GeneratedDatabase db,
    i1.$SyncExclusionEntityTable table,
  ) : super(
        i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () => i1
              .$$SyncExclusionEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              i1.$$SyncExclusionEntityTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              i1.$$SyncExclusionEntityTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                i0.Value<String> remoteAssetId = const i0.Value.absent(),
                i0.Value<String> localAlbumId = const i0.Value.absent(),
                i0.Value<DateTime> excludedAt = const i0.Value.absent(),
              }) => i1.SyncExclusionEntityCompanion(
                remoteAssetId: remoteAssetId,
                localAlbumId: localAlbumId,
                excludedAt: excludedAt,
              ),
          createCompanionCallback:
              ({
                required String remoteAssetId,
                required String localAlbumId,
                i0.Value<DateTime> excludedAt = const i0.Value.absent(),
              }) => i1.SyncExclusionEntityCompanion.insert(
                remoteAssetId: remoteAssetId,
                localAlbumId: localAlbumId,
                excludedAt: excludedAt,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), i0.BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$SyncExclusionEntityTableProcessedTableManager =
    i0.ProcessedTableManager<
      i0.GeneratedDatabase,
      i1.$SyncExclusionEntityTable,
      i1.SyncExclusionEntityData,
      i1.$$SyncExclusionEntityTableFilterComposer,
      i1.$$SyncExclusionEntityTableOrderingComposer,
      i1.$$SyncExclusionEntityTableAnnotationComposer,
      $$SyncExclusionEntityTableCreateCompanionBuilder,
      $$SyncExclusionEntityTableUpdateCompanionBuilder,
      (
        i1.SyncExclusionEntityData,
        i0.BaseReferences<
          i0.GeneratedDatabase,
          i1.$SyncExclusionEntityTable,
          i1.SyncExclusionEntityData
        >,
      ),
      i1.SyncExclusionEntityData,
      i0.PrefetchHooks Function()
    >;

class $SyncExclusionEntityTable extends i2.SyncExclusionEntity
    with i0.TableInfo<$SyncExclusionEntityTable, i1.SyncExclusionEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SyncExclusionEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _remoteAssetIdMeta =
      const i0.VerificationMeta('remoteAssetId');
  @override
  late final i0.GeneratedColumn<String> remoteAssetId =
      i0.GeneratedColumn<String>(
        'remote_asset_id',
        aliasedName,
        false,
        type: i0.DriftSqlType.string,
        requiredDuringInsert: true,
      );
  static const i0.VerificationMeta _localAlbumIdMeta =
      const i0.VerificationMeta('localAlbumId');
  @override
  late final i0.GeneratedColumn<String> localAlbumId =
      i0.GeneratedColumn<String>(
        'local_album_id',
        aliasedName,
        false,
        type: i0.DriftSqlType.string,
        requiredDuringInsert: true,
      );
  static const i0.VerificationMeta _excludedAtMeta = const i0.VerificationMeta(
    'excludedAt',
  );
  @override
  late final i0.GeneratedColumn<DateTime> excludedAt =
      i0.GeneratedColumn<DateTime>(
        'excluded_at',
        aliasedName,
        false,
        type: i0.DriftSqlType.dateTime,
        requiredDuringInsert: false,
        defaultValue: i3.currentDateAndTime,
      );
  @override
  List<i0.GeneratedColumn> get $columns => [
    remoteAssetId,
    localAlbumId,
    excludedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'sync_exclusion_entity';
  @override
  i0.VerificationContext validateIntegrity(
    i0.Insertable<i1.SyncExclusionEntityData> instance, {
    bool isInserting = false,
  }) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('remote_asset_id')) {
      context.handle(
        _remoteAssetIdMeta,
        remoteAssetId.isAcceptableOrUnknown(
          data['remote_asset_id']!,
          _remoteAssetIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_remoteAssetIdMeta);
    }
    if (data.containsKey('local_album_id')) {
      context.handle(
        _localAlbumIdMeta,
        localAlbumId.isAcceptableOrUnknown(
          data['local_album_id']!,
          _localAlbumIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_localAlbumIdMeta);
    }
    if (data.containsKey('excluded_at')) {
      context.handle(
        _excludedAtMeta,
        excludedAt.isAcceptableOrUnknown(data['excluded_at']!, _excludedAtMeta),
      );
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {remoteAssetId, localAlbumId};
  @override
  i1.SyncExclusionEntityData map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.SyncExclusionEntityData(
      remoteAssetId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}remote_asset_id'],
      )!,
      localAlbumId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}local_album_id'],
      )!,
      excludedAt: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.dateTime,
        data['${effectivePrefix}excluded_at'],
      )!,
    );
  }

  @override
  $SyncExclusionEntityTable createAlias(String alias) {
    return $SyncExclusionEntityTable(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class SyncExclusionEntityData extends i0.DataClass
    implements i0.Insertable<i1.SyncExclusionEntityData> {
  /// The remote asset ID that was moved
  final String remoteAssetId;

  /// The local album ID from which to exclude this asset
  final String localAlbumId;

  /// When the exclusion was created
  final DateTime excludedAt;
  const SyncExclusionEntityData({
    required this.remoteAssetId,
    required this.localAlbumId,
    required this.excludedAt,
  });
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['remote_asset_id'] = i0.Variable<String>(remoteAssetId);
    map['local_album_id'] = i0.Variable<String>(localAlbumId);
    map['excluded_at'] = i0.Variable<DateTime>(excludedAt);
    return map;
  }

  factory SyncExclusionEntityData.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return SyncExclusionEntityData(
      remoteAssetId: serializer.fromJson<String>(json['remoteAssetId']),
      localAlbumId: serializer.fromJson<String>(json['localAlbumId']),
      excludedAt: serializer.fromJson<DateTime>(json['excludedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'remoteAssetId': serializer.toJson<String>(remoteAssetId),
      'localAlbumId': serializer.toJson<String>(localAlbumId),
      'excludedAt': serializer.toJson<DateTime>(excludedAt),
    };
  }

  i1.SyncExclusionEntityData copyWith({
    String? remoteAssetId,
    String? localAlbumId,
    DateTime? excludedAt,
  }) => i1.SyncExclusionEntityData(
    remoteAssetId: remoteAssetId ?? this.remoteAssetId,
    localAlbumId: localAlbumId ?? this.localAlbumId,
    excludedAt: excludedAt ?? this.excludedAt,
  );
  SyncExclusionEntityData copyWithCompanion(
    i1.SyncExclusionEntityCompanion data,
  ) {
    return SyncExclusionEntityData(
      remoteAssetId: data.remoteAssetId.present
          ? data.remoteAssetId.value
          : this.remoteAssetId,
      localAlbumId: data.localAlbumId.present
          ? data.localAlbumId.value
          : this.localAlbumId,
      excludedAt: data.excludedAt.present
          ? data.excludedAt.value
          : this.excludedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SyncExclusionEntityData(')
          ..write('remoteAssetId: $remoteAssetId, ')
          ..write('localAlbumId: $localAlbumId, ')
          ..write('excludedAt: $excludedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(remoteAssetId, localAlbumId, excludedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.SyncExclusionEntityData &&
          other.remoteAssetId == this.remoteAssetId &&
          other.localAlbumId == this.localAlbumId &&
          other.excludedAt == this.excludedAt);
}

class SyncExclusionEntityCompanion
    extends i0.UpdateCompanion<i1.SyncExclusionEntityData> {
  final i0.Value<String> remoteAssetId;
  final i0.Value<String> localAlbumId;
  final i0.Value<DateTime> excludedAt;
  const SyncExclusionEntityCompanion({
    this.remoteAssetId = const i0.Value.absent(),
    this.localAlbumId = const i0.Value.absent(),
    this.excludedAt = const i0.Value.absent(),
  });
  SyncExclusionEntityCompanion.insert({
    required String remoteAssetId,
    required String localAlbumId,
    this.excludedAt = const i0.Value.absent(),
  }) : remoteAssetId = i0.Value(remoteAssetId),
       localAlbumId = i0.Value(localAlbumId);
  static i0.Insertable<i1.SyncExclusionEntityData> custom({
    i0.Expression<String>? remoteAssetId,
    i0.Expression<String>? localAlbumId,
    i0.Expression<DateTime>? excludedAt,
  }) {
    return i0.RawValuesInsertable({
      if (remoteAssetId != null) 'remote_asset_id': remoteAssetId,
      if (localAlbumId != null) 'local_album_id': localAlbumId,
      if (excludedAt != null) 'excluded_at': excludedAt,
    });
  }

  i1.SyncExclusionEntityCompanion copyWith({
    i0.Value<String>? remoteAssetId,
    i0.Value<String>? localAlbumId,
    i0.Value<DateTime>? excludedAt,
  }) {
    return i1.SyncExclusionEntityCompanion(
      remoteAssetId: remoteAssetId ?? this.remoteAssetId,
      localAlbumId: localAlbumId ?? this.localAlbumId,
      excludedAt: excludedAt ?? this.excludedAt,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (remoteAssetId.present) {
      map['remote_asset_id'] = i0.Variable<String>(remoteAssetId.value);
    }
    if (localAlbumId.present) {
      map['local_album_id'] = i0.Variable<String>(localAlbumId.value);
    }
    if (excludedAt.present) {
      map['excluded_at'] = i0.Variable<DateTime>(excludedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SyncExclusionEntityCompanion(')
          ..write('remoteAssetId: $remoteAssetId, ')
          ..write('localAlbumId: $localAlbumId, ')
          ..write('excludedAt: $excludedAt')
          ..write(')'))
        .toString();
  }
}
