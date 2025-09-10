import 'dart:async';

import 'package:drift/drift.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/map.repository.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:stream_transform/stream_transform.dart';

class DriftTimelineRepository extends DriftDatabaseRepository {
  final Drift _db;

  const DriftTimelineRepository(super._db) : _db = _db;

  Stream<List<String>> watchTimelineUserIds(String userId) {
    final query = _db.partnerEntity.selectOnly()
      ..addColumns([_db.partnerEntity.sharedById])
      ..where(_db.partnerEntity.inTimeline.equals(true) & _db.partnerEntity.sharedWithId.equals(userId));

    return query
        .map((row) => row.read(_db.partnerEntity.sharedById)!)
        .watch()
        // Add current user ID to the list
        .map((users) => users..add(userId));
  }

  TimelineQuery main(List<String> userIds, GroupAssetsBy groupBy) => (
    bucketSource: () => _watchMainBucket(userIds, groupBy: groupBy),
    assetSource: (offset, count) => _getMainBucketAssets(userIds, offset: offset, count: count),
  );

  Stream<List<Bucket>> _watchMainBucket(List<String> userIds, {GroupAssetsBy groupBy = GroupAssetsBy.day}) {
    if (groupBy == GroupAssetsBy.none) {
      throw UnsupportedError("GroupAssetsBy.none is not supported for watchMainBucket");
    }

    return _db.mergedAssetDrift
        .mergedBucket(userIds: userIds, groupBy: groupBy.index)
        .map((row) {
          final date = row.bucketDate.dateFmt(groupBy);
          return TimeBucket(date: date, assetCount: row.assetCount);
        })
        .watch()
        .throttle(const Duration(seconds: 3), trailing: true);
  }

  Future<List<BaseAsset>> _getMainBucketAssets(List<String> userIds, {required int offset, required int count}) {
    return _db.mergedAssetDrift
        .mergedAsset(userIds: userIds, limit: (_) => Limit(count, offset))
        .map(
          (row) => row.remoteId != null && row.ownerId != null
              ? RemoteAsset(
                  id: row.remoteId!,
                  localId: row.localId,
                  name: row.name,
                  ownerId: row.ownerId!,
                  checksum: row.checksum,
                  type: row.type,
                  createdAt: row.createdAt,
                  updatedAt: row.updatedAt,
                  thumbHash: row.thumbHash,
                  width: row.width,
                  height: row.height,
                  isFavorite: row.isFavorite,
                  durationInSeconds: row.durationInSeconds,
                  livePhotoVideoId: row.livePhotoVideoId,
                  stackId: row.stackId,
                )
              : LocalAsset(
                  id: row.localId!,
                  remoteId: row.remoteId,
                  name: row.name,
                  checksum: row.checksum,
                  type: row.type,
                  createdAt: row.createdAt,
                  updatedAt: row.updatedAt,
                  width: row.width,
                  height: row.height,
                  isFavorite: row.isFavorite,
                  durationInSeconds: row.durationInSeconds,
                  orientation: row.orientation,
                ),
        )
        .get();
  }

  TimelineQuery localAlbum(String albumId, GroupAssetsBy groupBy) => (
    bucketSource: () => _watchLocalAlbumBucket(albumId, groupBy: groupBy),
    assetSource: (offset, count) => _getLocalAlbumBucketAssets(albumId, offset: offset, count: count),
  );

