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

  Future<List<RemoteAlbum>> getAll({Set<SortRemoteAlbumsBy> sortBy = const {SortRemoteAlbumsBy.updatedAt}}) {
    final assetCount = _db.remoteAlbumAssetEntity.assetId.count(distinct: true);

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
      leftOuterJoin(_db.userEntity, _db.userEntity.id.equalsExp(_db.remoteAlbumEntity.ownerId), useColumns: false),
      leftOuterJoin(
        _db.remoteAlbumUserEntity,
        _db.remoteAlbumUserEntity.albumId.equalsExp(_db.remoteAlbumEntity.id),
        useColumns: false,
      ),
    ]);
    query
      ..where(_db.remoteAssetEntity.deletedAt.isNull())
      ..addColumns([assetCount])
      ..addColumns([_db.userEntity.name])
      ..addColumns([_db.remoteAlbumUserEntity.userId.count(distinct: true)])
      ..groupBy([_db.remoteAlbumEntity.id]);

    if (sortBy.isNotEmpty) {
      final orderings = <OrderingTerm>[];
      for (final sort in sortBy) {
        orderings.add(switch (sort) {
          SortRemoteAlbumsBy.id => OrderingTerm.asc(_db.remoteAlbumEntity.id),
          SortRemoteAlbumsBy.updatedAt => OrderingTerm.desc(_db.remoteAlbumEntity.updatedAt),
        });
      }
      query.orderBy(orderings);
    }

    return query
        .map(
          (row) => row
              .readTable(_db.remoteAlbumEntity)
              .toDto(
                assetCount: row.read(assetCount) ?? 0,
                ownerName: row.read(_db.userEntity.name)!,
                isShared: row.read(_db.remoteAlbumUserEntity.userId.count(distinct: true))! > 2,
              ),
        )
        .get();
  }

  Future<RemoteAlbum?> get(String albumId) {
    final assetCount = _db.remoteAlbumAssetEntity.assetId.count(distinct: true);

    final query =
        _db.remoteAlbumEntity.select().join([
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
            leftOuterJoin(
              _db.remoteAlbumUserEntity,
              _db.remoteAlbumUserEntity.albumId.equalsExp(_db.remoteAlbumEntity.id),
              useColumns: false,
            ),
          ])
          ..where(_db.remoteAlbumEntity.id.equals(albumId) & _db.remoteAssetEntity.deletedAt.isNull())
          ..addColumns([assetCount])
          ..addColumns([_db.userEntity.name])
          ..addColumns([_db.remoteAlbumUserEntity.userId.count(distinct: true)])
          ..groupBy([_db.remoteAlbumEntity.id]);

    return query
        .map(
          (row) => row
              .readTable(_db.remoteAlbumEntity)
              .toDto(
                assetCount: row.read(assetCount) ?? 0,
                ownerName: row.read(_db.userEntity.name)!,
                isShared: row.read(_db.remoteAlbumUserEntity.userId.count(distinct: true))! > 2,
              ),
        )
        .getSingleOrNull();
  }

  Future<RemoteAlbum?> getByName(String albumName, String ownerId) {
    final query = _db.remoteAlbumEntity.select()
      ..where((row) => row.name.equals(albumName) & row.ownerId.equals(ownerId))
      ..orderBy([(row) => OrderingTerm.desc(row.createdAt)])
      ..limit(1);

    return query.map((row) => row.toDto(ownerName: '', isShared: false)).getSingleOrNull();
  }

  Future<void> create(RemoteAlbum album, List<String> assetIds) async {
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
          (assetId) => RemoteAlbumAssetEntityCompanion(albumId: Value(album.id), assetId: Value(assetId)),
        );

        await _db.batch((batch) {
          batch.insertAll(_db.remoteAlbumAssetEntity, albumAssets);
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
    return _db.remoteAlbumAssetEntity.deleteWhere((tbl) => tbl.albumId.equals(albumId) & tbl.assetId.isIn(assetIds));
  }

  FutureOr<(DateTime, DateTime)> getDateRange(String albumId) {
    final query = _db.remoteAlbumAssetEntity.selectOnly()
      ..where(_db.remoteAlbumAssetEntity.albumId.equals(albumId))
      ..addColumns([_db.remoteAssetEntity.createdAt.min(), _db.remoteAssetEntity.createdAt.max()])
      ..join([
        innerJoin(_db.remoteAssetEntity, _db.remoteAssetEntity.id.equalsExp(_db.remoteAlbumAssetEntity.assetId)),
      ]);

    return query.map((row) {
      final minDate = row.read(_db.remoteAssetEntity.createdAt.min());
      final maxDate = row.read(_db.remoteAssetEntity.createdAt.max());
      return (minDate ?? DateTime.now(), maxDate ?? DateTime.now());
    }).getSingle();
  }

  Future<List<UserDto>> getSharedUsers(String albumId) async {
    final albumUserRows = await (_db.select(
      _db.remoteAlbumUserEntity,
    )..where((row) => row.albumId.equals(albumId))).get();

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
            memoryEnabled: true,
            inTimeline: false,
            isPartnerSharedBy: false,
            isPartnerSharedWith: false,
            profileChangedAt: user.profileChangedAt,
            hasProfileImage: user.hasProfileImage,
            avatarColor: user.avatarColor,
          ),
        )
        .get();
  }

  Future<List<RemoteAsset>> getAssets(String albumId) {
    final query = _db.remoteAlbumAssetEntity.select().join([
      innerJoin(_db.remoteAssetEntity, _db.remoteAssetEntity.id.equalsExp(_db.remoteAlbumAssetEntity.assetId)),
    ])..where(_db.remoteAlbumAssetEntity.albumId.equals(albumId));

    return query.map((row) => row.readTable(_db.remoteAssetEntity).toDto()).get();
  }

  Future<int> addAssets(String albumId, List<String> assetIds) async {
    final albumAssets = assetIds.map(
      (assetId) => RemoteAlbumAssetEntityCompanion(albumId: Value(albumId), assetId: Value(assetId)),
    );

    await _db.batch((batch) {
      batch.insertAll(_db.remoteAlbumAssetEntity, albumAssets);
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
      batch.insertAll(_db.remoteAlbumUserEntity, albumUsers);
    });
  }

  Future<void> removeUser(String albumId, {required String userId}) {
    return _db.remoteAlbumUserEntity.deleteWhere((row) => row.albumId.equals(albumId) & row.userId.equals(userId));
  }

  Future<void> deleteAlbum(String albumId) async {
    return _db.transaction(() async {
      await _db.remoteAlbumEntity.deleteWhere((table) => table.id.equals(albumId));
    });
  }

  Future<void> setActivityStatus(String albumId, bool isEnabled) async {
    final query = _db.update(_db.remoteAlbumEntity)..where((row) => row.id.equals(albumId));

    await query.write(RemoteAlbumEntityCompanion(isActivityEnabled: Value(isEnabled)));
  }

  Stream<RemoteAlbum?> watchAlbum(String albumId) {
    final query =
        _db.remoteAlbumEntity.select().join([
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
            leftOuterJoin(
              _db.remoteAlbumUserEntity,
              _db.remoteAlbumUserEntity.albumId.equalsExp(_db.remoteAlbumEntity.id),
              useColumns: false,
            ),
          ])
          ..where(_db.remoteAlbumEntity.id.equals(albumId))
          ..addColumns([_db.userEntity.name])
          ..addColumns([_db.remoteAlbumUserEntity.userId.count(distinct: true)])
          ..groupBy([_db.remoteAlbumEntity.id]);

    return query.map((row) {
      final album = row
          .readTable(_db.remoteAlbumEntity)
          .toDto(
            ownerName: row.read(_db.userEntity.name)!,
            isShared: row.read(_db.remoteAlbumUserEntity.userId.count(distinct: true))! > 2,
          );
      return album;
    }).watchSingleOrNull();
  }

  Future<DateTime?> getNewestAssetTimestamp(String albumId) {
    final query = _db.remoteAlbumAssetEntity.selectOnly()
      ..where(_db.remoteAlbumAssetEntity.albumId.equals(albumId))
      ..addColumns([_db.remoteAssetEntity.localDateTime.max()])
      ..join([
        innerJoin(_db.remoteAssetEntity, _db.remoteAssetEntity.id.equalsExp(_db.remoteAlbumAssetEntity.assetId)),
      ]);

    return query.map((row) => row.read(_db.remoteAssetEntity.localDateTime.max())).getSingleOrNull();
  }

  Future<DateTime?> getOldestAssetTimestamp(String albumId) {
    final query = _db.remoteAlbumAssetEntity.selectOnly()
      ..where(_db.remoteAlbumAssetEntity.albumId.equals(albumId))
      ..addColumns([_db.remoteAssetEntity.localDateTime.min()])
      ..join([
        innerJoin(_db.remoteAssetEntity, _db.remoteAssetEntity.id.equalsExp(_db.remoteAlbumAssetEntity.assetId)),
      ]);

    return query.map((row) => row.read(_db.remoteAssetEntity.localDateTime.min())).getSingleOrNull();
  }

  Future<int> getCount() {
    return _db.managers.remoteAlbumEntity.count();
  }

  Future<List<String>> getLinkedAssetIds(String userId, String localAlbumId, String remoteAlbumId) async {
    // Find remote asset ids that:
    // 1. Belong to the provided local album (via local_album_asset_entity)
    // 2. Have been uploaded (i.e. a matching remote asset exists for the same checksum & owner)
    // 3. Are NOT already in the remote album (remote_album_asset_entity)
    final query = _db.remoteAssetEntity.selectOnly()
      ..addColumns([_db.remoteAssetEntity.id])
      ..join([
        innerJoin(
          _db.localAssetEntity,
          _db.remoteAssetEntity.checksum.equalsExp(_db.localAssetEntity.checksum),
          useColumns: false,
        ),
        innerJoin(
          _db.localAlbumAssetEntity,
          _db.localAlbumAssetEntity.assetId.equalsExp(_db.localAssetEntity.id),
          useColumns: false,
        ),
        // Left join remote album assets to exclude those already in the remote album
        leftOuterJoin(
          _db.remoteAlbumAssetEntity,
          _db.remoteAlbumAssetEntity.assetId.equalsExp(_db.remoteAssetEntity.id) &
              _db.remoteAlbumAssetEntity.albumId.equals(remoteAlbumId),
          useColumns: false,
        ),
      ])
      ..where(
        _db.remoteAssetEntity.ownerId.equals(userId) &
            _db.remoteAssetEntity.deletedAt.isNull() &
            _db.localAlbumAssetEntity.albumId.equals(localAlbumId) &
            _db.remoteAlbumAssetEntity.assetId.isNull(), // only those not yet linked
      );

    return query.map((row) => row.read(_db.remoteAssetEntity.id)!).get();
  }
}

extension on RemoteAlbumEntityData {
  RemoteAlbum toDto({int assetCount = 0, required String ownerName, required bool isShared}) {
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
      isShared: isShared,
    );
  }
}
