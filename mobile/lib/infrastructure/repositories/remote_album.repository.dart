import 'dart:async';

import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album_user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

enum SortRemoteAlbumsBy { id, updatedAt }

class DriftRemoteAlbumRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftRemoteAlbumRepository(this._db) : super(_db);

  Future<List<RemoteAlbum>> getAll({
    Set<SortRemoteAlbumsBy> sortBy = const {SortRemoteAlbumsBy.updatedAt},
  }) {
    final assetCount = _db.remoteAlbumAssetEntity.assetId.count();

    final query = _db.remoteAlbumEntity.select().join([
      leftOuterJoin(
        _db.remoteAlbumAssetEntity,
        _db.remoteAlbumAssetEntity.albumId.equalsExp(_db.remoteAlbumEntity.id),
        useColumns: false,
      ),
      leftOuterJoin(
        _db.remoteAssetEntity,
        _db.remoteAssetEntity.id.equalsExp(_db.remoteAlbumAssetEntity.assetId),
        useColumns: false,
      ),
      leftOuterJoin(
        _db.userEntity,
        _db.userEntity.id.equalsExp(_db.remoteAlbumEntity.ownerId),
        useColumns: false,
      ),
    ]);
    query
      ..where(_db.remoteAssetEntity.deletedAt.isNull())
      ..addColumns([assetCount])
      ..addColumns([_db.userEntity.name])
      ..groupBy([_db.remoteAlbumEntity.id]);

    if (sortBy.isNotEmpty) {
      final orderings = <OrderingTerm>[];
      for (final sort in sortBy) {
        orderings.add(
          switch (sort) {
            SortRemoteAlbumsBy.id => OrderingTerm.asc(_db.remoteAlbumEntity.id),
            SortRemoteAlbumsBy.updatedAt =>
              OrderingTerm.desc(_db.remoteAlbumEntity.updatedAt),
          },
        );
      }
      query.orderBy(orderings);
    }

    return query
        .map(
          (row) => row.readTable(_db.remoteAlbumEntity).toDto(
                assetCount: row.read(assetCount) ?? 0,
                ownerName: row.read(_db.userEntity.name)!,
              ),
        )
        .get();
  }

  Future<void> create(
    RemoteAlbum album,
    List<String> assetIds,
  ) async {
    await _db.transaction(() async {
      final entity = RemoteAlbumEntityCompanion(
        id: Value(album.id),
        name: Value(album.name),
        ownerId: Value(album.ownerId),
        createdAt: Value(album.createdAt),
        updatedAt: Value(album.updatedAt),
        description: Value(album.description),
        thumbnailAssetId: Value(album.thumbnailAssetId),
        isActivityEnabled: Value(album.isActivityEnabled),
        order: Value(album.order),
      );

      await _db.remoteAlbumEntity.insertOne(entity);

      if (assetIds.isNotEmpty) {
        final albumAssets = assetIds.map(
          (assetId) => RemoteAlbumAssetEntityCompanion(
            albumId: Value(album.id),
            assetId: Value(assetId),
          ),
        );

        await _db.batch((batch) {
          batch.insertAll(
            _db.remoteAlbumAssetEntity,
            albumAssets,
          );
        });
      }
    });
  }

  Future<void> update(RemoteAlbum album) async {
    await _db.remoteAlbumEntity.update().replace(
          RemoteAlbumEntityCompanion(
            id: Value(album.id),
            name: Value(album.name),
            ownerId: Value(album.ownerId),
            createdAt: Value(album.createdAt),
            updatedAt: Value(album.updatedAt),
            description: Value(album.description),
            thumbnailAssetId: Value(album.thumbnailAssetId),
            isActivityEnabled: Value(album.isActivityEnabled),
            order: Value(album.order),
          ),
        );
  }

  Future<int> removeAssets(String albumId, List<String> assetIds) {
    return _db.remoteAlbumAssetEntity.deleteWhere(
      (tbl) => tbl.albumId.equals(albumId) & tbl.assetId.isIn(assetIds),
    );
  }

  FutureOr<(DateTime, DateTime)> getDateRange(String albumId) {
    final query = _db.remoteAlbumAssetEntity.selectOnly()
      ..where(_db.remoteAlbumAssetEntity.albumId.equals(albumId))
      ..addColumns([
        _db.remoteAssetEntity.createdAt.min(),
        _db.remoteAssetEntity.createdAt.max(),
      ])
      ..join([
        innerJoin(
          _db.remoteAssetEntity,
          _db.remoteAssetEntity.id
              .equalsExp(_db.remoteAlbumAssetEntity.assetId),
        ),
      ]);

    return query.map((row) {
      final minDate = row.read(_db.remoteAssetEntity.createdAt.min());
      final maxDate = row.read(_db.remoteAssetEntity.createdAt.max());
      return (minDate ?? DateTime.now(), maxDate ?? DateTime.now());
    }).getSingle();
  }

  Future<List<UserDto>> getSharedUsers(String albumId) async {
    final albumUserRows = await (_db.select(_db.remoteAlbumUserEntity)
          ..where((row) => row.albumId.equals(albumId)))
        .get();

    if (albumUserRows.isEmpty) {
      return [];
    }

    final userIds = albumUserRows.map((row) => row.userId);

    return (_db.select(_db.userEntity)..where((row) => row.id.isIn(userIds)))
        .map(
          (user) => UserDto(
            id: user.id,
            email: user.email,
            name: user.name,
            profileImagePath: user.profileImagePath?.isEmpty == true
                ? null
                : user.profileImagePath,
            isAdmin: user.isAdmin,
            updatedAt: user.updatedAt,
            quotaSizeInBytes: user.quotaSizeInBytes ?? 0,
            quotaUsageInBytes: user.quotaUsageInBytes,
            memoryEnabled: true,
            inTimeline: false,
            isPartnerSharedBy: false,
            isPartnerSharedWith: false,
          ),
        )
        .get();
  }

  Future<List<RemoteAsset>> getAssets(String albumId) {
    final query = _db.remoteAlbumAssetEntity.select().join([
      innerJoin(
        _db.remoteAssetEntity,
        _db.remoteAssetEntity.id.equalsExp(_db.remoteAlbumAssetEntity.assetId),
      ),
    ])
      ..where(_db.remoteAlbumAssetEntity.albumId.equals(albumId));

    return query
        .map((row) => row.readTable(_db.remoteAssetEntity).toDto())
        .get();
  }

  Future<int> addAssets(String albumId, List<String> assetIds) async {
    final albumAssets = assetIds.map(
      (assetId) => RemoteAlbumAssetEntityCompanion(
        albumId: Value(albumId),
        assetId: Value(assetId),
      ),
    );

    await _db.batch((batch) {
      batch.insertAll(
        _db.remoteAlbumAssetEntity,
        albumAssets,
      );
    });

    return assetIds.length;
  }

  Future<void> addUsers(String albumId, List<String> userIds) {
    final albumUsers = userIds.map(
      (assetId) => RemoteAlbumUserEntityCompanion(
        albumId: Value(albumId),
        userId: Value(assetId),
        role: const Value(AlbumUserRole.editor),
      ),
    );

    return _db.batch((batch) {
      batch.insertAll(
        _db.remoteAlbumUserEntity,
        albumUsers,
      );
    });
  }

  Future<void> deleteAlbum(String albumId) async {
    return _db.transaction(() async {
      await _db.remoteAlbumEntity.deleteWhere(
        (table) => table.id.equals(albumId),
      );
    });
  }

  Stream<RemoteAlbum?> watchAlbum(String albumId) {
    final query = _db.remoteAlbumEntity.select().join([
      leftOuterJoin(
        _db.remoteAlbumAssetEntity,
        _db.remoteAlbumAssetEntity.albumId.equalsExp(_db.remoteAlbumEntity.id),
        useColumns: false,
      ),
      leftOuterJoin(
        _db.remoteAssetEntity,
        _db.remoteAssetEntity.id.equalsExp(_db.remoteAlbumAssetEntity.assetId),
        useColumns: false,
      ),
      leftOuterJoin(
        _db.userEntity,
        _db.userEntity.id.equalsExp(_db.remoteAlbumEntity.ownerId),
        useColumns: false,
      ),
    ])
      ..where(_db.remoteAlbumEntity.id.equals(albumId))
      ..addColumns([_db.userEntity.name])
      ..groupBy([_db.remoteAlbumEntity.id]);

    return query.map((row) {
      final album = row.readTable(_db.remoteAlbumEntity).toDto(
            ownerName: row.read(_db.userEntity.name)!,
          );
      return album;
    }).watchSingleOrNull();
  }
}

extension on RemoteAlbumEntityData {
  RemoteAlbum toDto({int assetCount = 0, required String ownerName}) {
    return RemoteAlbum(
      id: id,
      name: name,
      ownerId: ownerId,
      createdAt: createdAt,
      updatedAt: updatedAt,
      description: description,
      thumbnailAssetId: thumbnailAssetId,
      isActivityEnabled: isActivityEnabled,
      order: order,
      assetCount: assetCount,
      ownerName: ownerName,
    );
  }
}
