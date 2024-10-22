import 'dart:async';

import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/entities/album_asset.entity.drift.dart';
import 'package:immich_mobile/domain/interfaces/album_asset.interface.dart';
import 'package:immich_mobile/domain/models/asset.model.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';
import 'package:immich_mobile/domain/utils/drift_model_converters.dart';
import 'package:immich_mobile/utils/mixins/log.mixin.dart';

class AlbumToAssetRepository with LogMixin implements IAlbumToAssetRepository {
  final DriftDatabaseRepository _db;

  const AlbumToAssetRepository({required DriftDatabaseRepository db})
      : _db = db;

  @override
  Future<bool> addAssetIds(int albumId, Iterable<int> assetIds) async {
    try {
      await _db.albumToAsset.insertAll(
        assetIds.map(
          (a) => AlbumToAssetCompanion.insert(assetId: a, albumId: albumId),
        ),
        onConflict: DoNothing(
          target: [_db.albumToAsset.assetId, _db.albumToAsset.albumId],
        ),
      );
      return true;
    } catch (e, s) {
      log.e("Error while adding assets to albumId - $albumId", e, s);
      return false;
    }
  }

  @override
  Future<List<int>> getAssetIdsOnlyInAlbum(int albumId) async {
    final assetId = _db.asset.id;
    final query = _db.asset.selectOnly()
      ..addColumns([assetId])
      ..join([
        innerJoin(
          _db.albumToAsset,
          _db.albumToAsset.assetId.equalsExp(assetId) &
              _db.asset.remoteId.isNull(),
          useColumns: false,
        ),
      ])
      ..groupBy(
        [assetId],
        having: _db.albumToAsset.albumId.count().equals(1) &
            _db.albumToAsset.albumId.max().equals(albumId),
      );

    return await query.map((row) => row.read(assetId)!).get();
  }

  @override
  Future<List<Asset>> getAssetsForAlbum(int albumId) async {
    final query = _db.asset.select().join([
      innerJoin(
        _db.albumToAsset,
        _db.albumToAsset.assetId.equalsExp(_db.asset.id) &
            _db.albumToAsset.albumId.equals(albumId),
        useColumns: false,
      ),
    ]);

    return await query
        .map((row) =>
            DriftModelConverters.toAssetModel(row.readTable(_db.asset)))
        .get();
  }

  @override
  Future<void> deleteAlbumId(int albumId) async {
    await _db.albumToAsset.deleteWhere((row) => row.albumId.equals(albumId));
  }

  @override
  Future<void> deleteAll() async {
    await _db.albumToAsset.deleteAll();
  }
}
