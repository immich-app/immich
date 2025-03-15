import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/interfaces/timeline.interface.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/repositories/database.repository.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:isar/isar.dart';

final timelineRepositoryProvider =
    Provider((ref) => TimelineRepository(ref.watch(dbProvider)));

class TimelineRepository extends DatabaseRepository
    implements ITimelineRepository {
  TimelineRepository(super.db);

  @override
  Future<List<int>> getTimelineUserIds(int id) {
    return db.users
        .filter()
        .inTimelineEqualTo(true)
        .or()
        .isarIdEqualTo(id)
        .isarIdProperty()
        .findAll();
  }

  @override
  Stream<List<int>> watchTimelineUsers(int id) {
    return db.users
        .filter()
        .inTimelineEqualTo(true)
        .or()
        .isarIdEqualTo(id)
        .isarIdProperty()
        .watch();
  }

  @override
  Stream<RenderList> watchArchiveTimeline(int userId) {
    final query = db.assets
        .where()
        .ownerIdEqualToAnyChecksum(userId)
        .filter()
        .isArchivedEqualTo(true)
        .isTrashedEqualTo(false)
        .sortByFileCreatedAtDesc();

    return _watchRenderList(query, GroupAssetsBy.none);
  }

  @override
  Stream<RenderList> watchFavoriteTimeline(int userId) {
    final query = db.assets
        .where()
        .ownerIdEqualToAnyChecksum(userId)
        .filter()
        .isFavoriteEqualTo(true)
        .isTrashedEqualTo(false)
        .sortByFileCreatedAtDesc();

    return _watchRenderList(query, GroupAssetsBy.none);
  }

  @override
  Stream<RenderList> watchAlbumTimeline(
    Album album,
    GroupAssetsBy groupAssetByOption,
  ) {
    final query = album.assets.filter().isTrashedEqualTo(false);
    final withSortedOption = switch (album.sortOrder) {
      SortOrder.asc => query.sortByFileCreatedAt(),
      SortOrder.desc => query.sortByFileCreatedAtDesc(),
    };

    return _watchRenderList(withSortedOption, groupAssetByOption);
  }

  @override
  Stream<RenderList> watchTrashTimeline(int userId) {
    final query = db.assets
        .filter()
        .ownerIdEqualTo(userId)
        .isTrashedEqualTo(true)
        .sortByFileCreatedAtDesc();

    return _watchRenderList(query, GroupAssetsBy.none);
  }

  @override
  Stream<RenderList> watchAllVideosTimeline() {
    final query = db.assets
        .filter()
        .isArchivedEqualTo(false)
        .isTrashedEqualTo(false)
        .typeEqualTo(AssetType.video)
        .sortByFileCreatedAtDesc();

    return _watchRenderList(query, GroupAssetsBy.none);
  }

  @override
  Stream<RenderList> watchHomeTimeline(
    int userId,
    GroupAssetsBy groupAssetByOption,
  ) {
    final query = db.assets
        .where()
        .ownerIdEqualToAnyChecksum(userId)
        .filter()
        .isArchivedEqualTo(false)
        .isTrashedEqualTo(false)
        .stackPrimaryAssetIdIsNull()
        .sortByFileCreatedAtDesc();

    return _watchRenderList(query, groupAssetByOption);
  }

  @override
  Stream<RenderList> watchMultiUsersTimeline(
    List<int> userIds,
    GroupAssetsBy groupAssetByOption,
  ) {
    final query = db.assets
        .where()
        .anyOf(userIds, (qb, userId) => qb.ownerIdEqualToAnyChecksum(userId))
        .filter()
        .isArchivedEqualTo(false)
        .isTrashedEqualTo(false)
        .stackPrimaryAssetIdIsNull()
        .sortByFileCreatedAtDesc();
    return _watchRenderList(query, groupAssetByOption);
  }

  @override
  Future<RenderList> getTimelineFromAssets(
    List<Asset> assets,
    GroupAssetsBy getGroupByOption,
  ) {
    return RenderList.fromAssets(assets, getGroupByOption);
  }

  @override
  Stream<RenderList> watchAssetSelectionTimeline(int userId) {
    final query = db.assets
        .where()
        .remoteIdIsNotNull()
        .filter()
        .ownerIdEqualTo(userId)
        .isTrashedEqualTo(false)
        .stackPrimaryAssetIdIsNull()
        .sortByFileCreatedAtDesc();

    return _watchRenderList(query, GroupAssetsBy.none);
  }

  Stream<RenderList> _watchRenderList(
    QueryBuilder<Asset, Asset, QAfterSortBy> query,
    GroupAssetsBy groupAssetsBy,
  ) async* {
    yield await RenderList.fromQuery(query, groupAssetsBy);
    await for (final _ in query.watchLazy()) {
      yield await RenderList.fromQuery(query, groupAssetsBy);
    }
  }
}
