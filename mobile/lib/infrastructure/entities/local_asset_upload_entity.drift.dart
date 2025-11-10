// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/local_asset_upload_entity.drift.dart'
    as i1;
import 'package:immich_mobile/constants/enums.dart' as i2;
import 'package:immich_mobile/infrastructure/entities/local_asset_upload_entity.dart'
    as i3;
import 'package:drift/src/runtime/query_builder/query_builder.dart' as i4;
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart'
    as i5;
import 'package:drift/internal/modular.dart' as i6;

typedef $$LocalAssetUploadEntityTableCreateCompanionBuilder =
    i1.LocalAssetUploadEntityCompanion Function({
      required String assetId,
      i0.Value<int> numberOfAttempts,
      i0.Value<DateTime> lastAttemptAt,
      i0.Value<i2.UploadErrorType> errorType,
      i0.Value<String?> errorMessage,
    });
typedef $$LocalAssetUploadEntityTableUpdateCompanionBuilder =
    i1.LocalAssetUploadEntityCompanion Function({
      i0.Value<String> assetId,
      i0.Value<int> numberOfAttempts,
      i0.Value<DateTime> lastAttemptAt,
      i0.Value<i2.UploadErrorType> errorType,
      i0.Value<String?> errorMessage,
    });

final class $$LocalAssetUploadEntityTableReferences
    extends
        i0.BaseReferences<
          i0.GeneratedDatabase,
          i1.$LocalAssetUploadEntityTable,
          i1.LocalAssetUploadEntityData
        > {
  $$LocalAssetUploadEntityTableReferences(
    super.$_db,
    super.$_table,
    super.$_typedResult,
  );

  static i5.$LocalAssetEntityTable _assetIdTable(i0.GeneratedDatabase db) =>
      i6.ReadDatabaseContainer(db)
          .resultSet<i5.$LocalAssetEntityTable>('local_asset_entity')
          .createAlias(
            i0.$_aliasNameGenerator(
              i6.ReadDatabaseContainer(db)
                  .resultSet<i1.$LocalAssetUploadEntityTable>(
                    'local_asset_upload_entity',
                  )
                  .assetId,
              i6.ReadDatabaseContainer(
                db,
              ).resultSet<i5.$LocalAssetEntityTable>('local_asset_entity').id,
            ),
          );

  i5.$$LocalAssetEntityTableProcessedTableManager get assetId {
    final $_column = $_itemColumn<String>('asset_id')!;

    final manager = i5
        .$$LocalAssetEntityTableTableManager(
          $_db,
          i6.ReadDatabaseContainer(
            $_db,
          ).resultSet<i5.$LocalAssetEntityTable>('local_asset_entity'),
        )
        .filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_assetIdTable($_db));
    if (item == null) return manager;
    return i0.ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }
}

