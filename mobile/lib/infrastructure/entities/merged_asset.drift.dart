// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:drift/internal/modular.dart' as i1;
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart' as i2;
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart'
    as i3;
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart'
    as i4;
import 'package:immich_mobile/infrastructure/entities/stack.entity.drift.dart'
    as i5;
import 'package:immich_mobile/infrastructure/entities/local_album_asset.entity.drift.dart'
    as i6;
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart'
    as i7;

class MergedAssetDrift extends i1.ModularAccessor {
  MergedAssetDrift(i0.GeneratedDatabase db) : super(db);
  i0.Selectable<MergedAssetResult> mergedAsset(List<String> var1,
      {required i0.Limit limit}) {
    var $arrayStartIndex = 1;
    final expandedvar1 = $expandVar($arrayStartIndex, var1.length);
    $arrayStartIndex += var1.length;
    final generatedlimit = $write(limit, startIndex: $arrayStartIndex);
    $arrayStartIndex += generatedlimit.amountOfVariables;
    return customSelect(
        'SELECT * FROM (SELECT rae.id AS remote_id, FIRST_VALUE(lae.id)OVER (PARTITION BY lae.checksum RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW EXCLUDE NO OTHERS) AS local_id, rae.name, rae.type, rae.created_at, rae.updated_at, rae.width, rae.height, rae.duration_in_seconds, rae.is_favorite, rae.thumb_hash, rae.checksum, rae.owner_id, rae.live_photo_video_id, 0 AS orientation, rae.stack_id, COALESCE(stack_count.total_count, 0) AS stack_count FROM remote_asset_entity AS rae LEFT JOIN local_asset_entity AS lae ON rae.checksum = lae.checksum LEFT JOIN stack_entity AS se ON rae.stack_id = se.id LEFT JOIN (SELECT stack_id, COUNT(*) AS total_count FROM remote_asset_entity WHERE deleted_at IS NULL AND visibility = 0 AND stack_id IS NOT NULL GROUP BY stack_id) AS stack_count ON rae.stack_id = stack_count.stack_id WHERE rae.deleted_at IS NULL AND rae.visibility = 0 AND rae.owner_id IN ($expandedvar1) AND(rae.stack_id IS NULL OR rae.id = se.primary_asset_id)UNION ALL SELECT NULL AS remote_id, lae.id AS local_id, lae.name, lae.type, lae.created_at, lae.updated_at, lae.width, lae.height, lae.duration_in_seconds, lae.is_favorite, NULL AS thumb_hash, lae.checksum, NULL AS owner_id, NULL AS live_photo_video_id, lae.orientation, NULL AS stack_id, 0 AS stack_count FROM local_asset_entity AS lae LEFT JOIN remote_asset_entity AS rae ON rae.checksum = lae.checksum LEFT JOIN local_album_asset_entity AS laa ON laa.asset_id = lae.id LEFT JOIN local_album_entity AS la ON la.id = laa.album_id WHERE rae.id IS NULL AND la.backup_selection = 0) ORDER BY created_at DESC ${generatedlimit.sql}',
        variables: [
          for (var $ in var1) i0.Variable<String>($),
          ...generatedlimit.introducedVariables
        ],
        readsFrom: {
          remoteAssetEntity,
          localAssetEntity,
          stackEntity,
          localAlbumAssetEntity,
          localAlbumEntity,
          ...generatedlimit.watchedTables,
        }).map((i0.QueryRow row) => MergedAssetResult(
          remoteId: row.readNullable<String>('remote_id'),
          localId: row.readNullable<String>('local_id'),
          name: row.read<String>('name'),
          type: i3.$RemoteAssetEntityTable.$convertertype
              .fromSql(row.read<int>('type')),
          createdAt: row.read<DateTime>('created_at'),
          updatedAt: row.read<DateTime>('updated_at'),
          width: row.readNullable<int>('width'),
          height: row.readNullable<int>('height'),
          durationInSeconds: row.readNullable<int>('duration_in_seconds'),
          isFavorite: row.read<bool>('is_favorite'),
          thumbHash: row.readNullable<String>('thumb_hash'),
          checksum: row.readNullable<String>('checksum'),
          ownerId: row.readNullable<String>('owner_id'),
          livePhotoVideoId: row.readNullable<String>('live_photo_video_id'),
          orientation: row.read<int>('orientation'),
          stackId: row.readNullable<String>('stack_id'),
          stackCount: row.read<int>('stack_count'),
        ));
  }

