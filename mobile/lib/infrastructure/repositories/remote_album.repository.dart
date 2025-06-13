import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/interfaces/remote_album.interface.dart';
import 'package:immich_mobile/domain/models/album/base_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftRemoteAlbumRepository extends DriftDatabaseRepository
    implements IRemoteAlbumRepository {
  final Drift _db;
  const DriftRemoteAlbumRepository(this._db) : super(_db);

  @override
  Future<List<Album>> getAll() {
    final assetCount = _db.remoteAlbumAssetEntity.assetId.count();

    final query = _db.remoteAlbumEntity.select().join([
      leftOuterJoin(
        _db.remoteAlbumAssetEntity,
        _db.remoteAlbumAssetEntity.albumId.equalsExp(_db.remoteAlbumEntity.id),
        useColumns: false,
      ),
    ]);
    query
      ..addColumns([assetCount])
      ..groupBy([_db.remoteAlbumEntity.id]);

    return query
        .map(
          (row) => row
              .readTable(_db.remoteAlbumEntity)
              .toDto(assetCount: row.read(assetCount) ?? 0),
        )
        .get();
  }

  @override
  Future<void> delete(String albumId) => transaction(() async {
        await _db.managers.remoteAlbumEntity
            .filter((a) => a.id.equals(albumId))
            .delete();
      });

  @override
  Future<void> upsert(
    String ownerId,
    Album remoteAlbum, {
    Iterable<String> toUpsert = const [],
    Iterable<String> toDelete = const [],
  }) {
    final companion = RemoteAlbumEntityCompanion.insert(
      id: remoteAlbum.id,
      name: remoteAlbum.name,
      description: remoteAlbum.description,
      createdAt: Value(remoteAlbum.createdAt),
      updatedAt: Value(remoteAlbum.updatedAt),
      ownerId: ownerId,
      thumbnailAssetId: Value(remoteAlbum.thumbnailAssetId),
      isActivityEnabled: Value(remoteAlbum.isActivityEnabled),
      order: remoteAlbum.order,
    );

    return _db.transaction(() async {
      await _db.remoteAlbumEntity
          .insertOne(companion, onConflict: DoUpdate((_) => companion));
      if (toUpsert.isNotEmpty) {
        await _db.remoteAlbumAssetEntity.insertAll(
          toUpsert.map(
            (assetId) => RemoteAlbumAssetEntityCompanion.insert(
              assetId: assetId,
              albumId: remoteAlbum.id,
            ),
          ),
          mode: InsertMode.insertOrIgnore,
        );
      }
      if (toDelete.isNotEmpty) {
        await _db.batch(
          (batch) => batch.deleteWhere(
            _db.remoteAlbumAssetEntity,
            (f) => f.assetId.isIn(toDelete),
          ),
        );
      }
    });
  }

  @override
  Future<void> updateAll(String ownerId, Iterable<Album> albums) {
    return _db.transaction(() async {
      await _db.batch((batch) {
        for (final album in albums) {
          final companion = RemoteAlbumEntityCompanion.insert(
            id: album.id,
            name: album.name,
            description: album.description,
            createdAt: Value(album.createdAt),
            updatedAt: Value(album.updatedAt),
            ownerId: ownerId,
            thumbnailAssetId: Value(album.thumbnailAssetId),
            isActivityEnabled: Value(album.isActivityEnabled),
            order: album.order,
          );

          batch.insert(
            _db.remoteAlbumEntity,
            companion,
            onConflict: DoUpdate((_) => companion),
          );
        }
      });
    });
  }

  @override
  Future<List<Asset>> getAssets(String albumId) {
    final query = _db.remoteAlbumAssetEntity.select().join(
      [
        innerJoin(
          _db.remoteAssetEntity,
          _db.remoteAlbumAssetEntity.assetId.equalsExp(_db.remoteAssetEntity.id),
        ),
      ],
    )
      ..where(_db.remoteAlbumAssetEntity.albumId.equals(albumId))
      ..orderBy([OrderingTerm.asc(_db.remoteAssetEntity.id)]);
    return query
        .map((row) => row.readTable(_db.remoteAssetEntity).toDto())
        .get();
  }

  @override
  Future<List<String>> getAssetIds(String albumId) {
    final query = _db.remoteAlbumAssetEntity.selectOnly()
      ..addColumns([_db.remoteAlbumAssetEntity.assetId])
      ..where(_db.remoteAlbumAssetEntity.albumId.equals(albumId));
    return query
        .map((row) => row.read(_db.remoteAlbumAssetEntity.assetId)!)
        .get();
  }
}

extension on RemoteAlbumEntityData {
  Album toDto({int assetCount = 0}) {
    return Album(
      id: id,
      name: name,
      description: description,
      createdAt: createdAt,
      updatedAt: updatedAt,
      thumbnailAssetId: thumbnailAssetId,
      isActivityEnabled: isActivityEnabled,
      order: order,
      assetCount: assetCount,
    );
  }
}

extension on RemoteAssetEntityData {
  Asset toDto() {
    return Asset(
      id: id,
      name: name,
      checksum: checksum,
      type: type,
      createdAt: createdAt,
      updatedAt: updatedAt,
      width: width,
      height: height,
      durationInSeconds: durationInSeconds,
    );
  }
}
