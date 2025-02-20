import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';
import 'package:immich_mobile/services/timeline.service.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';

final albumTimelineProvider =
    StreamProvider.autoDispose.family<RenderList, int>((ref, id) {
  final album = ref.watch(albumWatcher(id)).value;

  if (album != null) {
    return ref.watch(timelineServiceProvider).watchAlbumTimeline(album);
  }

  return const Stream.empty();
});
