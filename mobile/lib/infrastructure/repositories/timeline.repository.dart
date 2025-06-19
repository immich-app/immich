import 'dart:async';

import 'package:drift/drift.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/interfaces/timeline.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:stream_transform/stream_transform.dart';

class DriftTimelineRepository extends DriftDatabaseRepository
    implements ITimelineRepository {
  final Drift _db;

  const DriftTimelineRepository(super._db) : _db = _db;

  List<Bucket> _generateBuckets(int count) {
    final numBuckets = (count / kTimelineNoneSegmentSize).floor();
    final buckets = List.generate(
      numBuckets,
      (_) => const Bucket(assetCount: kTimelineNoneSegmentSize),
    );
    if (count % kTimelineNoneSegmentSize != 0) {
      buckets.add(Bucket(assetCount: count % kTimelineNoneSegmentSize));
    }
    return buckets;
  }

  @override
  Stream<List<Bucket>> watchMainBucket(
    List<String> userIds, {
    GroupAssetsBy groupBy = GroupAssetsBy.day,
  }) {
    if (groupBy == GroupAssetsBy.none) {
      throw UnsupportedError(
        "GroupAssetsBy.none is not supported for watchMainBucket",
      );
    }

    return _db.mergedAssetDrift
        .mergedBucket(userIds, groupBy: groupBy.index)
        .map((row) {
          final date = row.bucketDate.dateFmt(groupBy);
          return TimeBucket(date: date, assetCount: row.assetCount);
        })
        .watch()
        .throttle(const Duration(seconds: 3), trailing: true);
  }

  @override
  Future<List<BaseAsset>> getMainBucketAssets(
    List<String> userIds, {
    required int offset,
    required int count,
  }) {
    return _db.mergedAssetDrift
        .mergedAsset(userIds, limit: Limit(count, offset))
        .map(
          (row) => row.remoteId != null
              ? Asset(
                  id: row.remoteId!,
                  localId: row.localId,
                  name: row.name,
                  checksum: row.checksum,
                  type: row.type,
                  createdAt: row.createdAt,
                  updatedAt: row.updatedAt,
                  thumbHash: row.thumbHash,
                  width: row.width,
                  height: row.height,
                  isFavorite: row.isFavorite,
                  durationInSeconds: row.durationInSeconds,
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
                ),
        )
        .get();
  }

  @override
  Stream<List<Bucket>> watchLocalBucket(
    String albumId, {
    GroupAssetsBy groupBy = GroupAssetsBy.day,
  }) {
    if (groupBy == GroupAssetsBy.none) {
      return _db.localAlbumAssetEntity
          .count(where: (row) => row.albumId.equals(albumId))
          .map(_generateBuckets)
          .watchSingle();
    }

    final assetCountExp = _db.localAssetEntity.id.count();
    final dateExp = _db.localAssetEntity.createdAt.dateFmt(groupBy);

    final query = _db.localAssetEntity.selectOnly()
      ..addColumns([assetCountExp, dateExp])
      ..join([
        innerJoin(
          _db.localAlbumAssetEntity,
          _db.localAlbumAssetEntity.assetId.equalsExp(_db.localAssetEntity.id),
        ),
      ])
      ..where(_db.localAlbumAssetEntity.albumId.equals(albumId))
      ..groupBy([dateExp])
      ..orderBy([OrderingTerm.desc(dateExp)]);

    return query.map((row) {
      final timeline = row.read(dateExp)!.dateFmt(groupBy);
      final assetCount = row.read(assetCountExp)!;
      return TimeBucket(date: timeline, assetCount: assetCount);
    }).watch();
  }

  @override
  Future<List<BaseAsset>> getLocalBucketAssets(
    String albumId, {
    required int offset,
    required int count,
  }) {
    final query = _db.localAssetEntity.select().join(
      [
        innerJoin(
          _db.localAlbumAssetEntity,
          _db.localAlbumAssetEntity.assetId.equalsExp(_db.localAssetEntity.id),
        ),
      ],
    )
      ..where(_db.localAlbumAssetEntity.albumId.equals(albumId))
      ..orderBy([OrderingTerm.desc(_db.localAssetEntity.createdAt)])
      ..limit(count, offset: offset);
    return query
        .map((row) => row.readTable(_db.localAssetEntity).toDto())
        .get();
  }
}

extension on Expression<DateTime> {
  Expression<String> dateFmt(GroupAssetsBy groupBy) {
    // DateTimes are stored in UTC, so we need to convert them to local time inside the query before formatting
    // to create the correct time bucket
    final localTimeExp = modify(const DateTimeModifier.localTime());
    return switch (groupBy) {
      GroupAssetsBy.day => localTimeExp.date,
      GroupAssetsBy.month => localTimeExp.strftime("%Y-%m"),
      GroupAssetsBy.none => throw ArgumentError(
          "GroupAssetsBy.none is not supported for date formatting",
        ),
    };
  }
}

extension on String {
  DateTime dateFmt(GroupAssetsBy groupBy) {
    final format = switch (groupBy) {
      GroupAssetsBy.day => "y-M-d",
      GroupAssetsBy.month => "y-M",
      GroupAssetsBy.none => throw ArgumentError(
          "GroupAssetsBy.none is not supported for date formatting",
        ),
    };
    try {
      return DateFormat(format).parse(this);
    } catch (e) {
      throw FormatException("Invalid date format: $this", e);
    }
  }
}