  i0.Selectable<MergedBucketResult> mergedBucket(List<String> var2,
      {required int groupBy}) {
    var $arrayStartIndex = 2;
    final expandedvar2 = $expandVar($arrayStartIndex, var2.length);
    $arrayStartIndex += var2.length;
    return customSelect(
        'SELECT COUNT(*) AS asset_count, CASE WHEN ?1 = 0 THEN STRFTIME(\'%Y-%m-%d\', created_at, \'localtime\') WHEN ?1 = 1 THEN STRFTIME(\'%Y-%m\', created_at, \'localtime\') END AS bucket_date FROM (SELECT rae.created_at FROM remote_asset_entity AS rae LEFT JOIN stack_entity AS se ON rae.stack_id = se.id WHERE rae.deleted_at IS NULL AND rae.visibility = 0 AND rae.owner_id IN ($expandedvar2) AND(rae.stack_id IS NULL OR rae.id = se.primary_asset_id)UNION ALL SELECT lae.created_at FROM local_asset_entity AS lae LEFT JOIN remote_asset_entity AS rae ON rae.checksum = lae.checksum LEFT JOIN local_album_asset_entity AS laa ON laa.asset_id = lae.id LEFT JOIN local_album_entity AS la ON la.id = laa.album_id WHERE rae.id IS NULL AND la.backup_selection = 0) GROUP BY bucket_date ORDER BY bucket_date DESC',
        variables: [
          i0.Variable<int>(groupBy),
          for (var $ in var2) i0.Variable<String>($)
        ],
        readsFrom: {
          remoteAssetEntity,
          stackEntity,
          localAssetEntity,
          localAlbumAssetEntity,
          localAlbumEntity,
        }).map((i0.QueryRow row) => MergedBucketResult(
          assetCount: row.read<int>('asset_count'),
          bucketDate: row.read<String>('bucket_date'),
        ));
  }

  i3.$RemoteAssetEntityTable get remoteAssetEntity =>
      i1.ReadDatabaseContainer(attachedDatabase)
          .resultSet<i3.$RemoteAssetEntityTable>('remote_asset_entity');
  i4.$LocalAssetEntityTable get localAssetEntity =>
      i1.ReadDatabaseContainer(attachedDatabase)
          .resultSet<i4.$LocalAssetEntityTable>('local_asset_entity');
  i5.$StackEntityTable get stackEntity =>
      i1.ReadDatabaseContainer(attachedDatabase)
          .resultSet<i5.$StackEntityTable>('stack_entity');
  i6.$LocalAlbumAssetEntityTable get localAlbumAssetEntity =>
      i1.ReadDatabaseContainer(attachedDatabase)
          .resultSet<i6.$LocalAlbumAssetEntityTable>(
              'local_album_asset_entity');
  i7.$LocalAlbumEntityTable get localAlbumEntity =>
      i1.ReadDatabaseContainer(attachedDatabase)
          .resultSet<i7.$LocalAlbumEntityTable>('local_album_entity');
}

class MergedAssetResult {
  final String? remoteId;
  final String? localId;
  final String name;
  final i2.AssetType type;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int? width;
  final int? height;
  final int? durationInSeconds;
  final bool isFavorite;
  final String? thumbHash;
  final String? checksum;
  final String? ownerId;
  final String? livePhotoVideoId;
  final int orientation;
  final String? stackId;
  final int stackCount;
  MergedAssetResult({
    this.remoteId,
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
    this.checksum,
    this.ownerId,
    this.livePhotoVideoId,
    required this.orientation,
    this.stackId,
    required this.stackCount,
  });
}

class MergedBucketResult {
  final int assetCount;
  final String bucketDate;
  MergedBucketResult({
    required this.assetCount,
    required this.bucketDate,
  });
}
