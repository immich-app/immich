import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';

abstract class ITimelineRepository {
  Future<List<int>> getTimelineUserIds(int id);

  Stream<List<int>> watchTimelineUsers(int id);

  Stream<RenderList> watchArchiveTimeline(int userId);
  Stream<RenderList> watchFavoriteTimeline(int userId);
  Stream<RenderList> watchTrashTimeline(int userId);
  Stream<RenderList> watchAlbumTimeline(
    Album album,
    GroupAssetsBy groupAssetsBy,
  );
  Stream<RenderList> watchAllVideosTimeline();

  Stream<RenderList> watchHomeTimeline(int userId, GroupAssetsBy groupAssetsBy);
  Stream<RenderList> watchMultiUsersTimeline(
    List<int> userIds,
    GroupAssetsBy groupAssetsBy,
  );

  Future<RenderList> getTimelineFromAssets(
    List<Asset> assets,
    GroupAssetsBy getGroupByOption,
  );

  Stream<RenderList> watchAssetSelectionTimeline(int userId);
}