  Stream<List<Bucket>> _watchLocalAlbumBucket(String albumId, {GroupAssetsBy groupBy = GroupAssetsBy.day}) {
    if (groupBy == GroupAssetsBy.none) {
      return _db.localAlbumAssetEntity
          .count(where: (row) => row.albumId.equals(albumId))
          .map(_generateBuckets)
          .watchSingle();
    }

    final assetCountExp = _db.localAssetEntity.id.count();
    final dateExp = _db.localAssetEntity.createdAt.dateFmt(groupBy);

    final query =
        _db.localAssetEntity.selectOnly().join([
            innerJoin(
              _db.localAlbumAssetEntity,
              _db.localAlbumAssetEntity.assetId.equalsExp(_db.localAssetEntity.id),
              useColumns: false,
            ),
            leftOuterJoin(
              _db.remoteAssetEntity,
              _db.localAssetEntity.checksum.equalsExp(_db.remoteAssetEntity.checksum),
              useColumns: false,
            ),
          ])
          ..addColumns([assetCountExp, dateExp])
          ..where(_db.localAlbumAssetEntity.albumId.equals(albumId))
          ..groupBy([dateExp])
          ..orderBy([OrderingTerm.desc(dateExp)]);

    return query.map((row) {
      final timeline = row.read(dateExp)!.dateFmt(groupBy);
      final assetCount = row.read(assetCountExp)!;
      return TimeBucket(date: timeline, assetCount: assetCount);
    }).watch();
  }

  Future<List<BaseAsset>> _getLocalAlbumBucketAssets(String albumId, {required int offset, required int count}) {
    final query =
        _db.localAssetEntity.select().join([
            innerJoin(
              _db.localAlbumAssetEntity,
              _db.localAlbumAssetEntity.assetId.equalsExp(_db.localAssetEntity.id),
              useColumns: false,
            ),
            leftOuterJoin(
              _db.remoteAssetEntity,
              _db.localAssetEntity.checksum.equalsExp(_db.remoteAssetEntity.checksum),
              useColumns: false,
            ),
          ])
          ..addColumns([_db.remoteAssetEntity.id])
          ..where(_db.localAlbumAssetEntity.albumId.equals(albumId))
          ..orderBy([OrderingTerm.desc(_db.localAssetEntity.createdAt)])
          ..limit(count, offset: offset);

    return query.map((row) {
      final asset = row.readTable(_db.localAssetEntity).toDto();
      return asset.copyWith(remoteId: row.read(_db.remoteAssetEntity.id));
    }).get();
  }

  TimelineQuery remoteAlbum(String albumId, GroupAssetsBy groupBy) => (
    bucketSource: () => _watchRemoteAlbumBucket(albumId, groupBy: groupBy),
    assetSource: (offset, count) => _getRemoteAlbumBucketAssets(albumId, offset: offset, count: count),
  );

  Stream<List<Bucket>> _watchRemoteAlbumBucket(String albumId, {GroupAssetsBy groupBy = GroupAssetsBy.day}) {
    if (groupBy == GroupAssetsBy.none) {
      return _db.remoteAlbumAssetEntity
          .count(where: (row) => row.albumId.equals(albumId))
          .map(_generateBuckets)
          .watch()
          .map((results) => results.isNotEmpty ? results.first : <Bucket>[])
          .handleError((error) {
            return [];
          });
    }

    return (_db.remoteAlbumEntity.select()..where((row) => row.id.equals(albumId)))
        .watch()
        .switchMap((albums) {
          if (albums.isEmpty) {
            return Stream.value(<Bucket>[]);
          }

          final album = albums.first;
          final isAscending = album.order == AlbumAssetOrder.asc;
          final assetCountExp = _db.remoteAssetEntity.id.count();
          final dateExp = _db.remoteAssetEntity.createdAt.dateFmt(groupBy);

          final query = _db.remoteAssetEntity.selectOnly()
            ..addColumns([assetCountExp, dateExp])
            ..join([
              innerJoin(
                _db.remoteAlbumAssetEntity,
                _db.remoteAlbumAssetEntity.assetId.equalsExp(_db.remoteAssetEntity.id),
                useColumns: false,
              ),
            ])
            ..where(_db.remoteAssetEntity.deletedAt.isNull() & _db.remoteAlbumAssetEntity.albumId.equals(albumId))
            ..groupBy([dateExp]);

          if (isAscending) {
            query.orderBy([OrderingTerm.asc(dateExp)]);
          } else {
            query.orderBy([OrderingTerm.desc(dateExp)]);
          }

          return query.map((row) {
            final timeline = row.read(dateExp)!.dateFmt(groupBy);
            final assetCount = row.read(assetCountExp)!;
            return TimeBucket(date: timeline, assetCount: assetCount);
          }).watch();
        })
        .handleError((error) {
          // If there's an error (e.g., album was deleted), return empty buckets
          return <Bucket>[];
        });
  }

