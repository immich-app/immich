import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/interfaces/timeline.interface.dart';
import 'package:immich_mobile/interfaces/user.interface.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/repositories/timeline.repository.dart';
import 'package:immich_mobile/repositories/user.repository.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';

final timelineServiceProvider = Provider<TimelineService>((ref) {
  return TimelineService(
    ref.watch(timelineRepositoryProvider),
    ref.watch(userRepositoryProvider),
    ref.watch(appSettingsServiceProvider),
  );
});

class TimelineService {
  final ITimelineRepository _timelineRepository;
  final IUserRepository _userRepository;
  final AppSettingsService _appSettingsService;
  TimelineService(
    this._timelineRepository,
    this._userRepository,
    this._appSettingsService,
  );

  Stream<RenderList> watchHomeTimeline(int userId) {
    return _timelineRepository.watchHomeTimeline(userId, _getGroupByOption());
  }

  Stream<RenderList> watchMultiUsersTimeline(List<int> userIds) {
    return _timelineRepository.watchMultiUsersTimeline(
      userIds,
      _getGroupByOption(),
    );
  }

  Stream<RenderList> watchArchiveTimeline() async* {
    final user = await _userRepository.me();

    yield* _timelineRepository.watchArchiveTimeline(user.isarId);
  }

  Stream<RenderList> watchFavoriteTimeline() async* {
    final user = await _userRepository.me();

    yield* _timelineRepository.watchFavoriteTimeline(user.isarId);
  }

  Stream<RenderList> watchAlbumTimeline(Album album) async* {
    yield* _timelineRepository.watchAlbumTimeline(
      album,
      _getGroupByOption(),
    );
  }

  Stream<RenderList> watchTrashTimeline() async* {
    final user = await _userRepository.me();

    yield* _timelineRepository.watchTrashTimeline(user.isarId);
  }

  Stream<RenderList> watchAllVideosTimeline() {
    return _timelineRepository.watchAllVideosTimeline();
  }

  Future<RenderList> getTimelineFromAssets(
    List<Asset> assets,
    GroupAssetsBy? groupBy,
  ) {
    GroupAssetsBy groupOption = GroupAssetsBy.none;
    if (groupBy != null) {
      groupOption = groupBy;
    } else {
      groupOption = _getGroupByOption();
    }

    return _timelineRepository.getTimelineFromAssets(
      assets,
      groupOption,
    );
  }

  Stream<RenderList> watchAssetSelectionTimeline() async* {
    final user = await _userRepository.me();

    yield* _timelineRepository.watchAssetSelectionTimeline(user.isarId);
  }

  GroupAssetsBy _getGroupByOption() {
    return GroupAssetsBy
        .values[_appSettingsService.getSetting(AppSettingsEnum.groupAssetsBy)];
  }
}
