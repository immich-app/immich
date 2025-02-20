import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/interfaces/timeline.interface.dart';
import 'package:immich_mobile/interfaces/user.interface.dart';
import 'package:immich_mobile/repositories/timeline.repository.dart';
import 'package:immich_mobile/repositories/user.repository.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';

final timelineServiceProvider = Provider<TimelineService>((ref) {
  return TimelineService(
    ref.watch(timelineRepositoryProvider),
    ref.watch(userRepositoryProvider),
  );
});

class TimelineService {
  final ITimelineRepository _timelineRepository;
  final IUserRepository _userRepository;

  TimelineService(this._timelineRepository, this._userRepository);

  Stream<RenderList> watchArchiveTimeline() async* {
    final user = await _userRepository.me();

    yield* _timelineRepository.watchArchiveTimeline(user.isarId);
  }

  Stream<RenderList> watchFavoriteTimeline() async* {
    final user = await _userRepository.me();

    yield* _timelineRepository.watchFavoriteTimeline(user.isarId);
  }

  Stream<RenderList> watchAlbumTimeline(Album album) async* {
    yield* _timelineRepository.watchAlbumTimeline(album);
  }

  Stream<RenderList> watchTrashTimeline() async* {
    final user = await _userRepository.me();

    yield* _timelineRepository.watchTrashTimeline(user.isarId);
  }

  Stream<RenderList> watchAllVideosTimeline() async* {
    yield* _timelineRepository.watchAllVideosTimeline();
  }
}
