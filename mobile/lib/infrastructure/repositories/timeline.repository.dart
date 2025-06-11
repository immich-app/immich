import 'dart:async';

import 'package:drift/drift.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:immich_mobile/domain/interfaces/timeline.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftTimelineRepository extends DriftDatabaseRepository
    implements ITimelineRepository {
  final Drift _db;

  const DriftTimelineRepository(super._db) : _db = _db;

  @override
  Stream<List<Bucket>> watchMainBucket() {
    final assetCountExp = _db.mergedAssetView.name.count();
    final monthYearExp = _db.mergedAssetView.createdAt
        // DateTimes are stored in UTC, so we need to convert them to local time inside the query before formatting
        // to create the correct time bucket
        .modify(const DateTimeModifier.localTime())
        .date;

    final query = _db.mergedAssetView.selectOnly()
      ..addColumns([assetCountExp, monthYearExp])
      ..groupBy([monthYearExp])
      ..orderBy([OrderingTerm.desc(monthYearExp)]);

    return query.map((row) {
      final timeline = DateFormat("y-M-d").parse(row.read(monthYearExp)!);
      final assetCount = row.read(assetCountExp)!;
      return TimeBucket(date: timeline, assetCount: assetCount);
    }).watch();
  }

  @override
  Future<List<BaseAsset>> getMainBucketAssets({
    required int index,
    required int count,
  }) {
    final query = _db.mergedAssetView.select()
      ..orderBy([(row) => OrderingTerm.desc(row.createdAt)])
      ..limit(count, offset: index);
    return query.map((row) {
      final name = row.name;
      final width = row.width;
      final height = row.height;
      final isFavorite = row.isFavorite;
      final localId = row.localId;
      final remoteId = row.remoteId;
      final thumbHash = row.thumbHash;
      final checksum = row.checksum;
      final type = row.type;
      final createdAt = row.createdAt;
      final updatedAt = row.updatedAt;

      if (remoteId != null) {
        return Asset(
          id: remoteId,
          localId: localId,
          name: name,
          checksum: checksum,
          type: type,
          createdAt: createdAt,
          updatedAt: updatedAt,
          thumbHash: thumbHash,
          width: width,
          height: height,
          isFavorite: isFavorite,
          durationInSeconds: row.durationInSeconds,
        );
      }

      return LocalAsset(
        id: localId!,
        remoteId: remoteId,
        name: name,
        checksum: checksum,
        type: type,
        createdAt: createdAt,
        updatedAt: updatedAt,
        width: width,
        height: height,
        isFavorite: isFavorite,
        durationInSeconds: row.durationInSeconds,
      );
    }).get();
  }

  @override
  Stream<List<Bucket>> watchLocalBucket(String albumId) {
    final assetCountExp = _db.localAssetEntity.id.count();
    final monthYearExp = _db.localAssetEntity.createdAt
        // DateTimes are stored in UTC, so we need to convert them to local time inside the query before formatting
        // to create the correct time bucket
        .modify(const DateTimeModifier.localTime())
        .date;

    final query = _db.localAssetEntity.selectOnly()
      ..addColumns([assetCountExp, monthYearExp])
      ..join([
        innerJoin(
          _db.localAlbumAssetEntity,
          _db.localAlbumAssetEntity.assetId.equalsExp(_db.localAssetEntity.id),
        ),
      ])
      ..where(_db.localAlbumAssetEntity.albumId.equals(albumId))
      ..groupBy([monthYearExp])
      ..orderBy([OrderingTerm.desc(monthYearExp)]);

    return query.map((row) {
      final timeline = DateFormat("y-M-d").parse(row.read(monthYearExp)!);
      final assetCount = row.read(assetCountExp)!;
      return TimeBucket(date: timeline, assetCount: assetCount);
    }).watch();
  }

  @override
  Future<List<BaseAsset>> getLocalBucketAssets(
    String albumId, {
    required int index,
    required int count,
  }) {
    final query = _db.localAssetEntity.select()
      ..join(
        [
          innerJoin(
            _db.localAlbumAssetEntity,
            _db.localAlbumAssetEntity.assetId
                    .equalsExp(_db.localAssetEntity.id) &
                _db.localAlbumAssetEntity.albumId.equals(albumId),
          ),
        ],
      )
      ..orderBy([(row) => OrderingTerm.desc(row.createdAt)])
      ..limit(count, offset: index);
    return query.map((row) => row.toDto()).get();
  }
}
