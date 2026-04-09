// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:drift/internal/modular.dart' as i1;
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart' as i2;
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart'
    as i3;
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart'
    as i4;
import 'package:immich_mobile/infrastructure/entities/stack.entity.drift.dart'
    as i5;
import 'package:immich_mobile/infrastructure/entities/local_album_asset.entity.drift.dart'
    as i6;
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart'
    as i7;

class MergedAssetDrift extends i1.ModularAccessor {
  MergedAssetDrift(i0.GeneratedDatabase db) : super(db);
  i0.Selectable<MergedAssetResult> mergedAsset({
    required List<String> userIds,
    required MergedAsset$limit limit,
  }) {
    var $arrayStartIndex = 1;
    final expandeduserIds = $expandVar($arrayStartIndex, userIds.length);
    $arrayStartIndex += userIds.length;
    final generatedlimit = $write(
      limit(alias(this.localAssetEntity, 'lae')),
      startIndex: $arrayStartIndex,
    );
    $arrayStartIndex += generatedlimit.amountOfVariables;
    return customSelect(
      'SELECT rae.id AS remote_id, (SELECT lae.id FROM local_asset_entity AS lae WHERE lae.checksum = rae.checksum LIMIT 1) AS local_id, rae.name, rae.type, rae.created_at AS created_at, rae.updated_at, rae.width, rae.height, rae.duration_in_seconds, rae.is_favorite, rae.thumb_hash, rae.checksum, rae.owner_id, rae.live_photo_video_id, 0 AS orientation, rae.stack_id, NULL AS i_cloud_id, NULL AS latitude, NULL AS longitude, NULL AS adjustmentTime, rae.is_edited, 0 AS playback_style FROM remote_asset_entity AS rae LEFT JOIN stack_entity AS se ON rae.stack_id = se.id WHERE rae.deleted_at IS NULL AND rae.visibility = 0 AND rae.owner_id IN ($expandeduserIds) AND(rae.stack_id IS NULL OR rae.id = se.primary_asset_id)UNION ALL SELECT NULL AS remote_id, lae.id AS local_id, lae.name, lae.type, lae.created_at AS created_at, lae.updated_at, lae.width, lae.height, lae.duration_in_seconds, lae.is_favorite, NULL AS thumb_hash, lae.checksum, NULL AS owner_id, NULL AS live_photo_video_id, lae.orientation, NULL AS stack_id, lae.i_cloud_id, lae.latitude, lae.longitude, lae.adjustment_time, 0 AS is_edited, lae.playback_style FROM local_asset_entity AS lae WHERE NOT EXISTS (SELECT 1 FROM remote_asset_entity AS rae WHERE rae.checksum = lae.checksum AND rae.owner_id IN ($expandeduserIds)) AND EXISTS (SELECT 1 FROM local_album_asset_entity AS laa INNER JOIN local_album_entity AS la ON laa.album_id = la.id WHERE laa.asset_id = lae.id AND la.backup_selection = 0) AND NOT EXISTS (SELECT 1 FROM local_album_asset_entity AS laa INNER JOIN local_album_entity AS la ON laa.album_id = la.id WHERE laa.asset_id = lae.id AND la.backup_selection = 2) ORDER BY created_at DESC ${generatedlimit.sql}',
      variables: [
        for (var $ in userIds) i0.Variable<String>($),
        ...generatedlimit.introducedVariables,
      ],
      readsFrom: {
        remoteAssetEntity,
        localAssetEntity,
        stackEntity,
        localAlbumAssetEntity,
        localAlbumEntity,
        ...generatedlimit.watchedTables,
      },
    ).map(
      (i0.QueryRow row) => MergedAssetResult(
        remoteId: row.readNullable<String>('remote_id'),
        localId: row.readNullable<String>('local_id'),
        name: row.read<String>('name'),
        type: i4.$RemoteAssetEntityTable.$convertertype.fromSql(
          row.read<int>('type'),
        ),
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
        iCloudId: row.readNullable<String>('i_cloud_id'),
        latitude: row.readNullable<double>('latitude'),
        longitude: row.readNullable<double>('longitude'),
        adjustmentTime: row.readNullable<DateTime>('adjustmentTime'),
        isEdited: row.read<bool>('is_edited'),
        playbackStyle: row.read<int>('playback_style'),
      ),
    );
  }

