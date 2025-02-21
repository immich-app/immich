import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';

abstract class ITimelineRepository {
  Stream<RenderList> watchArchiveTimeline(int userId);
  Stream<RenderList> watchFavoriteTimeline(int userId);
  Stream<RenderList> watchTrashTimeline(int userId);
  Stream<RenderList> watchAlbumTimeline(Album album);
  Stream<RenderList> watchAllVideosTimeline();

  Stream<RenderList> watchHomeTimeline(int userId, GroupAssetsBy groupAssetsBy);
  Stream<RenderList> watchMultiUsersTimeline(
    List<int> userIds,
    GroupAssetsBy groupAssetsBy,
  );
}
