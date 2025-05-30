// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/remote_album_asset.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/remote_album_asset.entity.dart'
    as i2;
import 'dart:typed_data' as i3;

typedef $$RemoteAlbumAssetEntityTableCreateCompanionBuilder
    = i1.RemoteAlbumAssetEntityCompanion Function({
  required String assetId,
  required String albumId,
});
typedef $$RemoteAlbumAssetEntityTableUpdateCompanionBuilder
    = i1.RemoteAlbumAssetEntityCompanion Function({
  i0.Value<String> assetId,
  i0.Value<String> albumId,
});

class $$RemoteAlbumAssetEntityTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$RemoteAlbumAssetEntityTable> {
  $$RemoteAlbumAssetEntityTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
}

class $$RemoteAlbumAssetEntityTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$RemoteAlbumAssetEntityTable> {
  $$RemoteAlbumAssetEntityTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
}

class $$RemoteAlbumAssetEntityTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$RemoteAlbumAssetEntityTable> {
  $$RemoteAlbumAssetEntityTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
}

class $$RemoteAlbumAssetEntityTableTableManager extends i0.RootTableManager<
    i0.GeneratedDatabase,
    i1.$RemoteAlbumAssetEntityTable,
    i1.RemoteAlbumAssetEntityData,
    i1.$$RemoteAlbumAssetEntityTableFilterComposer,
    i1.$$RemoteAlbumAssetEntityTableOrderingComposer,
    i1.$$RemoteAlbumAssetEntityTableAnnotationComposer,
    $$RemoteAlbumAssetEntityTableCreateCompanionBuilder,
    $$RemoteAlbumAssetEntityTableUpdateCompanionBuilder,
    (
      i1.RemoteAlbumAssetEntityData,
      i0.BaseReferences<i0.GeneratedDatabase, i1.$RemoteAlbumAssetEntityTable,
          i1.RemoteAlbumAssetEntityData>
    ),
    i1.RemoteAlbumAssetEntityData,
    i0.PrefetchHooks Function()> {
  $$RemoteAlbumAssetEntityTableTableManager(
      i0.GeneratedDatabase db, i1.$RemoteAlbumAssetEntityTable table)
      : super(i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$RemoteAlbumAssetEntityTableFilterComposer(
                  $db: db, $table: table),
          createOrderingComposer: () =>
              i1.$$RemoteAlbumAssetEntityTableOrderingComposer(
                  $db: db, $table: table),
          createComputedFieldComposer: () =>
              i1.$$RemoteAlbumAssetEntityTableAnnotationComposer(
                  $db: db, $table: table),
          updateCompanionCallback: ({
            i0.Value<String> assetId = const i0.Value.absent(),
            i0.Value<String> albumId = const i0.Value.absent(),
          }) =>
              i1.RemoteAlbumAssetEntityCompanion(
            assetId: assetId,
            albumId: albumId,
          ),
          createCompanionCallback: ({
            required String assetId,
            required String albumId,
          }) =>
              i1.RemoteAlbumAssetEntityCompanion.insert(
            assetId: assetId,
            albumId: albumId,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), i0.BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$RemoteAlbumAssetEntityTableProcessedTableManager
    = i0.ProcessedTableManager<
        i0.GeneratedDatabase,
        i1.$RemoteAlbumAssetEntityTable,
        i1.RemoteAlbumAssetEntityData,
        i1.$$RemoteAlbumAssetEntityTableFilterComposer,
        i1.$$RemoteAlbumAssetEntityTableOrderingComposer,
        i1.$$RemoteAlbumAssetEntityTableAnnotationComposer,
        $$RemoteAlbumAssetEntityTableCreateCompanionBuilder,
        $$RemoteAlbumAssetEntityTableUpdateCompanionBuilder,
        (
          i1.RemoteAlbumAssetEntityData,
          i0.BaseReferences<i0.GeneratedDatabase,
              i1.$RemoteAlbumAssetEntityTable, i1.RemoteAlbumAssetEntityData>
        ),
        i1.RemoteAlbumAssetEntityData,
        i0.PrefetchHooks Function()>;

class $RemoteAlbumAssetEntityTable extends i2.RemoteAlbumAssetEntity
    with
        i0.TableInfo<$RemoteAlbumAssetEntityTable,
            i1.RemoteAlbumAssetEntityData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $RemoteAlbumAssetEntityTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _assetIdMeta =
      const i0.VerificationMeta('assetId');
  @override
  late final i0.GeneratedColumn<String> assetId = i0.GeneratedColumn<String>(
      'asset_id', aliasedName, false,
      type: i0.DriftSqlType.string,
      requiredDuringInsert: true,
      defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
          'REFERENCES remote_asset_entity (remote_id) ON DELETE CASCADE'));
  static const i0.VerificationMeta _albumIdMeta =
      const i0.VerificationMeta('albumId');
  @override
  late final i0.GeneratedColumn<String> albumId = i0.GeneratedColumn<String>(
      'album_id', aliasedName, false,
      type: i0.DriftSqlType.string,
      requiredDuringInsert: true,
      defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
          'REFERENCES remote_album_entity (remote_id) ON DELETE CASCADE'));
  @override
  List<i0.GeneratedColumn> get $columns => [assetId, albumId];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'remote_album_asset_entity';
  @override
  i0.VerificationContext validateIntegrity(
      i0.Insertable<i1.RemoteAlbumAssetEntityData> instance,
      {bool isInserting = false}) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('asset_id')) {
      context.handle(_assetIdMeta,
          assetId.isAcceptableOrUnknown(data['asset_id']!, _assetIdMeta));
    } else if (isInserting) {
      context.missing(_assetIdMeta);
    }
    if (data.containsKey('album_id')) {
      context.handle(_albumIdMeta,
          albumId.isAcceptableOrUnknown(data['album_id']!, _albumIdMeta));
    } else if (isInserting) {
      context.missing(_albumIdMeta);
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {assetId, albumId};
  @override
  i1.RemoteAlbumAssetEntityData map(Map<String, dynamic> data,
      {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.RemoteAlbumAssetEntityData(
      assetId: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}asset_id'])!,
      albumId: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}album_id'])!,
    );
  }

  @override
  $RemoteAlbumAssetEntityTable createAlias(String alias) {
    return $RemoteAlbumAssetEntityTable(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class RemoteAlbumAssetEntityData extends i0.DataClass
    implements i0.Insertable<i1.RemoteAlbumAssetEntityData> {
  final String assetId;
  final String albumId;
  const RemoteAlbumAssetEntityData(
      {required this.assetId, required this.albumId});
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['asset_id'] = i0.Variable<String>(assetId);
    map['album_id'] = i0.Variable<String>(albumId);
    return map;
  }

  factory RemoteAlbumAssetEntityData.fromJson(Map<String, dynamic> json,
      {i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return RemoteAlbumAssetEntityData(
      assetId: serializer.fromJson<String>(json['assetId']),
      albumId: serializer.fromJson<String>(json['albumId']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'assetId': serializer.toJson<String>(assetId),
      'albumId': serializer.toJson<String>(albumId),
    };
  }

  i1.RemoteAlbumAssetEntityData copyWith({String? assetId, String? albumId}) =>
      i1.RemoteAlbumAssetEntityData(
        assetId: assetId ?? this.assetId,
        albumId: albumId ?? this.albumId,
      );
  RemoteAlbumAssetEntityData copyWithCompanion(
      i1.RemoteAlbumAssetEntityCompanion data) {
    return RemoteAlbumAssetEntityData(
      assetId: data.assetId.present ? data.assetId.value : this.assetId,
      albumId: data.albumId.present ? data.albumId.value : this.albumId,
    );
  }

  @override
  String toString() {
    return (StringBuffer('RemoteAlbumAssetEntityData(')
          ..write('assetId: $assetId, ')
          ..write('albumId: $albumId')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(assetId, albumId);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.RemoteAlbumAssetEntityData &&
          other.assetId == this.assetId &&
          other.albumId == this.albumId);
}

class RemoteAlbumAssetEntityCompanion
    extends i0.UpdateCompanion<i1.RemoteAlbumAssetEntityData> {
  final i0.Value<String> assetId;
  final i0.Value<String> albumId;
  const RemoteAlbumAssetEntityCompanion({
    this.assetId = const i0.Value.absent(),
    this.albumId = const i0.Value.absent(),
  });
  RemoteAlbumAssetEntityCompanion.insert({
    required String assetId,
    required String albumId,
  })  : assetId = i0.Value(assetId),
        albumId = i0.Value(albumId);
  static i0.Insertable<i1.RemoteAlbumAssetEntityData> custom({
    i0.Expression<String>? assetId,
    i0.Expression<String>? albumId,
  }) {
    return i0.RawValuesInsertable({
      if (assetId != null) 'asset_id': assetId,
      if (albumId != null) 'album_id': albumId,
    });
  }

  i1.RemoteAlbumAssetEntityCompanion copyWith(
      {i0.Value<String>? assetId, i0.Value<String>? albumId}) {
    return i1.RemoteAlbumAssetEntityCompanion(
      assetId: assetId ?? this.assetId,
      albumId: albumId ?? this.albumId,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (assetId.present) {
      map['asset_id'] = i0.Variable<String>(assetId.value);
    }
    if (albumId.present) {
      map['album_id'] = i0.Variable<String>(albumId.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('RemoteAlbumAssetEntityCompanion(')
          ..write('assetId: $assetId, ')
          ..write('albumId: $albumId')
          ..write(')'))
        .toString();
  }
}
