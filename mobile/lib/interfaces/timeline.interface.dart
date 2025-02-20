import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';

abstract class ITimelineRepository {
  Stream<RenderList> watchArchiveTimeline(int userId);
  Stream<RenderList> watchFavoriteTimeline(int userId);
}