  Future<List<BaseAsset>> _getRemoteAlbumBucketAssets(String albumId, {required int offset, required int count}) async {
    final albumData = await (_db.remoteAlbumEntity.select()..where((row) => row.id.equals(albumId))).getSingleOrNull();

    // If album doesn't exist (was deleted), return empty list
    if (albumData == null) {
      return <BaseAsset>[];
    }

    final isAscending = albumData.order == AlbumAssetOrder.asc;

    final query = _db.remoteAssetEntity.select().join([
      innerJoin(
        _db.remoteAlbumAssetEntity,
        _db.remoteAlbumAssetEntity.assetId.equalsExp(_db.remoteAssetEntity.id),
        useColumns: false,
      ),
    ])..where(_db.remoteAssetEntity.deletedAt.isNull() & _db.remoteAlbumAssetEntity.albumId.equals(albumId));

    if (isAscending) {
      query.orderBy([OrderingTerm.asc(_db.remoteAssetEntity.createdAt)]);
    } else {
      query.orderBy([OrderingTerm.desc(_db.remoteAssetEntity.createdAt)]);
    }

    query.limit(count, offset: offset);

    return query.map((row) => row.readTable(_db.remoteAssetEntity).toDto()).get();
  }

  TimelineQuery fromAssets(List<BaseAsset> assets) => (
    bucketSource: () => Stream.value(_generateBuckets(assets.length)),
    assetSource: (offset, count) => Future.value(assets.skip(offset).take(count).toList()),
  );

  TimelineQuery remote(String ownerId, GroupAssetsBy groupBy) => _remoteQueryBuilder(
    filter: (row) =>
        row.deletedAt.isNull() & row.visibility.equalsValue(AssetVisibility.timeline) & row.ownerId.equals(ownerId),
    groupBy: groupBy,
  );

  TimelineQuery favorite(String userId, GroupAssetsBy groupBy) => _remoteQueryBuilder(
    filter: (row) =>
        row.deletedAt.isNull() &
        row.isFavorite.equals(true) &
        row.ownerId.equals(userId) &
        row.visibility.equalsValue(AssetVisibility.timeline),
    groupBy: groupBy,
  );

  TimelineQuery trash(String userId, GroupAssetsBy groupBy) => _remoteQueryBuilder(
    filter: (row) => row.deletedAt.isNotNull() & row.ownerId.equals(userId),
    groupBy: groupBy,
    joinLocal: true,
  );

  TimelineQuery archived(String userId, GroupAssetsBy groupBy) => _remoteQueryBuilder(
    filter: (row) =>
        row.deletedAt.isNull() & row.ownerId.equals(userId) & row.visibility.equalsValue(AssetVisibility.archive),
    groupBy: groupBy,
  );

  TimelineQuery locked(String userId, GroupAssetsBy groupBy) => _remoteQueryBuilder(
    filter: (row) =>
        row.deletedAt.isNull() & row.visibility.equalsValue(AssetVisibility.locked) & row.ownerId.equals(userId),
    groupBy: groupBy,
  );

  TimelineQuery video(String userId, GroupAssetsBy groupBy) => _remoteQueryBuilder(
    filter: (row) =>
        row.deletedAt.isNull() &
        row.type.equalsValue(AssetType.video) &
        row.visibility.equalsValue(AssetVisibility.timeline) &
        row.ownerId.equals(userId),
    groupBy: groupBy,
  );

  TimelineQuery place(String place, GroupAssetsBy groupBy) => (
    bucketSource: () => _watchPlaceBucket(place, groupBy: groupBy),
    assetSource: (offset, count) => _getPlaceBucketAssets(place, offset: offset, count: count),
  );

  TimelineQuery person(String userId, String personId, GroupAssetsBy groupBy) => (
    bucketSource: () => _watchPersonBucket(userId, personId, groupBy: groupBy),
    assetSource: (offset, count) => _getPersonBucketAssets(userId, personId, offset: offset, count: count),
  );