  i0.Selectable<MergedBucketResult> mergedBucket({
    required int groupBy,
    required List<String> userIds,
  }) {
    var $arrayStartIndex = 2;
    final expandeduserIds = $expandVar($arrayStartIndex, userIds.length);
    $arrayStartIndex += userIds.length;
    return customSelect(
      'SELECT COUNT(*) AS asset_count, bucket_date FROM (SELECT CASE WHEN ?1 = 0 THEN COALESCE(STRFTIME(\'%Y-%m-%d\', rae.local_date_time), STRFTIME(\'%Y-%m-%d\', rae.created_at, \'localtime\')) WHEN ?1 = 1 THEN COALESCE(STRFTIME(\'%Y-%m\', rae.local_date_time), STRFTIME(\'%Y-%m\', rae.created_at, \'localtime\')) END AS bucket_date FROM remote_asset_entity AS rae LEFT JOIN stack_entity AS se ON rae.stack_id = se.id WHERE rae.deleted_at IS NULL AND rae.visibility = 0 AND rae.owner_id IN ($expandeduserIds) AND(rae.stack_id IS NULL OR rae.id = se.primary_asset_id)UNION ALL SELECT CASE WHEN ?1 = 0 THEN STRFTIME(\'%Y-%m-%d\', lae.created_at, \'localtime\') WHEN ?1 = 1 THEN STRFTIME(\'%Y-%m\', lae.created_at, \'localtime\') END AS bucket_date FROM local_asset_entity AS lae WHERE NOT EXISTS (SELECT 1 FROM remote_asset_entity AS rae WHERE rae.checksum = lae.checksum AND rae.owner_id IN ($expandeduserIds)) AND EXISTS (SELECT 1 FROM local_album_asset_entity AS laa INNER JOIN local_album_entity AS la ON laa.album_id = la.id WHERE laa.asset_id = lae.id AND la.backup_selection = 0) AND NOT EXISTS (SELECT 1 FROM local_album_asset_entity AS laa INNER JOIN local_album_entity AS la ON laa.album_id = la.id WHERE laa.asset_id = lae.id AND la.backup_selection = 2)) GROUP BY bucket_date ORDER BY bucket_date DESC',
      variables: [
        i0.Variable<int>(groupBy),
        for (var $ in userIds) i0.Variable<String>($),
      ],
      readsFrom: {
        remoteAssetEntity,
        stackEntity,
        localAssetEntity,
        localAlbumAssetEntity,
        localAlbumEntity,
      },
    ).map(
      (i0.QueryRow row) => MergedBucketResult(
        assetCount: row.read<int>('asset_count'),
        bucketDate: row.read<String>('bucket_date'),
      ),
    );
  }

  i4.$RemoteAssetEntityTable get remoteAssetEntity => i1.ReadDatabaseContainer(
    attachedDatabase,
  ).resultSet<i4.$RemoteAssetEntityTable>('remote_asset_entity');
  i5.$StackEntityTable get stackEntity => i1.ReadDatabaseContainer(
    attachedDatabase,
  ).resultSet<i5.$StackEntityTable>('stack_entity');
  i3.$LocalAssetEntityTable get localAssetEntity => i1.ReadDatabaseContainer(
    attachedDatabase,
  ).resultSet<i3.$LocalAssetEntityTable>('local_asset_entity');
  i6.$LocalAlbumAssetEntityTable get localAlbumAssetEntity =>
      i1.ReadDatabaseContainer(
        attachedDatabase,
      ).resultSet<i6.$LocalAlbumAssetEntityTable>('local_album_asset_entity');
  i7.$LocalAlbumEntityTable get localAlbumEntity => i1.ReadDatabaseContainer(
    attachedDatabase,
  ).resultSet<i7.$LocalAlbumEntityTable>('local_album_entity');
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
  final String? iCloudId;
  final double? latitude;
  final double? longitude;
  final DateTime? adjustmentTime;
  final bool isEdited;
  final int playbackStyle;
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
    this.iCloudId,
    this.latitude,
    this.longitude,
    this.adjustmentTime,
    required this.isEdited,
    required this.playbackStyle,
  });
}

typedef MergedAsset$limit = i0.Limit Function(i3.$LocalAssetEntityTable lae);

class MergedBucketResult {
  final int assetCount;
  final String bucketDate;
  MergedBucketResult({required this.assetCount, required this.bucketDate});
}
