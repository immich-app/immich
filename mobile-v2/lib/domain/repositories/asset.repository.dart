import 'dart:async';

import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/entities/asset.entity.drift.dart';
import 'package:immich_mobile/domain/interfaces/asset.interface.dart';
import 'package:immich_mobile/domain/models/asset.model.dart';
import 'package:immich_mobile/domain/models/render_list.model.dart';
import 'package:immich_mobile/domain/models/render_list_element.model.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';
import 'package:immich_mobile/utils/extensions/drift.extension.dart';
import 'package:immich_mobile/utils/mixins/log_context.mixin.dart';

class RemoteAssetDriftRepository with LogContext implements IAssetRepository {
  final DriftDatabaseRepository _db;

  const RemoteAssetDriftRepository(this._db);

  @override
  Future<bool> addAll(Iterable<Asset> assets) async {
    try {
      await _db.batch((batch) => batch.insertAllOnConflictUpdate(
            _db.asset,
            assets.map(_toEntity),
          ));

      return true;
    } catch (e, s) {
      log.severe("Cannot insert remote assets into table", e, s);
      return false;
    }
  }

  @override
  Future<bool> clearAll() async {
    try {
      await _db.asset.deleteAll();
      return true;
    } catch (e, s) {
      log.severe("Cannot clear remote assets", e, s);
      return false;
    }
  }

  @override
  Future<List<Asset>> fetchAssets({int? offset, int? limit}) async {
    final query = _db.asset.select()
      ..orderBy([(asset) => OrderingTerm.desc(asset.createdTime)]);

    if (limit != null) {
      query.limit(limit, offset: offset);
    }

    return (await query.get()).map(_toModel).toList();
  }

  @override
  Stream<RenderList> watchRenderList() {
    final assetCountExp = _db.asset.id.count();
    final createdTimeExp = _db.asset.createdTime;
    final monthYearExp = _db.asset.createdTime.strftime('%m-%Y');

    final query = _db.asset.selectOnly()
      ..addColumns([assetCountExp, createdTimeExp])
      ..groupBy([monthYearExp])
      ..orderBy([OrderingTerm.desc(createdTimeExp)]);

    int lastAssetOffset = 0;

    return query
        .expand((row) {
          final createdTime = row.read<DateTime>(createdTimeExp)!;
          final assetCount = row.read(assetCountExp)!;
          final assetOffset = lastAssetOffset;
          lastAssetOffset += assetCount;

          return [
            RenderListMonthHeaderElement(date: createdTime),
            RenderListAssetElement(
              date: createdTime,
              assetCount: assetCount,
              assetOffset: assetOffset,
            ),
          ];
        })
        .watch()
        .map((elements) => RenderList(elements: elements));
  }
}

AssetCompanion _toEntity(Asset asset) {
  return AssetCompanion.insert(
    localId: Value(asset.localId),
    remoteId: Value(asset.remoteId),
    name: asset.name,
    checksum: asset.checksum,
    height: Value(asset.height),
    width: Value(asset.width),
    type: asset.type,
    createdTime: asset.createdTime,
    duration: Value(asset.duration),
    modifiedTime: Value(asset.modifiedTime),
    livePhotoVideoId: Value(asset.livePhotoVideoId),
  );
}

Asset _toModel(AssetData asset) {
  return Asset(
    id: asset.id,
    localId: asset.localId,
    remoteId: asset.remoteId,
    name: asset.name,
    type: asset.type,
    checksum: asset.checksum,
    createdTime: asset.createdTime,
    modifiedTime: asset.modifiedTime,
    height: asset.height,
    width: asset.width,
    livePhotoVideoId: asset.livePhotoVideoId,
    duration: asset.duration,
  );
}
