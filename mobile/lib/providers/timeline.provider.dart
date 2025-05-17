import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';
import 'package:immich_mobile/providers/locale_provider.dart';
import 'package:immich_mobile/services/timeline.service.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';

final singleUserTimelineProvider = StreamProvider.family<RenderList, String?>(
  (ref, userId) {
    if (userId == null) {
      return const Stream.empty();
    }

    ref.watch(localeProvider);
    final timelineService = ref.watch(timelineServiceProvider);
    return timelineService.watchHomeTimeline(userId);
  },
  dependencies: [localeProvider],
);

final multiUsersTimelineProvider =
    StreamProvider.family<RenderList, List<String>>(
  (ref, userIds) {
    ref.watch(localeProvider);
    final timelineService = ref.watch(timelineServiceProvider);
    return timelineService.watchMultiUsersTimeline(userIds);
  },
  dependencies: [localeProvider],
);

final albumTimelineProvider =
    StreamProvider.autoDispose.family<RenderList, int>((ref, id) {
  final album = ref.watch(albumWatcher(id)).value;
  final timelineService = ref.watch(timelineServiceProvider);

  if (album != null) {
    return timelineService.watchAlbumTimeline(album);
  }

  return const Stream.empty();
});

final archiveTimelineProvider = StreamProvider<RenderList>((ref) {
  final timelineService = ref.watch(timelineServiceProvider);
  return timelineService.watchArchiveTimeline();
});

final favoriteTimelineProvider = StreamProvider<RenderList>((ref) {
  final timelineService = ref.watch(timelineServiceProvider);
  return timelineService.watchFavoriteTimeline();
});

final trashTimelineProvider = StreamProvider<RenderList>((ref) {
  final timelineService = ref.watch(timelineServiceProvider);
  return timelineService.watchTrashTimeline();
});

final allVideosTimelineProvider = StreamProvider<RenderList>((ref) {
  final timelineService = ref.watch(timelineServiceProvider);
  return timelineService.watchAllVideosTimeline();
});

final assetSelectionTimelineProvider = StreamProvider<RenderList>((ref) {
  final timelineService = ref.watch(timelineServiceProvider);
  return timelineService.watchAssetSelectionTimeline();
});

final assetsTimelineProvider =
    FutureProvider.family<RenderList, List<Asset>>((ref, assets) {
  final timelineService = ref.watch(timelineServiceProvider);
  return timelineService.getTimelineFromAssets(
    assets,
    null,
  );
});

final lockedTimelineProvider = StreamProvider<RenderList>((ref) {
  final timelineService = ref.watch(timelineServiceProvider);
  return timelineService.watchLockedTimelineProvider();
});
