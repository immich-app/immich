import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/infrastructure/repositories/timeline.repository.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.state.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';

final timelineRepositoryProvider = Provider<DriftTimelineRepository>(
  (ref) => DriftTimelineRepository(ref.watch(driftProvider)),
);

final timelineArgsProvider = Provider.autoDispose<TimelineArgs>(
  (ref) =>
      throw UnimplementedError('Will be overridden through a ProviderScope.'),
);

class TimelineServiceNotifier extends Notifier<TimelineService> {
  DriftTimelineRepository get _timelineRepository =>
      ref.read(timelineRepositoryProvider);

  GroupAssetsBy get groupBy => GroupAssetsBy
      .values[ref.read(settingsProvider).get(Setting.groupAssetsBy)];

  @override
  TimelineService build() {
    final timelineUsers = ref.watch(timelineUsersIdsProvider);
    final service = TimelineService(
      assetSource: (offset, count) => _timelineRepository
          .getMainBucketAssets(timelineUsers, offset: offset, count: count),
      bucketSource: () =>
          _timelineRepository.watchMainBucket(timelineUsers, groupBy: groupBy),
    );
    ref.onDispose(service.dispose);
    return service;
  }

  void localAlbum({required String albumId}) {
    final service = TimelineService(
      assetSource: (offset, count) => _timelineRepository
          .getLocalBucketAssets(albumId, offset: offset, count: count),
      bucketSource: () =>
          _timelineRepository.watchLocalBucket(albumId, groupBy: groupBy),
    );
    ref.onDispose(service.dispose);
    state = service;
  }

  void remoteAlbum({required String albumId}) {
    final service = TimelineService(
      assetSource: (offset, count) => _timelineRepository
          .getRemoteBucketAssets(albumId, offset: offset, count: count),
      bucketSource: () =>
          _timelineRepository.watchRemoteBucket(albumId, groupBy: groupBy),
    );
    ref.onDispose(service.dispose);
    state = service;
  }
}

final timelineServiceNotifier =
    NotifierProvider<TimelineServiceNotifier, TimelineService>(
  TimelineServiceNotifier.new,
);