  Stream<List<Bucket>> _watchPlaceBucket(String place, {GroupAssetsBy groupBy = GroupAssetsBy.day}) {
    if (groupBy == GroupAssetsBy.none) {
      // TODO: implement GroupAssetBy for place
      throw UnsupportedError("GroupAssetsBy.none is not supported for watchPlaceBucket");
    }

    final assetCountExp = _db.remoteAssetEntity.id.count();
    final dateExp = _db.remoteAssetEntity.createdAt.dateFmt(groupBy);

    final query = _db.remoteAssetEntity.selectOnly()
      ..addColumns([assetCountExp, dateExp])
      ..join([
        innerJoin(
          _db.remoteExifEntity,
          _db.remoteExifEntity.assetId.equalsExp(_db.remoteAssetEntity.id),
          useColumns: false,
        ),
      ])
      ..where(
        _db.remoteExifEntity.city.equals(place) &
            _db.remoteAssetEntity.deletedAt.isNull() &
            _db.remoteAssetEntity.visibility.equalsValue(AssetVisibility.timeline),
      )
      ..groupBy([dateExp])
      ..orderBy([OrderingTerm.desc(dateExp)]);

    return query.map((row) {
      final timeline = row.read(dateExp)!.dateFmt(groupBy);
      final assetCount = row.read(assetCountExp)!;
      return TimeBucket(date: timeline, assetCount: assetCount);
    }).watch();
  }

  Future<List<BaseAsset>> _getPlaceBucketAssets(String place, {required int offset, required int count}) {
    final query =
        _db.remoteAssetEntity.select().join([
            innerJoin(
              _db.remoteExifEntity,
              _db.remoteExifEntity.assetId.equalsExp(_db.remoteAssetEntity.id),
              useColumns: false,
            ),
          ])
          ..where(
            _db.remoteAssetEntity.deletedAt.isNull() &
                _db.remoteAssetEntity.visibility.equalsValue(AssetVisibility.timeline) &
                _db.remoteExifEntity.city.equals(place),
          )
          ..orderBy([OrderingTerm.desc(_db.remoteAssetEntity.createdAt)])
          ..limit(count, offset: offset);
    return query.map((row) => row.readTable(_db.remoteAssetEntity).toDto()).get();
  }

  Stream<List<Bucket>> _watchPersonBucket(String userId, String personId, {GroupAssetsBy groupBy = GroupAssetsBy.day}) {
    if (groupBy == GroupAssetsBy.none) {
      final query = _db.remoteAssetEntity.selectOnly()
        ..addColumns([_db.remoteAssetEntity.id.count()])
        ..join([
          innerJoin(
            _db.assetFaceEntity,
            _db.assetFaceEntity.assetId.equalsExp(_db.remoteAssetEntity.id),
            useColumns: false,
          ),
        ])
        ..where(
          _db.remoteAssetEntity.deletedAt.isNull() &
              _db.remoteAssetEntity.ownerId.equals(userId) &
              _db.remoteAssetEntity.visibility.equalsValue(AssetVisibility.timeline) &
              _db.assetFaceEntity.personId.equals(personId),
        );

      return query.map((row) {
        final count = row.read(_db.remoteAssetEntity.id.count())!;
        return _generateBuckets(count);
      }).watchSingle();
    }

    final assetCountExp = _db.remoteAssetEntity.id.count();
    final dateExp = _db.remoteAssetEntity.createdAt.dateFmt(groupBy);

    final query = _db.remoteAssetEntity.selectOnly()
      ..addColumns([assetCountExp, dateExp])
      ..join([
        innerJoin(
          _db.assetFaceEntity,
          _db.assetFaceEntity.assetId.equalsExp(_db.remoteAssetEntity.id),
          useColumns: false,
        ),
      ])
      ..where(
        _db.remoteAssetEntity.deletedAt.isNull() &
            _db.remoteAssetEntity.ownerId.equals(userId) &
            _db.remoteAssetEntity.visibility.equalsValue(AssetVisibility.timeline) &
            _db.assetFaceEntity.personId.equals(personId),
      )
      ..groupBy([dateExp])
      ..orderBy([OrderingTerm.desc(dateExp)]);

    return query.map((row) {
      final timeline = row.read(dateExp)!.dateFmt(groupBy);
      final assetCount = row.read(assetCountExp)!;
      return TimeBucket(date: timeline, assetCount: assetCount);
    }).watch();
  }

