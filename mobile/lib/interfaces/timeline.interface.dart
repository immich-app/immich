import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';

abstract class ITimelineRepository {
  Future<List<String>> getTimelineUserIds(String id);

  Stream<List<String>> watchTimelineUsers(String id);

  Stream<RenderList> watchArchiveTimeline(String userId);
  Stream<RenderList> watchFavoriteTimeline(String userId);
  Stream<RenderList> watchTrashTimeline(String userId);
  Stream<RenderList> watchAlbumTimeline(
    Album album,
    GroupAssetsBy groupAssetsBy,
  );
  Stream<RenderList> watchAllVideosTimeline();

  Stream<RenderList> watchHomeTimeline(
    String userId,
    GroupAssetsBy groupAssetsBy,
  );
  Stream<RenderList> watchMultiUsersTimeline(
    List<String> userIds,
    GroupAssetsBy groupAssetsBy,
  );

  Future<RenderList> getTimelineFromAssets(
    List<Asset> assets,
    GroupAssetsBy getGroupByOption,
  );

  Stream<RenderList> watchAssetSelectionTimeline(String userId);
}
