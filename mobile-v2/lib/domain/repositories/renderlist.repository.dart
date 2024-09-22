import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/interfaces/renderlist.interface.dart';
import 'package:immich_mobile/domain/models/render_list.model.dart';
import 'package:immich_mobile/domain/models/render_list_element.model.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';
import 'package:immich_mobile/utils/extensions/drift.extension.dart';
import 'package:immich_mobile/utils/mixins/log.mixin.dart';

class RenderListDriftRepository with LogMixin implements IRenderListRepository {
  final DriftDatabaseRepository _db;

  const RenderListDriftRepository(this._db);

  @override
  Stream<RenderList> watchAll() {
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
        .map((elements) {
          // Resets the value in closure so the watch refresh will work properly
          lastAssetOffset = 0;
          return RenderList(elements: elements);
        });
  }
}