  Future<List<BaseAsset>> _getPersonBucketAssets(
    String userId,
    String personId, {
    required int offset,
    required int count,
  }) {
    final query =
        _db.remoteAssetEntity.select().join([
            innerJoin(
              _db.assetFaceEntity,
              _db.assetFaceEntity.assetId.equalsExp(_db.remoteAssetEntity.id),
              useColumns: false,
            ),
          ])
          ..where(
            _db.remoteAssetEntity.deletedAt.isNull() &
                _db.remoteAssetEntity.ownerId.equals(userId) &
                _db.remoteAssetEntity.visibility.equalsValue(AssetVisibility.timeline) &
                _db.assetFaceEntity.personId.equals(personId),
          )
          ..orderBy([OrderingTerm.desc(_db.remoteAssetEntity.createdAt)])
          ..limit(count, offset: offset);

    return query.map((row) => row.readTable(_db.remoteAssetEntity).toDto()).get();
  }

  TimelineQuery map(LatLngBounds bounds, GroupAssetsBy groupBy) => (
    bucketSource: () => _watchMapBucket(bounds, groupBy: groupBy),
    assetSource: (offset, count) => _getMapBucketAssets(bounds, offset: offset, count: count),
  );

  Stream<List<Bucket>> _watchMapBucket(LatLngBounds bounds, {GroupAssetsBy groupBy = GroupAssetsBy.day}) {
    if (groupBy == GroupAssetsBy.none) {
      // TODO: Support GroupAssetsBy.none
      throw UnsupportedError("GroupAssetsBy.none is not supported for _watchMapBucket");
    }

    final assetCountExp = _db.remoteAssetEntity.id.count();
    final dateExp = _db.remoteAssetEntity.createdAt.dateFmt(groupBy);

    final query = _db.remoteAssetEntity.selectOnly()
      ..addColumns([assetCountExp, dateExp])
      ..join([
        innerJoin(
          _db.remoteExifEntity,
          _db.remoteExifEntity.assetId.equalsExp(_db.remoteAssetEntity.id),
          useColumns: false,
        ),
      ])
      ..where(
        _db.remoteExifEntity.inBounds(bounds) &
            _db.remoteAssetEntity.visibility.equalsValue(AssetVisibility.timeline) &
            _db.remoteAssetEntity.deletedAt.isNull(),
      )
      ..groupBy([dateExp])
      ..orderBy([OrderingTerm.desc(dateExp)]);

    return query.map((row) {
      final timeline = row.read(dateExp)!.dateFmt(groupBy);
      final assetCount = row.read(assetCountExp)!;
      return TimeBucket(date: timeline, assetCount: assetCount);
    }).watch();
  }

  Future<List<BaseAsset>> _getMapBucketAssets(LatLngBounds bounds, {required int offset, required int count}) {
    final query =
        _db.remoteAssetEntity.select().join([
            innerJoin(
              _db.remoteExifEntity,
              _db.remoteExifEntity.assetId.equalsExp(_db.remoteAssetEntity.id),
              useColumns: false,
            ),
          ])
          ..where(
            _db.remoteExifEntity.inBounds(bounds) &
                _db.remoteAssetEntity.visibility.equalsValue(AssetVisibility.timeline) &
                _db.remoteAssetEntity.deletedAt.isNull(),
          )
          ..orderBy([OrderingTerm.desc(_db.remoteAssetEntity.createdAt)])
          ..limit(count, offset: offset);
    return query.map((row) => row.readTable(_db.remoteAssetEntity).toDto()).get();
  }

  TimelineQuery _remoteQueryBuilder({
    required Expression<bool> Function($RemoteAssetEntityTable row) filter,
    GroupAssetsBy groupBy = GroupAssetsBy.day,
    bool joinLocal = false,
  }) {
    return (
      bucketSource: () => _watchRemoteBucket(filter: filter, groupBy: groupBy),
      assetSource: (offset, count) =>
          _getRemoteAssets(filter: filter, offset: offset, count: count, joinLocal: joinLocal),
    );
  }

