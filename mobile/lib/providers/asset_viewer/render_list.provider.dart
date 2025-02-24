import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/services/timeline.service.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/utils/renderlist_generator.dart';
import 'package:isar/isar.dart';

final renderListProvider =
    FutureProvider.family<RenderList, List<Asset>>((ref, assets) {
  final timelineService = ref.watch(timelineServiceProvider);
  return timelineService.getTimelineFromAssets(
    assets,
    null,
  );
});

final renderListQueryProvider = StreamProvider.family<RenderList,
    QueryBuilder<Asset, Asset, QAfterSortBy>?>(
  (ref, query) =>
      query == null ? const Stream.empty() : renderListGenerator(query, ref),
);
