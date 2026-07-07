// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/offline_asset.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/offline_asset.entity.dart'
    as i2;
import 'package:drift/src/runtime/query_builder/query_builder.dart' as i3;

typedef $$OfflineAssetEntityTableCreateCompanionBuilder =
    i1.OfflineAssetEntityCompanion Function({
      required String assetId,
      i0.Value<String?> fileName,
      i0.Value<String?> thumbFileName,
      i0.Value<int> fileSize,
      i0.Value<DateTime> createdAt,
    });
typedef $$OfflineAssetEntityTableUpdateCompanionBuilder =
    i1.OfflineAssetEntityCompanion Function({
      i0.Value<String> assetId,
      i0.Value<String?> fileName,
      i0.Value<String?> thumbFileName,
      i0.Value<int> fileSize,
      i0.Value<DateTime> createdAt,
    });

class $$OfflineAssetEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$OfflineAssetEntityTable> {
  $$OfflineAssetEntityTableFilterComposer({
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

  i0.ColumnFilters<String> get fileName => $composableBuilder(
    column: $table.fileName,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<String> get thumbFileName => $composableBuilder(
    column: $table.thumbFileName,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<int> get fileSize => $composableBuilder(
    column: $table.fileSize,
    builder: (column) => i0.ColumnFilters(column),
  );

  i0.ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => i0.ColumnFilters(column),
  );
}

class $$OfflineAssetEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$OfflineAssetEntityTable> {
  $$OfflineAssetEntityTableOrderingComposer({
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

  i0.ColumnOrderings<String> get fileName => $composableBuilder(
    column: $table.fileName,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<String> get thumbFileName => $composableBuilder(
    column: $table.thumbFileName,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<int> get fileSize => $composableBuilder(
    column: $table.fileSize,
    builder: (column) => i0.ColumnOrderings(column),
  );

  i0.ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => i0.ColumnOrderings(column),
  );
}

class $$OfflineAssetEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$OfflineAssetEntityTable> {
  $$OfflineAssetEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<String> get assetId =>
      $composableBuilder(column: $table.assetId, builder: (column) => column);

  i0.GeneratedColumn<String> get fileName =>
      $composableBuilder(column: $table.fileName, builder: (column) => column);

  i0.GeneratedColumn<String> get thumbFileName => $composableBuilder(
    column: $table.thumbFileName,
    builder: (column) => column,
  );

  i0.GeneratedColumn<int> get fileSize =>
      $composableBuilder(column: $table.fileSize, builder: (column) => column);

  i0.GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);
}

class $$OfflineAssetEntityTableTableManager
    extends
        i0.RootTableManager<
          i0.GeneratedDatabase,
          i1.$OfflineAssetEntityTable,
          i1.OfflineAssetEntityData,
          i1.$$OfflineAssetEntityTableFilterComposer,
          i1.$$OfflineAssetEntityTableOrderingComposer,
          i1.$$OfflineAssetEntityTableAnnotationComposer,
          $$OfflineAssetEntityTableCreateCompanionBuilder,
          $$OfflineAssetEntityTableUpdateCompanionBuilder,
          (
            i1.OfflineAssetEntityData,
            i0.BaseReferences<
              i0.GeneratedDatabase,
              i1.$OfflineAssetEntityTable,
              i1.OfflineAssetEntityData
            >,
          ),
          i1.OfflineAssetEntityData,
          i0.PrefetchHooks Function()
        > {
  $$OfflineAssetEntityTableTableManager(
    i0.GeneratedDatabase db,
    i1.$OfflineAssetEntityTable table,
  ) : super(
        i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () => i1
              .$$OfflineAssetEntityTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              i1.$$OfflineAssetEntityTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              i1.$$OfflineAssetEntityTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                i0.Value<String> assetId = const i0.Value.absent(),
                i0.Value<String?> fileName = const i0.Value.absent(),
                i0.Value<String?> thumbFileName = const i0.Value.absent(),
                i0.Value<int> fileSize = const i0.Value.absent(),
                i0.Value<DateTime> createdAt = const i0.Value.absent(),
              }) => i1.OfflineAssetEntityCompanion(
                assetId: assetId,
                fileName: fileName,
                thumbFileName: thumbFileName,
                fileSize: fileSize,
                createdAt: createdAt,
              ),
          createCompanionCallback:
              ({
                required String assetId,
                i0.Value<String?> fileName = const i0.Value.absent(),
                i0.Value<String?> thumbFileName = const i0.Value.absent(),
                i0.Value<int> fileSize = const i0.Value.absent(),
                i0.Value<DateTime> createdAt = const i0.Value.absent(),
              }) => i1.OfflineAssetEntityCompanion.insert(
                assetId: assetId,
                fileName: fileName,
                thumbFileName: thumbFileName,
                fileSize: fileSize,
                createdAt: createdAt,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), i0.BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$OfflineAssetEntityTableProcessedTableManager =
    i0.ProcessedTableManager<
      i0.GeneratedDatabase,
      i1.$OfflineAssetEntityTable,
      i1.OfflineAssetEntityData,
      i1.$$OfflineAssetEntityTableFilterComposer,
      i1.$$OfflineAssetEntityTableOrderingComposer,
      i1.$$OfflineAssetEntityTableAnnotationComposer,
      $$OfflineAssetEntityTableCreateCompanionBuilder,
      $$OfflineAssetEntityTableUpdateCompanionBuilder,
      (
        i1.OfflineAssetEntityData,
        i0.BaseReferences<
          i0.GeneratedDatabase,
          i1.$OfflineAssetEntityTable,
          i1.OfflineAssetEntityData
        >,
      ),
      i1.OfflineAssetEntityData,
      i0.PrefetchHooks Function()
    >;

class $OfflineAssetEntityTable extends i2.OfflineAssetEntity
    with i0.TableInfo<$OfflineAssetEntityTable, i1.OfflineAssetEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $OfflineAssetEntityTable(this.attachedDatabase, [this._alias]);
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
  static const i0.VerificationMeta _fileNameMeta = const i0.VerificationMeta(
    'fileName',
  );
  @override
  late final i0.GeneratedColumn<String> fileName = i0.GeneratedColumn<String>(
    'file_name',
    aliasedName,
    true,
    type: i0.DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const i0.VerificationMeta _thumbFileNameMeta =
      const i0.VerificationMeta('thumbFileName');
  @override
  late final i0.GeneratedColumn<String> thumbFileName =
      i0.GeneratedColumn<String>(
        'thumb_file_name',
        aliasedName,
        true,
        type: i0.DriftSqlType.string,
        requiredDuringInsert: false,
      );
  static const i0.VerificationMeta _fileSizeMeta = const i0.VerificationMeta(
    'fileSize',
  );
  @override
  late final i0.GeneratedColumn<int> fileSize = i0.GeneratedColumn<int>(
    'file_size',
    aliasedName,
    false,
    type: i0.DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const i3.Constant(0),
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
    fileName,
    thumbFileName,
    fileSize,
    createdAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'offline_asset_entity';
  @override
  i0.VerificationContext validateIntegrity(
    i0.Insertable<i1.OfflineAssetEntityData> instance, {
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
    if (data.containsKey('file_name')) {
      context.handle(
        _fileNameMeta,
        fileName.isAcceptableOrUnknown(data['file_name']!, _fileNameMeta),
      );
    }
    if (data.containsKey('thumb_file_name')) {
      context.handle(
        _thumbFileNameMeta,
        thumbFileName.isAcceptableOrUnknown(
          data['thumb_file_name']!,
          _thumbFileNameMeta,
        ),
      );
    }
    if (data.containsKey('file_size')) {
      context.handle(
        _fileSizeMeta,
        fileSize.isAcceptableOrUnknown(data['file_size']!, _fileSizeMeta),
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
  i1.OfflineAssetEntityData map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.OfflineAssetEntityData(
      assetId: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}asset_id'],
      )!,
      fileName: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}file_name'],
      ),
      thumbFileName: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.string,
        data['${effectivePrefix}thumb_file_name'],
      ),
      fileSize: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.int,
        data['${effectivePrefix}file_size'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        i0.DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
    );
  }

  @override
  $OfflineAssetEntityTable createAlias(String alias) {
    return $OfflineAssetEntityTable(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class OfflineAssetEntityData extends i0.DataClass
    implements i0.Insertable<i1.OfflineAssetEntityData> {
  final String assetId;

  /// File name of the downloaded original inside the offline assets directory
  final String? fileName;

  /// File name of the downloaded thumbnail inside the offline assets directory
  final String? thumbFileName;
  final int fileSize;
  final DateTime createdAt;
  const OfflineAssetEntityData({
    required this.assetId,
    this.fileName,
    this.thumbFileName,
    required this.fileSize,
    required this.createdAt,
  });
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['asset_id'] = i0.Variable<String>(assetId);
    if (!nullToAbsent || fileName != null) {
      map['file_name'] = i0.Variable<String>(fileName);
    }
    if (!nullToAbsent || thumbFileName != null) {
      map['thumb_file_name'] = i0.Variable<String>(thumbFileName);
    }
    map['file_size'] = i0.Variable<int>(fileSize);
    map['created_at'] = i0.Variable<DateTime>(createdAt);
    return map;
  }

  factory OfflineAssetEntityData.fromJson(
    Map<String, dynamic> json, {
    i0.ValueSerializer? serializer,
  }) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return OfflineAssetEntityData(
      assetId: serializer.fromJson<String>(json['assetId']),
      fileName: serializer.fromJson<String?>(json['fileName']),
      thumbFileName: serializer.fromJson<String?>(json['thumbFileName']),
      fileSize: serializer.fromJson<int>(json['fileSize']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'assetId': serializer.toJson<String>(assetId),
      'fileName': serializer.toJson<String?>(fileName),
      'thumbFileName': serializer.toJson<String?>(thumbFileName),
      'fileSize': serializer.toJson<int>(fileSize),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  i1.OfflineAssetEntityData copyWith({
    String? assetId,
    i0.Value<String?> fileName = const i0.Value.absent(),
    i0.Value<String?> thumbFileName = const i0.Value.absent(),
    int? fileSize,
    DateTime? createdAt,
  }) => i1.OfflineAssetEntityData(
    assetId: assetId ?? this.assetId,
    fileName: fileName.present ? fileName.value : this.fileName,
    thumbFileName: thumbFileName.present
        ? thumbFileName.value
        : this.thumbFileName,
    fileSize: fileSize ?? this.fileSize,
    createdAt: createdAt ?? this.createdAt,
  );
  OfflineAssetEntityData copyWithCompanion(
    i1.OfflineAssetEntityCompanion data,
  ) {
    return OfflineAssetEntityData(
      assetId: data.assetId.present ? data.assetId.value : this.assetId,
      fileName: data.fileName.present ? data.fileName.value : this.fileName,
      thumbFileName: data.thumbFileName.present
          ? data.thumbFileName.value
          : this.thumbFileName,
      fileSize: data.fileSize.present ? data.fileSize.value : this.fileSize,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('OfflineAssetEntityData(')
          ..write('assetId: $assetId, ')
          ..write('fileName: $fileName, ')
          ..write('thumbFileName: $thumbFileName, ')
          ..write('fileSize: $fileSize, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(assetId, fileName, thumbFileName, fileSize, createdAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.OfflineAssetEntityData &&
          other.assetId == this.assetId &&
          other.fileName == this.fileName &&
          other.thumbFileName == this.thumbFileName &&
          other.fileSize == this.fileSize &&
          other.createdAt == this.createdAt);
}

class OfflineAssetEntityCompanion
    extends i0.UpdateCompanion<i1.OfflineAssetEntityData> {
  final i0.Value<String> assetId;
  final i0.Value<String?> fileName;
  final i0.Value<String?> thumbFileName;
  final i0.Value<int> fileSize;
  final i0.Value<DateTime> createdAt;
  const OfflineAssetEntityCompanion({
    this.assetId = const i0.Value.absent(),
    this.fileName = const i0.Value.absent(),
    this.thumbFileName = const i0.Value.absent(),
    this.fileSize = const i0.Value.absent(),
    this.createdAt = const i0.Value.absent(),
  });
  OfflineAssetEntityCompanion.insert({
    required String assetId,
    this.fileName = const i0.Value.absent(),
    this.thumbFileName = const i0.Value.absent(),
    this.fileSize = const i0.Value.absent(),
    this.createdAt = const i0.Value.absent(),
  }) : assetId = i0.Value(assetId);
  static i0.Insertable<i1.OfflineAssetEntityData> custom({
    i0.Expression<String>? assetId,
    i0.Expression<String>? fileName,
    i0.Expression<String>? thumbFileName,
    i0.Expression<int>? fileSize,
    i0.Expression<DateTime>? createdAt,
  }) {
    return i0.RawValuesInsertable({
      if (assetId != null) 'asset_id': assetId,
      if (fileName != null) 'file_name': fileName,
      if (thumbFileName != null) 'thumb_file_name': thumbFileName,
      if (fileSize != null) 'file_size': fileSize,
      if (createdAt != null) 'created_at': createdAt,
    });
  }

  i1.OfflineAssetEntityCompanion copyWith({
    i0.Value<String>? assetId,
    i0.Value<String?>? fileName,
    i0.Value<String?>? thumbFileName,
    i0.Value<int>? fileSize,
    i0.Value<DateTime>? createdAt,
  }) {
    return i1.OfflineAssetEntityCompanion(
      assetId: assetId ?? this.assetId,
      fileName: fileName ?? this.fileName,
      thumbFileName: thumbFileName ?? this.thumbFileName,
      fileSize: fileSize ?? this.fileSize,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (assetId.present) {
      map['asset_id'] = i0.Variable<String>(assetId.value);
    }
    if (fileName.present) {
      map['file_name'] = i0.Variable<String>(fileName.value);
    }
    if (thumbFileName.present) {
      map['thumb_file_name'] = i0.Variable<String>(thumbFileName.value);
    }
    if (fileSize.present) {
      map['file_size'] = i0.Variable<int>(fileSize.value);
    }
    if (createdAt.present) {
      map['created_at'] = i0.Variable<DateTime>(createdAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('OfflineAssetEntityCompanion(')
          ..write('assetId: $assetId, ')
          ..write('fileName: $fileName, ')
          ..write('thumbFileName: $thumbFileName, ')
          ..write('fileSize: $fileSize, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }
}