class $$LocalAssetUploadEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$LocalAssetUploadEntityTable> {
  $$LocalAssetUploadEntityTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnFilters<int> get numberOfAttempts => $composableBuilder(
    column: $table.numberOfAttempts,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<DateTime> get lastAttemptAt => $composableBuilder(
    column: $table.lastAttemptAt,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnWithTypeConverterFilters<i2.UploadErrorType, i2.UploadErrorType, int>
  get errorType => $composableBuilder(
    column: $table.errorType,
    builder: (column) => i0.ColumnWithTypeConverterFilters(column),
  );

  i0.ColumnFilters<String> get errorMessage => $composableBuilder(
    column: $table.errorMessage,
    builder: (column) => i0.ColumnFilters(column),
  );

  i5.$$LocalAssetEntityTableFilterComposer get assetId {
    final i5.$$LocalAssetEntityTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.assetId,
      referencedTable: i6.ReadDatabaseContainer(
        $db,
      ).resultSet<i5.$LocalAssetEntityTable>('local_asset_entity'),
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => i5.$$LocalAssetEntityTableFilterComposer(
            $db: $db,
            $table: i6.ReadDatabaseContainer(
              $db,
            ).resultSet<i5.$LocalAssetEntityTable>('local_asset_entity'),
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$LocalAssetUploadEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$LocalAssetUploadEntityTable> {
  $$LocalAssetUploadEntityTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnOrderings<int> get numberOfAttempts => $composableBuilder(
    column: $table.numberOfAttempts,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<DateTime> get lastAttemptAt => $composableBuilder(
    column: $table.lastAttemptAt,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get errorType => $composableBuilder(
    column: $table.errorType,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get errorMessage => $composableBuilder(
    column: $table.errorMessage,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i5.$$LocalAssetEntityTableOrderingComposer get assetId {
    final i5.$$LocalAssetEntityTableOrderingComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.assetId,
          referencedTable: i6.ReadDatabaseContainer(
            $db,
          ).resultSet<i5.$LocalAssetEntityTable>('local_asset_entity'),
          getReferencedColumn: (t) => t.id,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => i5.$$LocalAssetEntityTableOrderingComposer(
                $db: $db,
                $table: i6.ReadDatabaseContainer(
                  $db,
                ).resultSet<i5.$LocalAssetEntityTable>('local_asset_entity'),
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return composer;
  }
}

class $$LocalAssetUploadEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$LocalAssetUploadEntityTable> {
  $$LocalAssetUploadEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<int> get numberOfAttempts => $composableBuilder(
    column: $table.numberOfAttempts,
    builder: (column) => column,
  );

  i0.GeneratedColumn<DateTime> get lastAttemptAt => $composableBuilder(
    column: $table.lastAttemptAt,
    builder: (column) => column,
  );

  i0.GeneratedColumnWithTypeConverter<i2.UploadErrorType, int> get errorType =>
      $composableBuilder(column: $table.errorType, builder: (column) => column);

  i0.GeneratedColumn<String> get errorMessage => $composableBuilder(
    column: $table.errorMessage,
    builder: (column) => column,
  );

  i5.$$LocalAssetEntityTableAnnotationComposer get assetId {
    final i5.$$LocalAssetEntityTableAnnotationComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.assetId,
          referencedTable: i6.ReadDatabaseContainer(
            $db,
          ).resultSet<i5.$LocalAssetEntityTable>('local_asset_entity'),
          getReferencedColumn: (t) => t.id,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => i5.$$LocalAssetEntityTableAnnotationComposer(
                $db: $db,
                $table: i6.ReadDatabaseContainer(
                  $db,
                ).resultSet<i5.$LocalAssetEntityTable>('local_asset_entity'),
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return composer;
  }
}

class $$LocalAssetUploadEntityTableTableManager
    extends
        i0.RootTableManager<
          i0.GeneratedDatabase,
          i1.$LocalAssetUploadEntityTable,
          i1.LocalAssetUploadEntityData,
          i1.$$LocalAssetUploadEntityTableFilterComposer,
          i1.$$LocalAssetUploadEntityTableOrderingComposer,
          i1.$$LocalAssetUploadEntityTableAnnotationComposer,
          $$LocalAssetUploadEntityTableCreateCompanionBuilder,
          $$LocalAssetUploadEntityTableUpdateCompanionBuilder,
          (
            i1.LocalAssetUploadEntityData,
            i1.$$LocalAssetUploadEntityTableReferences,
          ),
          i1.LocalAssetUploadEntityData,
          i0.PrefetchHooks Function({bool assetId})
        > {
  $$LocalAssetUploadEntityTableTableManager(
    i0.GeneratedDatabase db,
    i1.$LocalAssetUploadEntityTable table,
  ) : super(
        i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$LocalAssetUploadEntityTableFilterComposer(
                $db: db,
                $table: table,
              ),
          createOrderingComposer: () =>
              i1.$$LocalAssetUploadEntityTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              i1.$$LocalAssetUploadEntityTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                i0.Value<String> assetId = const i0.Value.absent(),
                i0.Value<int> numberOfAttempts = const i0.Value.absent(),
                i0.Value<DateTime> lastAttemptAt = const i0.Value.absent(),
                i0.Value<i2.UploadErrorType> errorType =
                    const i0.Value.absent(),
                i0.Value<String?> errorMessage = const i0.Value.absent(),
              }) => i1.LocalAssetUploadEntityCompanion(
                assetId: assetId,
                numberOfAttempts: numberOfAttempts,
                lastAttemptAt: lastAttemptAt,
                errorType: errorType,
                errorMessage: errorMessage,
              ),
          createCompanionCallback:
              ({
                required String assetId,
                i0.Value<int> numberOfAttempts = const i0.Value.absent(),
                i0.Value<DateTime> lastAttemptAt = const i0.Value.absent(),
                i0.Value<i2.UploadErrorType> errorType =
                    const i0.Value.absent(),
                i0.Value<String?> errorMessage = const i0.Value.absent(),
              }) => i1.LocalAssetUploadEntityCompanion.insert(
                assetId: assetId,
                numberOfAttempts: numberOfAttempts,
                lastAttemptAt: lastAttemptAt,
                errorType: errorType,
                errorMessage: errorMessage,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable(table),
                  i1.$$LocalAssetUploadEntityTableReferences(db, table, e),
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
                                    .$$LocalAssetUploadEntityTableReferences
                                    ._assetIdTable(db),
                                referencedColumn: i1
                                    .$$LocalAssetUploadEntityTableReferences
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

typedef $$LocalAssetUploadEntityTableProcessedTableManager =
    i0.ProcessedTableManager<
      i0.GeneratedDatabase,
      i1.$LocalAssetUploadEntityTable,
      i1.LocalAssetUploadEntityData,
      i1.$$LocalAssetUploadEntityTableFilterComposer,
      i1.$$LocalAssetUploadEntityTableOrderingComposer,
      i1.$$LocalAssetUploadEntityTableAnnotationComposer,
      $$LocalAssetUploadEntityTableCreateCompanionBuilder,
      $$LocalAssetUploadEntityTableUpdateCompanionBuilder,
      (
        i1.LocalAssetUploadEntityData,
        i1.$$LocalAssetUploadEntityTableReferences,
      ),
      i1.LocalAssetUploadEntityData,
      i0.PrefetchHooks Function({bool assetId})
    >;

class $LocalAssetUploadEntityTable extends i3.LocalAssetUploadEntity
    with
        i0.TableInfo<
          $LocalAssetUploadEntityTable,
          i1.LocalAssetUploadEntityData
        > {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalAssetUploadEntityTable(this.attachedDatabase, [this._alias]);
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
      'REFERENCES local_asset_entity (id) ON DELETE CASCADE',
    ),
  );
  static const i0.VerificationMeta _numberOfAttemptsMeta =
      const i0.VerificationMeta('numberOfAttempts');
  @override
  late final i0.GeneratedColumn<int> numberOfAttempts = i0.GeneratedColumn<int>(
    'number_of_attempts',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const i4.Constant(0),
  );
  static const i0.VerificationMeta _lastAttemptAtMeta =
      const i0.VerificationMeta('lastAttemptAt');
  @override
  late final i0.GeneratedColumn<DateTime> lastAttemptAt =
      i0.GeneratedColumn<DateTime>(
        'last_attempt_at',
        aliasedName,
        false,
        type: i0.DriftSqlType.dateTime,
        requiredDuringInsert: false,
        defaultValue: i4.currentDateAndTime,
      );
  @override
  late final i0.GeneratedColumnWithTypeConverter<i2.UploadErrorType, int>
  errorType =
      i0.GeneratedColumn<int>(
        'error_type',
        aliasedName,
        false,
        type: i0.DriftSqlType.int,
        requiredDuringInsert: false,
        defaultValue: const i4.Constant(0),
      ).withConverter<i2.UploadErrorType>(
        i1.$LocalAssetUploadEntityTable.$convertererrorType,
      );
  static const i0.VerificationMeta _errorMessageMeta =
      const i0.VerificationMeta('errorMessage');
  @override
  late final i0.GeneratedColumn<String> errorMessage =
      i0.GeneratedColumn<String>(
        'error_message',
        aliasedName,
        true,
        type: i0.DriftSqlType.string,
        requiredDuringInsert: false,
      );
  @override
  List<i0.GeneratedColumn> get $columns => [
    assetId,
    numberOfAttempts,
    lastAttemptAt,
    errorType,
    errorMessage,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_asset_upload_entity';
  @override
  i0.VerificationContext validateIntegrity(
    i0.Insertable<i1.LocalAssetUploadEntityData> instance, {
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
    if (data.containsKey('number_of_attempts')) {
      context.handle(
        _numberOfAttemptsMeta,
        numberOfAttempts.isAcceptableOrUnknown(
          data['number_of_attempts']!,
          _numberOfAttemptsMeta,
        ),
      );
    }
    if (data.containsKey('last_attempt_at')) {
      context.handle(
        _lastAttemptAtMeta,
        lastAttemptAt.isAcceptableOrUnknown(
          data['last_attempt_at']!,
          _lastAttemptAtMeta,
        ),
      );
    }
    if (data.containsKey('error_message')) {
      context.handle(
        _errorMessageMeta,
        errorMessage.isAcceptableOrUnknown(
          data['error_message']!,
          _errorMessageMeta,
        ),
      );
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {assetId};
  @override
  i1.LocalAssetUploadEntityData map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.LocalAssetUploadEntityData(
      assetId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}asset_id'],
      )!,
      numberOfAttempts: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}number_of_attempts'],
      )!,
      lastAttemptAt: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.dateTime,
        data['${effectivePrefix}last_attempt_at'],
      )!,
      errorType: i1.$LocalAssetUploadEntityTable.$convertererrorType.fromSql(
        attachedDatabase.typeMapping.read(
          i0.DriftSqlType.int,
          data['${effectivePrefix}error_type'],
        )!,
      ),
      errorMessage: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}error_message'],
      ),
    );
  }

  @override
  $LocalAssetUploadEntityTable createAlias(String alias) {
    return $LocalAssetUploadEntityTable(attachedDatabase, alias);
  }

  static i0.JsonTypeConverter2<i2.UploadErrorType, int, int>
  $convertererrorType = const i0.EnumIndexConverter<i2.UploadErrorType>(
    i2.UploadErrorType.values,
  );
  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class LocalAssetUploadEntityData extends i0.DataClass
    implements i0.Insertable<i1.LocalAssetUploadEntityData> {
  final String assetId;
  final int numberOfAttempts;
  final DateTime lastAttemptAt;
  final i2.UploadErrorType errorType;
  final String? errorMessage;
  const LocalAssetUploadEntityData({
    required this.assetId,
    required this.numberOfAttempts,
    required this.lastAttemptAt,
    required this.errorType,
    this.errorMessage,
  });
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['asset_id'] = i0.Variable<String>(assetId);
    map['number_of_attempts'] = i0.Variable<int>(numberOfAttempts);
    map['last_attempt_at'] = i0.Variable<DateTime>(lastAttemptAt);
    {
      map['error_type'] = i0.Variable<int>(
        i1.$LocalAssetUploadEntityTable.$convertererrorType.toSql(errorType),
      );
    }
    if (!nullToAbsent || errorMessage != null) {
      map['error_message'] = i0.Variable<String>(errorMessage);
    }
    return map;
  }

  factory LocalAssetUploadEntityData.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return LocalAssetUploadEntityData(
      assetId: serializer.fromJson<String>(json['assetId']),
      numberOfAttempts: serializer.fromJson<int>(json['numberOfAttempts']),
      lastAttemptAt: serializer.fromJson<DateTime>(json['lastAttemptAt']),
      errorType: i1.$LocalAssetUploadEntityTable.$convertererrorType.fromJson(
        serializer.fromJson<int>(json['errorType']),
      ),
      errorMessage: serializer.fromJson<String?>(json['errorMessage']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'assetId': serializer.toJson<String>(assetId),
      'numberOfAttempts': serializer.toJson<int>(numberOfAttempts),
      'lastAttemptAt': serializer.toJson<DateTime>(lastAttemptAt),
      'errorType': serializer.toJson<int>(
        i1.$LocalAssetUploadEntityTable.$convertererrorType.toJson(errorType),
      ),
      'errorMessage': serializer.toJson<String?>(errorMessage),
    };
  }

  i1.LocalAssetUploadEntityData copyWith({
    String? assetId,
    int? numberOfAttempts,
    DateTime? lastAttemptAt,
    i2.UploadErrorType? errorType,
    i0.Value<String?> errorMessage = const i0.Value.absent(),
  }) => i1.LocalAssetUploadEntityData(
    assetId: assetId ?? this.assetId,
    numberOfAttempts: numberOfAttempts ?? this.numberOfAttempts,
    lastAttemptAt: lastAttemptAt ?? this.lastAttemptAt,
    errorType: errorType ?? this.errorType,
    errorMessage: errorMessage.present ? errorMessage.value : this.errorMessage,
  );
  LocalAssetUploadEntityData copyWithCompanion(
    i1.LocalAssetUploadEntityCompanion data,
  ) {
    return LocalAssetUploadEntityData(
      assetId: data.assetId.present ? data.assetId.value : this.assetId,
      numberOfAttempts: data.numberOfAttempts.present
          ? data.numberOfAttempts.value
          : this.numberOfAttempts,
      lastAttemptAt: data.lastAttemptAt.present
          ? data.lastAttemptAt.value
          : this.lastAttemptAt,
      errorType: data.errorType.present ? data.errorType.value : this.errorType,
      errorMessage: data.errorMessage.present
          ? data.errorMessage.value
          : this.errorMessage,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalAssetUploadEntityData(')
          ..write('assetId: $assetId, ')
          ..write('numberOfAttempts: $numberOfAttempts, ')
          ..write('lastAttemptAt: $lastAttemptAt, ')
          ..write('errorType: $errorType, ')
          ..write('errorMessage: $errorMessage')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    assetId,
    numberOfAttempts,
    lastAttemptAt,
    errorType,
    errorMessage,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.LocalAssetUploadEntityData &&
          other.assetId == this.assetId &&
          other.numberOfAttempts == this.numberOfAttempts &&
          other.lastAttemptAt == this.lastAttemptAt &&
          other.errorType == this.errorType &&
          other.errorMessage == this.errorMessage);
}

class LocalAssetUploadEntityCompanion
    extends i0.UpdateCompanion<i1.LocalAssetUploadEntityData> {
  final i0.Value<String> assetId;
  final i0.Value<int> numberOfAttempts;
  final i0.Value<DateTime> lastAttemptAt;
  final i0.Value<i2.UploadErrorType> errorType;
  final i0.Value<String?> errorMessage;
  const LocalAssetUploadEntityCompanion({
    this.assetId = const i0.Value.absent(),
    this.numberOfAttempts = const i0.Value.absent(),
    this.lastAttemptAt = const i0.Value.absent(),
    this.errorType = const i0.Value.absent(),
    this.errorMessage = const i0.Value.absent(),
  });
  LocalAssetUploadEntityCompanion.insert({
    required String assetId,
    this.numberOfAttempts = const i0.Value.absent(),
    this.lastAttemptAt = const i0.Value.absent(),
    this.errorType = const i0.Value.absent(),
    this.errorMessage = const i0.Value.absent(),
  }) : assetId = i0.Value(assetId);
  static i0.Insertable<i1.LocalAssetUploadEntityData> custom({
    i0.Expression<String>? assetId,
    i0.Expression<int>? numberOfAttempts,
    i0.Expression<DateTime>? lastAttemptAt,
    i0.Expression<int>? errorType,
    i0.Expression<String>? errorMessage,
  }) {
    return i0.RawValuesInsertable({
      if (assetId != null) 'asset_id': assetId,
      if (numberOfAttempts != null) 'number_of_attempts': numberOfAttempts,
      if (lastAttemptAt != null) 'last_attempt_at': lastAttemptAt,
      if (errorType != null) 'error_type': errorType,
      if (errorMessage != null) 'error_message': errorMessage,
    });
  }

  i1.LocalAssetUploadEntityCompanion copyWith({
    i0.Value<String>? assetId,
    i0.Value<int>? numberOfAttempts,
    i0.Value<DateTime>? lastAttemptAt,
    i0.Value<i2.UploadErrorType>? errorType,
    i0.Value<String?>? errorMessage,
  }) {
    return i1.LocalAssetUploadEntityCompanion(
      assetId: assetId ?? this.assetId,
      numberOfAttempts: numberOfAttempts ?? this.numberOfAttempts,
      lastAttemptAt: lastAttemptAt ?? this.lastAttemptAt,
      errorType: errorType ?? this.errorType,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (assetId.present) {
      map['asset_id'] = i0.Variable<String>(assetId.value);
    }
    if (numberOfAttempts.present) {
      map['number_of_attempts'] = i0.Variable<int>(numberOfAttempts.value);
    }
    if (lastAttemptAt.present) {
      map['last_attempt_at'] = i0.Variable<DateTime>(lastAttemptAt.value);
    }
    if (errorType.present) {
      map['error_type'] = i0.Variable<int>(
        i1.$LocalAssetUploadEntityTable.$convertererrorType.toSql(
          errorType.value,
        ),
      );
    }
    if (errorMessage.present) {
      map['error_message'] = i0.Variable<String>(errorMessage.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalAssetUploadEntityCompanion(')
          ..write('assetId: $assetId, ')
          ..write('numberOfAttempts: $numberOfAttempts, ')
          ..write('lastAttemptAt: $lastAttemptAt, ')
          ..write('errorType: $errorType, ')
          ..write('errorMessage: $errorMessage')
          ..write(')'))
        .toString();
  }
}
