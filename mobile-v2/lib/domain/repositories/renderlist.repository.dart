import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/interfaces/renderlist.interface.dart';
import 'package:immich_mobile/domain/models/render_list.model.dart';
import 'package:immich_mobile/domain/models/render_list_element.model.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';
import 'package:immich_mobile/utils/extensions/drift.extension.dart';
import 'package:immich_mobile/utils/mixins/log.mixin.dart';

class RenderListRepository with LogMixin implements IRenderListRepository {
  final DriftDatabaseRepository _db;

  const RenderListRepository({required DriftDatabaseRepository db}) : _db = db;

  @override
  Stream<RenderList> watchAll() {
    final assetCountExp = _db.asset.id.count();
    final createdTimeExp = _db.asset.createdTime;
    final modifiedTimeExp = _db.asset.modifiedTime.max();
    final monthYearExp = createdTimeExp.strftime('%d-%m-%Y');

    final query = _db.asset.selectOnly()
      ..addColumns([assetCountExp, createdTimeExp, modifiedTimeExp])
      ..groupBy([monthYearExp])
      ..orderBy([OrderingTerm.desc(createdTimeExp)]);

    int lastAssetOffset = 0;
    DateTime recentModifiedTime = DateTime(1);

    return query
        .expand((row) {
          final createdTime = row.read<DateTime>(createdTimeExp)!;
          final assetCount = row.read(assetCountExp)!;
          final modifiedTime = row.read(modifiedTimeExp)!;
          final assetOffset = lastAssetOffset;
          lastAssetOffset += assetCount;

          // Get the recent modifed time. This is used to prevent unnecessary grid updates
          if (modifiedTime.isAfter(recentModifiedTime)) {
            recentModifiedTime = modifiedTime;
          }

          return [
            RenderListDayHeaderElement(date: createdTime),
            RenderListAssetElement(
              date: createdTime,
              assetCount: assetCount,
              assetOffset: assetOffset,
            ),
          ];
        })
        .watch()
        .map((elements) {
          // Resets the value in closure so the watch refresh will work properly
          lastAssetOffset = 0;
          final modified = recentModifiedTime;
          recentModifiedTime = DateTime(1);
          return RenderList(elements: elements, modifiedTime: modified);
        });
  }

  @override
  Future<RenderList> getAll() async {
    final assetCountExp = _db.asset.id.count();
    final createdTimeExp = _db.asset.createdTime;
    final modifiedTimeExp = _db.asset.modifiedTime.max();
    final monthYearExp = createdTimeExp.strftime('%d-%m-%Y');

    final query = _db.asset.selectOnly()
      ..addColumns([assetCountExp, createdTimeExp, modifiedTimeExp])
      ..groupBy([monthYearExp])
      ..orderBy([OrderingTerm.desc(createdTimeExp)]);

    int lastAssetOffset = 0;
    DateTime recentModifiedTime = DateTime(1);

    final elements = await query.expand((row) {
      final createdTime = row.read<DateTime>(createdTimeExp)!;
      final assetCount = row.read(assetCountExp)!;
      final modifiedTime = row.read(modifiedTimeExp)!;
      final assetOffset = lastAssetOffset;
      lastAssetOffset += assetCount;

      // Get the recent modifed time. This is used to prevent unnecessary grid updates
      if (modifiedTime.isAfter(recentModifiedTime)) {
        recentModifiedTime = modifiedTime;
      }

      return [
        RenderListDayHeaderElement(date: createdTime),
        RenderListAssetElement(
          date: createdTime,
          assetCount: assetCount,
          assetOffset: assetOffset,
        ),
      ];
    }).get();

    return RenderList(elements: elements, modifiedTime: recentModifiedTime);
  }
}
