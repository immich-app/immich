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
  Stream<List<Bucket>> watchLocalTimeBuckets() {
    final assetCountExp = _db.localAssetEntity.id.count();
    final monthYearExp = _db.localAssetEntity.createdAt
        // DateTimes are stored in UTC, so we need to convert them to local time inside the query before formatting
        // to create the correct time bucket
        .modify(const DateTimeModifier.localTime())
        .date;

    final query = _db.localAssetEntity.selectOnly()
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
  Future<List<BaseAsset>> getLocalTimeBucket(int index, int count) {
    final query = _db.localAssetEntity.select()
      ..orderBy([(row) => OrderingTerm.desc(row.createdAt)])
      ..limit(count, offset: index);
    return query.map((row) => row.toDto()).get();
  }
}
