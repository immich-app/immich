// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart' as i1;
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart'
    as i2;
import 'package:immich_mobile/infrastructure/entities/merged_asset.view.drift.dart'
    as i3;

class MergedAssetViewData extends i0.DataClass {
  final String? remoteId;
  final String? localId;
  final String name;
  final i1.AssetType type;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int? width;
  final int? height;
  final int? durationInSeconds;
  final bool isFavorite;
  final String? thumbHash;
  final String? checksum;
  const MergedAssetViewData(
      {this.remoteId,
      this.localId,
      required this.name,
      required this.type,
      required this.createdAt,
      required this.updatedAt,
      this.width,
      this.height,
      this.durationInSeconds,
      required this.isFavorite,
      this.thumbHash,
      this.checksum});
  factory MergedAssetViewData.fromJson(Map<String, dynamic> json,
      {i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return MergedAssetViewData(
      remoteId: serializer.fromJson<String?>(json['remote_id']),
      localId: serializer.fromJson<String?>(json['local_id']),
      name: serializer.fromJson<String>(json['name']),
      type: i2.$RemoteAssetEntityTable.$convertertype
          .fromJson(serializer.fromJson<int>(json['type'])),
      createdAt: serializer.fromJson<DateTime>(json['created_at']),
      updatedAt: serializer.fromJson<DateTime>(json['updated_at']),
      width: serializer.fromJson<int?>(json['width']),
      height: serializer.fromJson<int?>(json['height']),
      durationInSeconds: serializer.fromJson<int?>(json['duration_in_seconds']),
      isFavorite: serializer.fromJson<bool>(json['is_favorite']),
      thumbHash: serializer.fromJson<String?>(json['thumb_hash']),
      checksum: serializer.fromJson<String?>(json['checksum']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'remote_id': serializer.toJson<String?>(remoteId),
      'local_id': serializer.toJson<String?>(localId),
      'name': serializer.toJson<String>(name),
      'type': serializer
          .toJson<int>(i2.$RemoteAssetEntityTable.$convertertype.toJson(type)),
      'created_at': serializer.toJson<DateTime>(createdAt),
      'updated_at': serializer.toJson<DateTime>(updatedAt),
      'width': serializer.toJson<int?>(width),
      'height': serializer.toJson<int?>(height),
      'duration_in_seconds': serializer.toJson<int?>(durationInSeconds),
      'is_favorite': serializer.toJson<bool>(isFavorite),
      'thumb_hash': serializer.toJson<String?>(thumbHash),
      'checksum': serializer.toJson<String?>(checksum),
    };
  }

  i3.MergedAssetViewData copyWith(
          {i0.Value<String?> remoteId = const i0.Value.absent(),
          i0.Value<String?> localId = const i0.Value.absent(),
          String? name,
          i1.AssetType? type,
          DateTime? createdAt,
          DateTime? updatedAt,
          i0.Value<int?> width = const i0.Value.absent(),
          i0.Value<int?> height = const i0.Value.absent(),
          i0.Value<int?> durationInSeconds = const i0.Value.absent(),
          bool? isFavorite,
          i0.Value<String?> thumbHash = const i0.Value.absent(),
          i0.Value<String?> checksum = const i0.Value.absent()}) =>
      i3.MergedAssetViewData(
        remoteId: remoteId.present ? remoteId.value : this.remoteId,
        localId: localId.present ? localId.value : this.localId,
        name: name ?? this.name,
        type: type ?? this.type,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
        width: width.present ? width.value : this.width,
        height: height.present ? height.value : this.height,
        durationInSeconds: durationInSeconds.present
            ? durationInSeconds.value
            : this.durationInSeconds,
        isFavorite: isFavorite ?? this.isFavorite,
        thumbHash: thumbHash.present ? thumbHash.value : this.thumbHash,
        checksum: checksum.present ? checksum.value : this.checksum,
      );
  @override
  String toString() {
    return (StringBuffer('MergedAssetViewData(')
          ..write('remoteId: $remoteId, ')
          ..write('localId: $localId, ')
          ..write('name: $name, ')
          ..write('type: $type, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('width: $width, ')
          ..write('height: $height, ')
          ..write('durationInSeconds: $durationInSeconds, ')
          ..write('isFavorite: $isFavorite, ')
          ..write('thumbHash: $thumbHash, ')
          ..write('checksum: $checksum')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      remoteId,
      localId,
      name,
      type,
      createdAt,
      updatedAt,
      width,
      height,
      durationInSeconds,
      isFavorite,
      thumbHash,
      checksum);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i3.MergedAssetViewData &&
          other.remoteId == this.remoteId &&
          other.localId == this.localId &&
          other.name == this.name &&
          other.type == this.type &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt &&
          other.width == this.width &&
          other.height == this.height &&
          other.durationInSeconds == this.durationInSeconds &&
          other.isFavorite == this.isFavorite &&
          other.thumbHash == this.thumbHash &&
          other.checksum == this.checksum);
}

class MergedAssetView
    extends i0.ViewInfo<i3.MergedAssetView, i3.MergedAssetViewData>
    implements i0.HasResultSet {
  final String? _alias;
  @override
  final i0.GeneratedDatabase attachedDatabase;
  MergedAssetView(this.attachedDatabase, [this._alias]);
  @override
  List<i0.GeneratedColumn> get $columns => [
        remoteId,
        localId,
        name,
        type,
        createdAt,
        updatedAt,
        width,
        height,
        durationInSeconds,
        isFavorite,
        thumbHash,
        checksum
      ];
  @override
  String get aliasedName => _alias ?? entityName;
  @override
  String get entityName => 'merged_asset_view';
  @override
  Map<i0.SqlDialect, String> get createViewStatements => {
        i0.SqlDialect.sqlite:
            'CREATE VIEW IF NOT EXISTS merged_asset_view AS SELECT rae.id AS remote_id, lae.id AS local_id, rae.name, rae.type, rae.created_at, rae.updated_at, rae.width, rae.height, rae.duration_in_seconds, rae.is_favorite, rae.thumb_hash, rae.checksum FROM remote_asset_entity AS rae LEFT JOIN local_asset_entity AS lae ON rae.checksum = lae.checksum UNION ALL SELECT NULL AS remote_id, lae.id AS local_id, lae.name, lae.type, lae.created_at, lae.updated_at, lae.width, lae.height, lae.duration_in_seconds, lae.is_favorite, NULL AS thumb_hash, lae.checksum FROM local_asset_entity AS lae LEFT JOIN remote_asset_entity AS rae ON rae.checksum = lae.checksum WHERE rae.id IS NULL',
      };
  @override
  MergedAssetView get asDslTable => this;
  @override
  i3.MergedAssetViewData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i3.MergedAssetViewData(
      remoteId: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}remote_id']),
      localId: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}local_id']),
      name: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}name'])!,
      type: i2.$RemoteAssetEntityTable.$convertertype.fromSql(attachedDatabase
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
      isFavorite: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.bool, data['${effectivePrefix}is_favorite'])!,
      thumbHash: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}thumb_hash']),
      checksum: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}checksum']),
    );
  }

  late final i0.GeneratedColumn<String> remoteId = i0.GeneratedColumn<String>(
      'remote_id', aliasedName, true,
      type: i0.DriftSqlType.string);
  late final i0.GeneratedColumn<String> localId = i0.GeneratedColumn<String>(
      'local_id', aliasedName, true,
      type: i0.DriftSqlType.string);
  late final i0.GeneratedColumn<String> name = i0.GeneratedColumn<String>(
      'name', aliasedName, false,
      type: i0.DriftSqlType.string);
  late final i0.GeneratedColumnWithTypeConverter<i1.AssetType, int> type =
      i0.GeneratedColumn<int>('type', aliasedName, false,
              type: i0.DriftSqlType.int)
          .withConverter<i1.AssetType>(
              i2.$RemoteAssetEntityTable.$convertertype);
  late final i0.GeneratedColumn<DateTime> createdAt =
      i0.GeneratedColumn<DateTime>('created_at', aliasedName, false,
          type: i0.DriftSqlType.dateTime);
  late final i0.GeneratedColumn<DateTime> updatedAt =
      i0.GeneratedColumn<DateTime>('updated_at', aliasedName, false,
          type: i0.DriftSqlType.dateTime);
  late final i0.GeneratedColumn<int> width = i0.GeneratedColumn<int>(
      'width', aliasedName, true,
      type: i0.DriftSqlType.int);
  late final i0.GeneratedColumn<int> height = i0.GeneratedColumn<int>(
      'height', aliasedName, true,
      type: i0.DriftSqlType.int);
  late final i0.GeneratedColumn<int> durationInSeconds =
      i0.GeneratedColumn<int>('duration_in_seconds', aliasedName, true,
          type: i0.DriftSqlType.int);
  late final i0.GeneratedColumn<bool> isFavorite = i0.GeneratedColumn<bool>(
      'is_favorite', aliasedName, false,
      type: i0.DriftSqlType.bool,
      defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
          'CHECK ("is_favorite" IN (0, 1))'));
  late final i0.GeneratedColumn<String> thumbHash = i0.GeneratedColumn<String>(
      'thumb_hash', aliasedName, true,
      type: i0.DriftSqlType.string);
  late final i0.GeneratedColumn<String> checksum = i0.GeneratedColumn<String>(
      'checksum', aliasedName, true,
      type: i0.DriftSqlType.string);
  @override
  MergedAssetView createAlias(String alias) {
    return MergedAssetView(attachedDatabase, alias);
  }

  @override
  i0.Query? get query => null;
  @override
  Set<String> get readTables =>
      const {'remote_asset_entity', 'local_asset_entity'};
}