  Stream<List<Bucket>> _watchRemoteBucket({
    required Expression<bool> Function($RemoteAssetEntityTable row) filter,
    GroupAssetsBy groupBy = GroupAssetsBy.day,
  }) {
    if (groupBy == GroupAssetsBy.none) {
      final query = _db.remoteAssetEntity.count(where: filter);
      return query.map(_generateBuckets).watchSingle();
    }

    final assetCountExp = _db.remoteAssetEntity.id.count();
    final dateExp = _db.remoteAssetEntity.createdAt.dateFmt(groupBy);

    final query = _db.remoteAssetEntity.selectOnly()
      ..addColumns([assetCountExp, dateExp])
      ..where(filter(_db.remoteAssetEntity))
      ..groupBy([dateExp])
      ..orderBy([OrderingTerm.desc(dateExp)]);

    return query.map((row) {
      final timeline = row.read(dateExp)!.dateFmt(groupBy);
      final assetCount = row.read(assetCountExp)!;
      return TimeBucket(date: timeline, assetCount: assetCount);
    }).watch();
  }

  Future<List<BaseAsset>> _getRemoteAssets({
    required Expression<bool> Function($RemoteAssetEntityTable row) filter,
    required int offset,
    required int count,
    bool joinLocal = false,
  }) {
    if (joinLocal) {
      final query =
          _db.remoteAssetEntity.select().join([
              leftOuterJoin(
                _db.localAssetEntity,
                _db.remoteAssetEntity.checksum.equalsExp(_db.localAssetEntity.checksum),
                useColumns: false,
              ),
            ])
            ..addColumns([_db.localAssetEntity.id])
            ..where(filter(_db.remoteAssetEntity))
            ..orderBy([OrderingTerm.desc(_db.remoteAssetEntity.createdAt)])
            ..limit(count, offset: offset);

      return query.map((row) {
        final asset = row.readTable(_db.remoteAssetEntity).toDto();
        final localId = row.read(_db.localAssetEntity.id);
        return asset.copyWith(localId: localId);
      }).get();
    } else {
      final query = _db.remoteAssetEntity.select()
        ..where(filter)
        ..orderBy([(row) => OrderingTerm.desc(row.createdAt)])
        ..limit(count, offset: offset);

      return query.map((row) => row.toDto()).get();
    }
  }
}

List<Bucket> _generateBuckets(int count) {
  final buckets = List.generate(
    (count / kTimelineNoneSegmentSize).floor(),
    (_) => const Bucket(assetCount: kTimelineNoneSegmentSize),
  );
  if (count % kTimelineNoneSegmentSize != 0) {
    buckets.add(Bucket(assetCount: count % kTimelineNoneSegmentSize));
  }
  return buckets;
}

extension on Expression<DateTime> {
  Expression<String> dateFmt(GroupAssetsBy groupBy) {
    // DateTimes are stored in UTC, so we need to convert them to local time inside the query before formatting
    // to create the correct time bucket
    final localTimeExp = modify(const DateTimeModifier.localTime());
    return switch (groupBy) {
      GroupAssetsBy.day || GroupAssetsBy.auto => localTimeExp.date,
      GroupAssetsBy.month => localTimeExp.strftime("%Y-%m"),
      GroupAssetsBy.none => throw ArgumentError("GroupAssetsBy.none is not supported for date formatting"),
    };
  }
}

extension on String {
  DateTime dateFmt(GroupAssetsBy groupBy) {
    final format = switch (groupBy) {
      GroupAssetsBy.day || GroupAssetsBy.auto => "y-M-d",
      GroupAssetsBy.month => "y-M",
      GroupAssetsBy.none => throw ArgumentError("GroupAssetsBy.none is not supported for date formatting"),
    };
    try {
      return DateFormat(format).parse(this);
    } catch (e) {
      throw FormatException("Invalid date format: $this", e);
    }
  }
}
