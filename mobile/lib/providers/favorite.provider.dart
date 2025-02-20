import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/services/timeline.service.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';

final favoriteTimelineProvider = StreamProvider<RenderList>((ref) {
  final timelineService = ref.watch(timelineServiceProvider);
  return timelineService.watchFavoriteTimeline();
});
