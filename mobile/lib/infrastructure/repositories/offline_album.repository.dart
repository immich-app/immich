import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/offline_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/offline_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/offline_file.repository.dart';

class OfflineAlbumProgress {
  final int total;
  final int downloaded;

  const OfflineAlbumProgress({required this.total, required this.downloaded});

  bool get isComplete => downloaded >= total;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) {
      return true;
    }
    return other is OfflineAlbumProgress && total == other.total && downloaded == other.downloaded;
  }

  @override
  int get hashCode => total.hashCode ^ downloaded.hashCode;
}

class DriftOfflineAlbumRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftOfflineAlbumRepository(this._db) : super(_db);

  Future<void> addAlbum(String albumId) {
    return _db
        .into(_db.offlineAlbumEntity)
        .insert(OfflineAlbumEntityCompanion(albumId: Value(albumId)), mode: InsertMode.insertOrIgnore);
  }

  Future<void> removeAlbum(String albumId) {
    return _db.offlineAlbumEntity.deleteWhere((row) => row.albumId.equals(albumId));
  }

  Future<List<String>> getAlbumIds() {
    final query = _db.offlineAlbumEntity.selectOnly()..addColumns([_db.offlineAlbumEntity.albumId]);
    return query.map((row) => row.read(_db.offlineAlbumEntity.albumId)!).get();
  }

  Future<bool> isAlbumOffline(String albumId) async {
    final query = _db.offlineAlbumEntity.select()..where((row) => row.albumId.equals(albumId));
    return await query.getSingleOrNull() != null;
  }

  Stream<bool> watchIsAlbumOffline(String albumId) {
    final query = _db.offlineAlbumEntity.select()..where((row) => row.albumId.equals(albumId));
    return query.watchSingleOrNull().map((row) => row != null);
  }

  /// Distinct assets that belong to any offline album
  Future<List<RemoteAsset>> getRequiredAssets() {
    final query = _db.remoteAssetEntity.select().join([
      innerJoin(
        _db.remoteAlbumAssetEntity,
        _db.remoteAlbumAssetEntity.assetId.equalsExp(_db.remoteAssetEntity.id),
        useColumns: false,
      ),
      innerJoin(
        _db.offlineAlbumEntity,
        _db.offlineAlbumEntity.albumId.equalsExp(_db.remoteAlbumAssetEntity.albumId),
        useColumns: false,
      ),
    ])..where(_db.remoteAssetEntity.deletedAt.isNull());
    query.groupBy([_db.remoteAssetEntity.id]);

    return query.map((row) => row.readTable(_db.remoteAssetEntity).toDto()).get();
  }

  Future<Set<String>> getDownloadedAssetIds() async {
    final query = _db.offlineAssetEntity.selectOnly()..addColumns([_db.offlineAssetEntity.assetId]);
    final ids = await query.map((row) => row.read(_db.offlineAssetEntity.assetId)!).get();
    return ids.toSet();
  }

  Future<void> setOriginalDownloaded(String assetId, String fileName, int fileSize) async {
    await _db
        .into(_db.offlineAssetEntity)
        .insert(
          OfflineAssetEntityCompanion(assetId: Value(assetId), fileName: Value(fileName), fileSize: Value(fileSize)),
          onConflict: DoUpdate(
            (old) => OfflineAssetEntityCompanion(fileName: Value(fileName), fileSize: Value(fileSize)),
          ),
        );
    OfflineFileRegistry.instance.setOriginal(assetId, fileName);
  }

  Future<void> setThumbnailDownloaded(String assetId, String thumbFileName) async {
    await _db
        .into(_db.offlineAssetEntity)
        .insert(
          OfflineAssetEntityCompanion(assetId: Value(assetId), thumbFileName: Value(thumbFileName)),
          onConflict: DoUpdate((old) => OfflineAssetEntityCompanion(thumbFileName: Value(thumbFileName))),
        );
    OfflineFileRegistry.instance.setThumbnail(assetId, thumbFileName);
  }

  Future<void> removeAssets(Iterable<String> assetIds) async {
    if (assetIds.isEmpty) {
      return;
    }

    await _db.offlineAssetEntity.deleteWhere((row) => row.assetId.isIn(assetIds));
    for (final assetId in assetIds) {
      await OfflineFileRegistry.instance.remove(assetId);
    }
  }

  /// Total number of assets in the album and how many of them already have
  /// their original downloaded
  Stream<OfflineAlbumProgress> watchAlbumProgress(String albumId) {
    final query = _db.customSelect(
      '''
      SELECT COUNT(raa.asset_id) AS total,
             COUNT(oa.file_name) AS downloaded
      FROM remote_album_asset_entity raa
      LEFT JOIN offline_asset_entity oa ON oa.asset_id = raa.asset_id
      WHERE raa.album_id = ?
      ''',
      variables: [Variable<String>(albumId)],
      readsFrom: {_db.remoteAlbumAssetEntity, _db.offlineAssetEntity},
    );

    return query
        .map((row) => OfflineAlbumProgress(total: row.read<int>('total'), downloaded: row.read<int>('downloaded')))
        .watchSingle();
  }
}
