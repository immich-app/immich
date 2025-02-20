import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
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
  Stream<RenderList> watchArchiveTimeline(int userId) async* {
    final query = db.assets
        .where()
        .ownerIdEqualToAnyChecksum(userId)
        .filter()
        .isArchivedEqualTo(true)
        .isTrashedEqualTo(false)
        .sortByFileCreatedAtDesc();

    yield* _watchRenderList(query, GroupAssetsBy.none);
  }

  @override
  Stream<RenderList> watchFavoriteTimeline(int userId) async* {
    final query = db.assets
        .where()
        .ownerIdEqualToAnyChecksum(userId)
        .filter()
        .isFavoriteEqualTo(true)
        .isTrashedEqualTo(false)
        .sortByFileCreatedAtDesc();

    yield* _watchRenderList(query, GroupAssetsBy.none);
  }

  @override
  Stream<RenderList> watchAlbumTimeline(Album album) async* {
    final query = album.assets.filter().isTrashedEqualTo(false);
    final withSortedOption = switch (album.sortOrder) {
      SortOrder.asc => query.sortByFileCreatedAt(),
      SortOrder.desc => query.sortByFileCreatedAtDesc(),
    };

    yield* _watchRenderList(withSortedOption, GroupAssetsBy.none);
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
